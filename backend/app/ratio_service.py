"""Service penghubung data accrual-lite ke ratio engine.

Tidak ada perhitungan rasio di sini; semua formula tetap di ratio_engine.py.
Service ini hanya:
- membaca snapshot neraca,
- membaca laba-rugi dari transaksi,
- menyusun RatioInputs,
- mengambil threshold efektif,
- menyimpan hasil ke ratio_snapshots.
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Optional, Tuple

from . import models
from .ratio_engine import (
    DEFAULT_THRESHOLDS,
    RATIO_FORMULA_VERSION,
    RatioInputs,
    compute_ratios,
)
from .ratio_narrative import fallback_narrative


def _money(value: Optional[Decimal]) -> Optional[str]:
    if value is None:
        return None
    return str(value.quantize(Decimal("0.01")))


def _account_role(account: models.Account) -> str:
    """Role eksplisit diutamakan; fallback nama akun untuk data lama."""
    if account.account_role:
        return account.account_role

    name = (account.name or "").lower()
    code = (account.code or "").lower()

    if code.startswith("1001") or "kas" in name or "bank" in name:
        return "cash"
    if "piutang" in name:
        return "receivable"
    if "persediaan" in name:
        return "inventory"
    if "dibayar dimuka" in name or "prepaid" in name:
        return "prepaid"
    if "utang usaha" in name or "hutang usaha" in name:
        return "payable"
    if "pajak" in name and account.account_type == "liability":
        return "tax_payable"
    if "pinjaman" in name and account.account_type == "liability":
        return "short_term_loan"
    if account.account_type == "equity":
        return "equity"
    if account.account_type == "revenue":
        return "revenue"
    if account.account_type == "expense":
        return "operating_expense"
    return "other"


def get_snapshot(
    db, organization_id: int, as_of: date
) -> Optional[models.BalanceSnapshot]:
    return (
        db.query(models.BalanceSnapshot)
        .filter(
            models.BalanceSnapshot.organization_id == organization_id,
            models.BalanceSnapshot.as_of_date <= as_of,
        )
        .order_by(models.BalanceSnapshot.as_of_date.desc())
        .first()
    )


def get_previous_snapshot(
    db, organization_id: int, before_date: date
) -> Optional[models.BalanceSnapshot]:
    return (
        db.query(models.BalanceSnapshot)
        .filter(
            models.BalanceSnapshot.organization_id == organization_id,
            models.BalanceSnapshot.as_of_date < before_date,
        )
        .order_by(models.BalanceSnapshot.as_of_date.desc())
        .first()
    )


def _snapshot_lines(db, snapshot_id: int):
    return (
        db.query(models.BalanceSnapshotLine, models.Account)
        .join(
            models.Account,
            models.BalanceSnapshotLine.account_id == models.Account.id,
        )
        .filter(models.BalanceSnapshotLine.snapshot_id == snapshot_id)
        .all()
    )


def _aggregate_snapshot(db, snapshot: Optional[models.BalanceSnapshot]):
    """Kembalikan (roles, totals, line_rows, warnings)."""
    if snapshot is None:
        return {}, {}, [], ["Tidak ada balance snapshot untuk periode ini."]

    rows = _snapshot_lines(db, snapshot.id)
    if not rows:
        return {}, {}, [], ["Balance snapshot ada, tetapi belum memiliki baris akun."]

    roles: Dict[str, Decimal] = {}
    total_assets = Decimal("0")
    total_liabilities = Decimal("0")
    total_equity = Decimal("0")
    has_asset = has_liability = has_equity = False

    for line, account in rows:
        amount = Decimal(str(line.amount))
        role = _account_role(account)
        roles[role] = roles.get(role, Decimal("0")) + amount

        if account.account_type == "asset":
            has_asset = True
            total_assets += amount
        elif account.account_type == "liability":
            has_liability = True
            total_liabilities += amount
        elif account.account_type == "equity":
            has_equity = True
            total_equity += amount

    warnings = []
    if not has_equity:
        warnings.append("Baris ekuitas belum tersedia; DER/ROE tidak dapat dihitung.")
    if not has_asset:
        warnings.append("Baris aset belum tersedia; DAR/ROA tidak dapat dihitung.")

    totals = {
        "total_assets": total_assets if has_asset else None,
        "total_liabilities": total_liabilities if has_liability else None,
        "total_equity": total_equity if has_equity else None,
    }
    return roles, totals, rows, warnings


def build_ratio_inputs(
    db,
    organization_id: int,
    period_from: date,
    period_to: date,
    as_of: Optional[date] = None,
) -> Tuple[RatioInputs, dict]:
    """Susun input rasio dari snapshot + transaksi periode."""
    as_of = as_of or period_to
    snapshot = get_snapshot(db, organization_id, as_of)
    previous = (
        get_previous_snapshot(db, organization_id, snapshot.as_of_date)
        if snapshot is not None
        else None
    )

    roles, totals, _rows, warnings = _aggregate_snapshot(db, snapshot)
    prev_roles, prev_totals, _prev_rows, prev_warnings = _aggregate_snapshot(
        db, previous
    )
    warnings.extend(w for w in prev_warnings if w not in warnings)

    # Laba-rugi dari transaksi posted, tanpa baris reversal.
    tx_rows = (
        db.query(models.Transaction, models.Category)
        .outerjoin(
            models.Category,
            models.Transaction.category_id == models.Category.id,
        )
        .filter(
            models.Transaction.organization_id == organization_id,
            models.Transaction.transaction_date >= period_from,
            models.Transaction.transaction_date <= period_to,
            models.Transaction.status == "posted",
            models.Transaction.reversal_of_id.is_(None),
        )
        .all()
    )

    revenue = Decimal("0")
    refund = Decimal("0")
    cogs = Decimal("0")
    operating = Decimal("0")
    interest = Decimal("0")
    tax = Decimal("0")
    has_revenue = has_expense = False
    cogs_configured = False
    uncategorized = 0

    for tx, category in tx_rows:
        amount = Decimal(str(tx.amount))
        if tx.tx_type == "income":
            revenue += amount
            has_revenue = True
        elif tx.tx_type == "refund":
            refund += amount
        elif tx.tx_type == "expense":
            has_expense = True
            if category is None:
                uncategorized += 1
                operating += amount
                continue
            if category.is_cogs:
                cogs_configured = True
                cogs += amount
                continue
            # Kategori dengan akun bunga/pajak memisahkan komponen dari opex.
            account = (
                db.query(models.Account)
                .filter(models.Account.id == category.account_id)
                .first()
                if category.account_id is not None
                else None
            )
            role = _account_role(account) if account is not None else ""
            if role == "interest_expense":
                interest += amount
            elif role == "tax_expense":
                tax += amount
            else:
                operating += amount

    if has_expense and not cogs_configured:
        # Jangan menganggap seluruh beban sebagai HPP; margin kotor akan palsu.
        cogs_value = None
        warnings.append(
            "Klasifikasi HPP belum lengkap; GPM/OPM/INV_TURN/DPO tidak dapat dihitung."
        )
    else:
        cogs_value = cogs

    if not has_revenue:
        warnings.append("Tidak ada transaksi pendapatan pada periode ini.")
    if uncategorized:
        warnings.append(f"{uncategorized} transaksi beban belum berkategori.")

    net_revenue = revenue - refund
    net_profit = (
        net_revenue - cogs - operating - interest - tax
        if cogs_value is not None
        else None
    )

    days = max((period_to - period_from).days + 1, 1)

    # Pendapatan periode sebelumnya (panjang periode sama, tepat sebelumnya).
    prior_to = period_from - timedelta(days=1)
    prior_from = prior_to - timedelta(days=days - 1)
    prior_rows = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.organization_id == organization_id,
            models.Transaction.transaction_date >= prior_from,
            models.Transaction.transaction_date <= prior_to,
            models.Transaction.status == "posted",
            models.Transaction.reversal_of_id.is_(None),
            models.Transaction.tx_type.in_(["income", "refund"]),
        )
        .all()
    )
    prior_revenue = sum(
        (Decimal(str(tx.amount)) for tx in prior_rows if tx.tx_type == "income"),
        Decimal("0"),
    ) - sum(
        (Decimal(str(tx.amount)) for tx in prior_rows if tx.tx_type == "refund"),
        Decimal("0"),
    )
    if not prior_rows:
        prior_revenue_value = None
        warnings.append("Pendapatan periode sebelumnya tidak tersedia.")
    else:
        prior_revenue_value = prior_revenue

    inputs = RatioInputs(
        cash=roles.get("cash"),
        receivables=roles.get("receivable"),
        inventory=roles.get("inventory"),
        prepaid=roles.get("prepaid"),
        other_current_assets=roles.get("other_current_asset"),
        accounts_payable=roles.get("payable"),
        short_term_loans=roles.get("short_term_loan"),
        tax_payable=roles.get("tax_payable"),
        total_assets=totals.get("total_assets"),
        total_liabilities=totals.get("total_liabilities"),
        total_equity=totals.get("total_equity"),
        beginning_inventory=prev_roles.get("inventory"),
        beginning_receivables=prev_roles.get("receivable"),
        beginning_payables=prev_roles.get("payable"),
        beginning_assets=prev_totals.get("total_assets"),
        beginning_equity=prev_totals.get("total_equity"),
        revenue=net_revenue,
        prior_revenue=prior_revenue_value,
        cogs=cogs_value,
        operating_expenses=operating,
        interest_expense=interest,
        tax_expense=tax,
        net_profit=net_profit,
        days=days,
    )

    meta = {
        "snapshot_id": snapshot.id if snapshot else None,
        "as_of": str(snapshot.as_of_date) if snapshot else str(as_of),
        "previous_snapshot_id": previous.id if previous else None,
        "previous_as_of": str(previous.as_of_date) if previous else None,
        "snapshot_status": snapshot.status if snapshot else "unavailable",
        "transaction_count": len(tx_rows),
        "warnings": warnings,
    }
    return inputs, meta


def effective_thresholds(
    db, organization_id: int, industry: Optional[str] = None
) -> Dict[str, tuple]:
    """Gabungkan default dengan override organisasi/industri."""
    result = dict(DEFAULT_THRESHOLDS)
    rows = (
        db.query(models.RatioThreshold)
        .filter(
            models.RatioThreshold.is_active.is_(True),
            (models.RatioThreshold.organization_id == organization_id)
            | (models.RatioThreshold.organization_id.is_(None)),
        )
        .all()
    )

    # Spesifisitas: org+industry > org > industry > global.
    def rank(row):
        return (
            1 if row.organization_id == organization_id else 0,
            1 if industry and row.industry == industry else 0,
        )

    for row in sorted(rows, key=rank):
        if row.target is None or row.warning is None or row.critical is None:
            continue
        result[row.ratio_code] = (
            Decimal(str(row.target)),
            Decimal(str(row.warning)),
            Decimal(str(row.critical)),
            row.direction or "higher",
        )
    return result


def threshold_list(
    db, organization_id: int, industry: Optional[str] = None
) -> list[dict]:
    effective = effective_thresholds(db, organization_id, industry)
    rows = []
    for code in [
        "CR", "QR", "CASH_RATIO", "DER", "DAR", "ICR", "INV_TURN", "ACP",
        "DPO", "TATO", "GPM", "OPM", "NPM", "ROA", "ROE", "REV_GROWTH",
    ]:
        value = effective.get(code)
        rows.append({
            "ratio_code": code,
            "target": _money(value[0]) if value else None,
            "warning": _money(value[1]) if value else None,
            "critical": _money(value[2]) if value else None,
            "direction": value[3] if value else None,
            "source": "effective",
        })
    return rows


def compute_ratio_snapshot(
    db,
    organization_id: int,
    period_from: date,
    period_to: date,
    as_of: Optional[date] = None,
    industry: Optional[str] = None,
    persist: bool = True,
) -> dict:
    inputs, meta = build_ratio_inputs(
        db, organization_id, period_from, period_to, as_of=as_of
    )
    thresholds = effective_thresholds(db, organization_id, industry)
    result = compute_ratios(
        inputs,
        period_from,
        period_to,
        as_of=as_of or period_to,
        thresholds=thresholds,
    )
    result["source"] = meta
    result["data_quality"]["warnings"] = (
        result["data_quality"]["warnings"] + meta["warnings"]
    )

    if persist:
        existing = (
            db.query(models.RatioSnapshot)
            .filter_by(
                organization_id=organization_id,
                period_from=period_from,
                period_to=period_to,
                formula_version=RATIO_FORMULA_VERSION,
            )
            .first()
        )
        if existing is None:
            existing = models.RatioSnapshot(
                organization_id=organization_id,
                period_from=period_from,
                period_to=period_to,
                as_of_date=as_of or period_to,
                formula_version=RATIO_FORMULA_VERSION,
                data_quality_status=result["data_quality"]["status"],
                ratios=result["ratios"],
                warnings=result["data_quality"]["warnings"],
            )
            db.add(existing)
        else:
            existing.as_of_date = as_of or period_to
            existing.data_quality_status = result["data_quality"]["status"]
            existing.ratios = result["ratios"]
            existing.warnings = result["data_quality"]["warnings"]
        db.flush()
        result["snapshot_id"] = existing.id

    for ratio in result["ratios"]:
        direction = (
            ratio["threshold"]["direction"] if ratio.get("threshold") else "higher"
        )
        ratio["narrative"] = fallback_narrative(
            ratio["code"],
            ratio["band"],
            ratio["quality"],
            ratio.get("reason", ""),
        )

    return result


def balance_sheet(
    db,
    organization_id: int,
    as_of: date,
) -> dict:
    snapshot = get_snapshot(db, organization_id, as_of)
    if snapshot is None:
        return {
            "as_of": str(as_of),
            "status": "unavailable",
            "reason": "Belum ada balance snapshot untuk tanggal ini.",
            "assets": [],
            "liabilities": [],
            "equity": [],
            "totals": {
                "total_assets": None,
                "total_liabilities": None,
                "total_equity": None,
            },
            "data_quality": {"status": "insufficient", "warnings": []},
        }

    roles, totals, rows, warnings = _aggregate_snapshot(db, snapshot)
    if snapshot.status != "final":
        warnings.append("Snapshot masih berstatus draft; angka dapat berubah.")
    if (
        totals["total_assets"] is not None
        and totals["total_liabilities"] is not None
        and totals["total_equity"] is not None
        and abs(
            totals["total_assets"]
            - (totals["total_liabilities"] + totals["total_equity"])
        ) > Decimal("0.01")
    ):
        warnings.append("Neraca tidak seimbang: aset ≠ liabilitas + ekuitas.")

    grouped = {"asset": [], "liability": [], "equity": []}
    for line, account in rows:
        if account.account_type not in grouped:
            continue
        grouped[account.account_type].append({
            "account_id": account.id,
            "code": account.code,
            "name": account.name,
            "role": _account_role(account),
            "is_current": bool(account.is_current),
            "amount": _money(Decimal(str(line.amount))),
        })

    quality = "usable" if snapshot.status == "final" else "partial"
    if any("tidak seimbang" in w for w in warnings):
        quality = "partial"

    return {
        "as_of": str(snapshot.as_of_date),
        "status": snapshot.status,
        "assets": grouped["asset"],
        "liabilities": grouped["liability"],
        "equity": grouped["equity"],
        "totals": {
            "total_assets": _money(totals["total_assets"]),
            "total_liabilities": _money(totals["total_liabilities"]),
            "total_equity": _money(totals["total_equity"]),
            "current_assets": _money(
                sum(
                    (Decimal(str(l.amount)) for l, a in rows
                     if a.account_type == "asset" and a.is_current),
                    Decimal("0"),
                )
            ),
            "current_liabilities": _money(
                sum(
                    (Decimal(str(l.amount)) for l, a in rows
                     if a.account_type == "liability" and a.is_current),
                    Decimal("0"),
                )
            ),
        },
        "data_quality": {"status": quality, "warnings": warnings},
    }
