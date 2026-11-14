"""Deterministic ratio engine untuk ProfitAI.

Aturan utama:
- Semua angka uang memakai Decimal.
- Input tidak lengkap atau denominator nol menghasilkan `unavailable` + reason.
- Tidak ada angka default yang menyesatkan. Nilai 0 hanya dipakai jika memang
  dikirim sebagai 0.
- Frontend/LLM tidak boleh menghitung ulang nilai rasio.
"""

from dataclasses import dataclass, fields
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Optional

RATIO_FORMULA_VERSION = "1.1.0"
ZERO = Decimal("0")
ONE = Decimal("1")
HUNDRED = Decimal("100")


def _dec(value) -> Optional[Decimal]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _money(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _value(value: Decimal) -> str:
    return str(value.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP))


def _display(value: Decimal, unit: str) -> str:
    if unit == "percent":
        return f"{(value * HUNDRED).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)}%"
    if unit == "days":
        return f"{value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)} hari"
    return f"{value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)}x"


def _avg(begin: Optional[Decimal], end: Optional[Decimal]):
    """Return (average, quality). Tanpa nilai awal, pakai nilai akhir (partial)."""
    if end is None:
        return None, "insufficient"
    if begin is None:
        return end, "partial"
    return (begin + end) / Decimal("2"), "ok"


def _annualize(value: Decimal, days: int) -> Decimal:
    """Setahunkan rasio arus agar sebanding dengan threshold tahunan.

    NPM/GPM/OPM tidak disetahunkan karena memang margin periode. ACP/DPO
    sudah memakai jumlah hari. INV_TURN/TATO/ROA/ROE memakai arus laba atau
    pendapatan, sehingga periode 30 hari harus dikali 365/30.
    """
    return value * Decimal("365") / Decimal(str(max(days, 1)))


@dataclass
class RatioInputs:
    """Input neraca dan laba-rugi untuk satu periode.

    Field `None` berarti data belum tersedia dan rasio terkait harus
    `unavailable`, bukan dianggap nol.
    """

    # Neraca - aset lancar
    cash: Optional[Decimal] = None
    receivables: Optional[Decimal] = None
    inventory: Optional[Decimal] = None
    prepaid: Optional[Decimal] = None
    other_current_assets: Optional[Decimal] = None

    # Neraca - liabilitas lancar
    accounts_payable: Optional[Decimal] = None
    short_term_loans: Optional[Decimal] = None
    tax_payable: Optional[Decimal] = None

    # Neraca - total
    total_assets: Optional[Decimal] = None
    total_liabilities: Optional[Decimal] = None
    total_equity: Optional[Decimal] = None

    # Saldo awal untuk rata-rata
    beginning_inventory: Optional[Decimal] = None
    beginning_receivables: Optional[Decimal] = None
    beginning_payables: Optional[Decimal] = None
    beginning_assets: Optional[Decimal] = None
    beginning_equity: Optional[Decimal] = None

    # Laba rugi
    revenue: Optional[Decimal] = None
    prior_revenue: Optional[Decimal] = None
    cogs: Optional[Decimal] = None
    operating_expenses: Optional[Decimal] = None
    interest_expense: Optional[Decimal] = None
    tax_expense: Optional[Decimal] = None
    net_profit: Optional[Decimal] = None

    days: int = 30


DEFAULT_THRESHOLDS = {
    # code: (target, warning, critical, direction)
    "CR": (Decimal("1.50"), Decimal("1.20"), Decimal("1.00"), "higher"),
    "QR": (Decimal("1.00"), Decimal("0.80"), Decimal("0.60"), "higher"),
    "DER": (Decimal("1.00"), Decimal("1.50"), Decimal("2.00"), "lower"),
    "DAR": (Decimal("0.50"), Decimal("0.65"), Decimal("0.80"), "lower"),
    "ICR": (Decimal("3.00"), Decimal("1.50"), Decimal("1.00"), "higher"),
    "INV_TURN": (Decimal("6"), Decimal("3"), Decimal("1"), "higher"),
    "ACP": (Decimal("30"), Decimal("60"), Decimal("90"), "lower"),
    "TATO": (Decimal("1.00"), Decimal("0.50"), Decimal("0.25"), "higher"),
    "GPM": (Decimal("0.30"), Decimal("0.20"), Decimal("0.10"), "higher"),
    "NPM": (Decimal("0.10"), Decimal("0.05"), Decimal("0.00"), "higher"),
    "ROA": (Decimal("0.05"), Decimal("0.02"), Decimal("0.00"), "higher"),
}


RATIO_META = {
    "CR": ("Current Ratio", "liquidity", "x"),
    "QR": ("Quick Ratio", "liquidity", "x"),
    "CASH_RATIO": ("Cash Ratio", "liquidity", "x"),
    "DER": ("Debt to Equity", "solvency", "x"),
    "DAR": ("Debt to Asset", "solvency", "x"),
    "ICR": ("Interest Coverage", "solvency", "x"),
    "INV_TURN": ("Inventory Turnover", "activity", "x"),
    "ACP": ("Average Collection Period", "activity", "days"),
    "DPO": ("Days Payable Outstanding", "activity", "days"),
    "TATO": ("Total Asset Turnover", "activity", "x"),
    "GPM": ("Gross Profit Margin", "profitability", "percent"),
    "OPM": ("Operating Margin", "profitability", "percent"),
    "NPM": ("Net Profit Margin", "profitability", "percent"),
    "ROA": ("Return on Assets", "profitability", "percent"),
    "ROE": ("Return on Equity", "profitability", "percent"),
    "REV_GROWTH": ("Revenue Growth", "growth", "percent"),
}


def _unavailable(code: str, reason: str, inputs: Dict[str, str], quality: str = "insufficient"):
    name, category, unit = RATIO_META[code]
    return {
        "code": code,
        "name": name,
        "category": category,
        "value": None,
        "display": None,
        "status": "unavailable",
        "quality": quality,
        "reason": reason,
        "inputs": inputs,
        "threshold": None,
        "band": "insufficient",
        "interpretation": reason,
        "unit": unit,
    }


def _ratio_result(
    code: str,
    raw_value: Decimal,
    inputs: Dict[str, str],
    quality: str = "ok",
    threshold_override=None,
):
    name, category, unit = RATIO_META[code]
    threshold = threshold_override
    band = "not_configured"
    interpretation = "Rasio tersedia; ambang default belum dikonfigurasi."

    if threshold:
        target, warning, critical, direction = threshold
        if direction == "higher":
            if raw_value >= target:
                band = "above_target"
            elif raw_value >= warning:
                band = "between_target_warning"
            elif raw_value >= critical:
                band = "between_warning_critical"
            else:
                band = "below_critical"
        else:
            if raw_value <= target:
                band = "above_target"
            elif raw_value <= warning:
                band = "between_target_warning"
            elif raw_value <= critical:
                band = "between_warning_critical"
            else:
                band = "below_critical"

        band_text = {
            "above_target": "memenuhi target",
            "between_target_warning": "di antara target dan batas warning",
            "between_warning_critical": "di antara warning dan kritis",
            "below_critical": "melewati batas kritis",
        }[band]
        interpretation = f"Nilai rasio {band_text}."

    return {
        "code": code,
        "name": name,
        "category": category,
        "value": _value(raw_value),
        "display": _display(raw_value, unit),
        "status": "available",
        "quality": quality,
        "inputs": inputs,
        "threshold": (
            {
                "target": _value(threshold[0]),
                "warning": _value(threshold[1]),
                "critical": _value(threshold[2]),
                "direction": threshold[3],
            }
            if threshold
            else None
        ),
        "band": band,
        "interpretation": interpretation,
        "unit": unit,
    }


def _all_present(*values) -> bool:
    return all(v is not None for v in values)


def _current_assets(i: RatioInputs):
    required = (i.cash, i.receivables, i.inventory, i.prepaid)
    if not _all_present(*required):
        return None, "Kas, piutang, persediaan, dan prepaid harus tersedia untuk aset lancar."
    other = i.other_current_assets if i.other_current_assets is not None else ZERO
    return i.cash + i.receivables + i.inventory + i.prepaid + other, None


def _current_liabilities(i: RatioInputs):
    if not _all_present(i.accounts_payable, i.short_term_loans, i.tax_payable):
        return None, "Utang usaha, pinjaman jangka pendek, dan utang pajak harus tersedia."
    return i.accounts_payable + i.short_term_loans + i.tax_payable, None


def compute_ratios(
    inputs: RatioInputs,
    period_from: date,
    period_to: date,
    as_of: Optional[date] = None,
    currency: str = "IDR",
    thresholds: Optional[Dict[str, tuple]] = None,
) -> dict:
    """Hitung 16 rasio secara deterministik.

    Mengembalikan struktur siap API. Setiap rasio yang inputnya kurang tetap
    muncul dengan status `unavailable` agar UI dapat menjelaskan alasannya.
    """
    if not isinstance(inputs, RatioInputs):
        raise TypeError("inputs harus instance RatioInputs")

    as_of = as_of or period_to
    configured = thresholds if thresholds is not None else DEFAULT_THRESHOLDS
    ratios = []

    current_assets, ca_error = _current_assets(inputs)
    current_liabilities, cl_error = _current_liabilities(inputs)

    # CR
    if current_assets is None or current_liabilities is None:
        ratios.append(_unavailable("CR", ca_error or cl_error, {
            "current_assets": _money(current_assets) if current_assets is not None else None,
            "current_liabilities": _money(current_liabilities) if current_liabilities is not None else None,
        }))
    elif current_liabilities == ZERO:
        ratios.append(_unavailable("CR", "Utang lancar nol; rasio tidak dapat dihitung.", {
            "current_assets": _money(current_assets),
            "current_liabilities": "0.00",
        }))
    else:
        ratios.append(_ratio_result("CR", current_assets / current_liabilities, {
            "current_assets": _money(current_assets),
            "current_liabilities": _money(current_liabilities),
        }, threshold_override=configured.get("CR")))

    # QR
    if current_assets is None or current_liabilities is None:
        ratios.append(_unavailable("QR", ca_error or cl_error, {
            "current_assets": _money(current_assets) if current_assets is not None else None,
            "current_liabilities": _money(current_liabilities) if current_liabilities is not None else None,
        }))
    elif current_liabilities == ZERO:
        ratios.append(_unavailable("QR", "Utang lancar nol; rasio tidak dapat dihitung.", {
            "quick_assets": _money(current_assets - inputs.inventory - inputs.prepaid),
            "current_liabilities": "0.00",
        }))
    else:
        quick_assets = current_assets - inputs.inventory - inputs.prepaid
        ratios.append(_ratio_result("QR", quick_assets / current_liabilities, {
            "quick_assets": _money(quick_assets),
            "current_liabilities": _money(current_liabilities),
        }, threshold_override=configured.get("QR")))

    # CASH_RATIO
    if inputs.cash is None or current_liabilities is None:
        ratios.append(_unavailable("CASH_RATIO", "Kas dan utang lancar harus tersedia.", {
            "cash": _money(inputs.cash) if inputs.cash is not None else None,
            "current_liabilities": _money(current_liabilities) if current_liabilities is not None else None,
        }))
    elif current_liabilities == ZERO:
        ratios.append(_unavailable("CASH_RATIO", "Utang lancar nol; rasio tidak dapat dihitung.", {
            "cash": _money(inputs.cash),
            "current_liabilities": "0.00",
        }))
    else:
        ratios.append(_ratio_result("CASH_RATIO", inputs.cash / current_liabilities, {
            "cash": _money(inputs.cash),
            "current_liabilities": _money(current_liabilities),
        }))

    # DER dan ROE butuh ekuitas positif
    if inputs.total_liabilities is None or inputs.total_equity is None:
        der = _unavailable("DER", "Total utang dan ekuitas harus tersedia.", {
            "total_liabilities": _money(inputs.total_liabilities) if inputs.total_liabilities is not None else None,
            "total_equity": _money(inputs.total_equity) if inputs.total_equity is not None else None,
        })
    elif inputs.total_equity < ZERO:
        der = _unavailable("DER", "Ekuitas negatif; rasio tidak bermakna.", {
            "total_liabilities": _money(inputs.total_liabilities),
            "total_equity": _money(inputs.total_equity),
        })
    elif inputs.total_equity == ZERO:
        der = _unavailable("DER", "Ekuitas nol; rasio tidak dapat dihitung.", {
            "total_liabilities": _money(inputs.total_liabilities),
            "total_equity": "0.00",
        })
    else:
        der = _ratio_result("DER", inputs.total_liabilities / inputs.total_equity, {
            "total_liabilities": _money(inputs.total_liabilities),
            "total_equity": _money(inputs.total_equity),
        }, threshold_override=configured.get("DER"))
    ratios.append(der)

    # DAR
    if inputs.total_liabilities is None or inputs.total_assets is None:
        ratios.append(_unavailable("DAR", "Total utang dan total aset harus tersedia.", {
            "total_liabilities": _money(inputs.total_liabilities) if inputs.total_liabilities is not None else None,
            "total_assets": _money(inputs.total_assets) if inputs.total_assets is not None else None,
        }))
    elif inputs.total_assets == ZERO:
        ratios.append(_unavailable("DAR", "Total aset nol; rasio tidak dapat dihitung.", {
            "total_liabilities": _money(inputs.total_liabilities),
            "total_assets": "0.00",
        }))
    else:
        ratios.append(_ratio_result("DAR", inputs.total_liabilities / inputs.total_assets, {
            "total_liabilities": _money(inputs.total_liabilities),
            "total_assets": _money(inputs.total_assets),
        }, threshold_override=configured.get("DAR")))

    # ICR
    ebit = None
    ebit_reason = "Laba bersih, beban bunga, dan beban pajak harus tersedia untuk EBIT."
    if _all_present(inputs.net_profit, inputs.interest_expense, inputs.tax_expense):
        ebit = inputs.net_profit + inputs.interest_expense + inputs.tax_expense
        ebit_reason = ""
    if ebit is None or inputs.interest_expense is None:
        ratios.append(_unavailable("ICR", ebit_reason, {
            "ebit": _money(ebit) if ebit is not None else None,
            "interest_expense": _money(inputs.interest_expense) if inputs.interest_expense is not None else None,
        }))
    elif inputs.interest_expense == ZERO:
        ratios.append(_unavailable("ICR", "Beban bunga nol; ICR tidak bermakna.", {
            "ebit": _money(ebit),
            "interest_expense": "0.00",
        }))
    else:
        ratios.append(_ratio_result("ICR", ebit / inputs.interest_expense, {
            "ebit": _money(ebit),
            "interest_expense": _money(inputs.interest_expense),
        }, threshold_override=configured.get("ICR")))

    # INV_TURN
    avg_inventory, inv_quality = _avg(inputs.beginning_inventory, inputs.inventory)
    if inputs.cogs is None or avg_inventory is None:
        ratios.append(_unavailable("INV_TURN", "HPP dan persediaan akhir harus tersedia.", {
            "cogs": _money(inputs.cogs) if inputs.cogs is not None else None,
            "average_inventory": _money(avg_inventory) if avg_inventory is not None else None,
        }))
    elif avg_inventory == ZERO:
        ratios.append(_unavailable("INV_TURN", "Rata-rata persediaan nol; rasio tidak dapat dihitung.", {
            "cogs": _money(inputs.cogs),
            "average_inventory": "0.00",
        }))
    else:
        ratios.append(_ratio_result("INV_TURN", _annualize(inputs.cogs / avg_inventory, inputs.days), {
            "cogs": _money(inputs.cogs),
            "average_inventory": _money(avg_inventory),
            "annualization_days": str(inputs.days),
        }, quality=inv_quality, threshold_override=configured.get("INV_TURN")))

    # ACP
    avg_receivables, ar_quality = _avg(inputs.beginning_receivables, inputs.receivables)
    if inputs.revenue is None or avg_receivables is None:
        ratios.append(_unavailable("ACP", "Pendapatan dan piutang akhir harus tersedia.", {
            "revenue": _money(inputs.revenue) if inputs.revenue is not None else None,
            "average_receivables": _money(avg_receivables) if avg_receivables is not None else None,
        }))
    elif inputs.revenue == ZERO:
        ratios.append(_unavailable("ACP", "Pendapatan nol; ACP tidak dapat dihitung.", {
            "revenue": "0.00",
            "average_receivables": _money(avg_receivables),
        }))
    else:
        days = Decimal(str(inputs.days))
        ratios.append(_ratio_result(
            "ACP",
            (avg_receivables / inputs.revenue) * days,
            {
                "average_receivables": _money(avg_receivables),
                "revenue": _money(inputs.revenue),
                "days": str(inputs.days),
            },
            quality=ar_quality,
            threshold_override=configured.get("ACP"),
        ))

    # DPO
    avg_payables, ap_quality = _avg(inputs.beginning_payables, inputs.accounts_payable)
    if inputs.cogs is None or avg_payables is None:
        ratios.append(_unavailable("DPO", "HPP dan utang usaha akhir harus tersedia.", {
            "cogs": _money(inputs.cogs) if inputs.cogs is not None else None,
            "average_payables": _money(avg_payables) if avg_payables is not None else None,
        }))
    elif inputs.cogs == ZERO:
        ratios.append(_unavailable("DPO", "HPP nol; DPO tidak dapat dihitung.", {
            "cogs": "0.00",
            "average_payables": _money(avg_payables),
        }))
    else:
        days = Decimal(str(inputs.days))
        ratios.append(_ratio_result(
            "DPO",
            (avg_payables / inputs.cogs) * days,
            {
                "average_payables": _money(avg_payables),
                "cogs": _money(inputs.cogs),
                "days": str(inputs.days),
            },
            quality=ap_quality,
        ))

    # TATO
    avg_assets, asset_quality = _avg(inputs.beginning_assets, inputs.total_assets)
    if inputs.revenue is None or avg_assets is None:
        ratios.append(_unavailable("TATO", "Pendapatan dan total aset akhir harus tersedia.", {
            "revenue": _money(inputs.revenue) if inputs.revenue is not None else None,
            "average_assets": _money(avg_assets) if avg_assets is not None else None,
        }))
    elif avg_assets == ZERO:
        ratios.append(_unavailable("TATO", "Rata-rata aset nol; rasio tidak dapat dihitung.", {
            "revenue": _money(inputs.revenue),
            "average_assets": "0.00",
        }))
    else:
        ratios.append(_ratio_result("TATO", _annualize(inputs.revenue / avg_assets, inputs.days), {
            "revenue": _money(inputs.revenue),
            "average_assets": _money(avg_assets),
            "annualization_days": str(inputs.days),
        }, quality=asset_quality, threshold_override=configured.get("TATO")))

    # GPM
    if _all_present(inputs.revenue, inputs.cogs) and inputs.revenue != ZERO:
        ratios.append(_ratio_result("GPM", (inputs.revenue - inputs.cogs) / inputs.revenue, {
            "revenue": _money(inputs.revenue),
            "cogs": _money(inputs.cogs),
        }, threshold_override=configured.get("GPM")))
    elif inputs.revenue is None or inputs.cogs is None:
        ratios.append(_unavailable("GPM", "Pendapatan dan HPP harus tersedia.", {
            "revenue": _money(inputs.revenue) if inputs.revenue is not None else None,
            "cogs": _money(inputs.cogs) if inputs.cogs is not None else None,
        }))
    else:
        ratios.append(_unavailable("GPM", "Pendapatan nol; GPM tidak dapat dihitung.", {
            "revenue": "0.00",
            "cogs": _money(inputs.cogs),
        }))

    # OPM
    if _all_present(inputs.revenue, inputs.cogs, inputs.operating_expenses) and inputs.revenue != ZERO:
        operating_profit = inputs.revenue - inputs.cogs - inputs.operating_expenses
        ratios.append(_ratio_result("OPM", operating_profit / inputs.revenue, {
            "revenue": _money(inputs.revenue),
            "cogs": _money(inputs.cogs),
            "operating_expenses": _money(inputs.operating_expenses),
            "operating_profit": _money(operating_profit),
        }))
    elif inputs.revenue is None or inputs.cogs is None or inputs.operating_expenses is None:
        ratios.append(_unavailable("OPM", "Pendapatan, HPP, dan beban operasional harus tersedia.", {
            "revenue": _money(inputs.revenue) if inputs.revenue is not None else None,
            "cogs": _money(inputs.cogs) if inputs.cogs is not None else None,
            "operating_expenses": _money(inputs.operating_expenses) if inputs.operating_expenses is not None else None,
        }))
    else:
        ratios.append(_unavailable("OPM", "Pendapatan nol; OPM tidak dapat dihitung.", {
            "revenue": "0.00",
            "cogs": _money(inputs.cogs),
            "operating_expenses": _money(inputs.operating_expenses),
        }))

    # NPM
    if _all_present(inputs.net_profit, inputs.revenue) and inputs.revenue != ZERO:
        ratios.append(_ratio_result("NPM", inputs.net_profit / inputs.revenue, {
            "net_profit": _money(inputs.net_profit),
            "revenue": _money(inputs.revenue),
        }, threshold_override=configured.get("NPM")))
    elif inputs.net_profit is None or inputs.revenue is None:
        ratios.append(_unavailable("NPM", "Laba bersih dan pendapatan harus tersedia.", {
            "net_profit": _money(inputs.net_profit) if inputs.net_profit is not None else None,
            "revenue": _money(inputs.revenue) if inputs.revenue is not None else None,
        }))
    else:
        ratios.append(_unavailable("NPM", "Pendapatan nol; NPM tidak dapat dihitung.", {
            "net_profit": _money(inputs.net_profit),
            "revenue": "0.00",
        }))

    # ROA
    if inputs.net_profit is None or avg_assets is None:
        ratios.append(_unavailable("ROA", "Laba bersih dan total aset akhir harus tersedia.", {
            "net_profit": _money(inputs.net_profit) if inputs.net_profit is not None else None,
            "average_assets": _money(avg_assets) if avg_assets is not None else None,
        }))
    elif avg_assets == ZERO:
        ratios.append(_unavailable("ROA", "Rata-rata aset nol; rasio tidak dapat dihitung.", {
            "net_profit": _money(inputs.net_profit),
            "average_assets": "0.00",
        }))
    else:
        ratios.append(_ratio_result("ROA", _annualize(inputs.net_profit / avg_assets, inputs.days), {
            "net_profit": _money(inputs.net_profit),
            "average_assets": _money(avg_assets),
            "annualization_days": str(inputs.days),
        }, quality=asset_quality, threshold_override=configured.get("ROA")))

    # ROE
    avg_equity, equity_quality = _avg(inputs.beginning_equity, inputs.total_equity)
    if inputs.net_profit is None or avg_equity is None:
        ratios.append(_unavailable("ROE", "Laba bersih dan ekuitas akhir harus tersedia.", {
            "net_profit": _money(inputs.net_profit) if inputs.net_profit is not None else None,
            "average_equity": _money(avg_equity) if avg_equity is not None else None,
        }))
    elif avg_equity < ZERO:
        ratios.append(_unavailable("ROE", "Ekuitas negatif; rasio tidak bermakna.", {
            "net_profit": _money(inputs.net_profit),
            "average_equity": _money(avg_equity),
        }))
    elif avg_equity == ZERO:
        ratios.append(_unavailable("ROE", "Ekuitas nol; rasio tidak dapat dihitung.", {
            "net_profit": _money(inputs.net_profit),
            "average_equity": "0.00",
        }))
    else:
        ratios.append(_ratio_result("ROE", _annualize(inputs.net_profit / avg_equity, inputs.days), {
            "net_profit": _money(inputs.net_profit),
            "average_equity": _money(avg_equity),
            "annualization_days": str(inputs.days),
        }, quality=equity_quality))

    # REV_GROWTH
    if inputs.revenue is None or inputs.prior_revenue is None:
        ratios.append(_unavailable("REV_GROWTH", "Pendapatan periode ini dan sebelumnya harus tersedia.", {
            "revenue": _money(inputs.revenue) if inputs.revenue is not None else None,
            "prior_revenue": _money(inputs.prior_revenue) if inputs.prior_revenue is not None else None,
        }))
    elif inputs.prior_revenue == ZERO:
        ratios.append(_unavailable("REV_GROWTH", "Pendapatan periode sebelumnya nol; growth tidak dapat dihitung.", {
            "revenue": _money(inputs.revenue),
            "prior_revenue": "0.00",
        }))
    else:
        ratios.append(_ratio_result(
            "REV_GROWTH",
            (inputs.revenue - inputs.prior_revenue) / inputs.prior_revenue,
            {
                "revenue": _money(inputs.revenue),
                "prior_revenue": _money(inputs.prior_revenue),
            },
        ))

    unavailable_reasons = [
        r["reason"] for r in ratios if r["status"] == "unavailable"
    ]
    partial_reasons = [
        f"{r['code']}: saldo awal tidak tersedia; rata-rata memakai saldo akhir."
        for r in ratios
        if r["status"] == "available" and r["quality"] == "partial"
    ]
    annualized_notes = []
    if inputs.days < 365:
        annualized_notes.append(
            f"INV_TURN, TATO, ROA, dan ROE disetahunkan dari periode {inputs.days} hari; "
            "nilai periode pendek dapat fluktuatif."
        )
    if len(unavailable_reasons) == len(ratios):
        quality_status = "insufficient"
    elif unavailable_reasons or partial_reasons:
        quality_status = "partial"
    else:
        quality_status = "usable"

    return {
        "period": {"from": str(period_from), "to": str(period_to)},
        "as_of": str(as_of),
        "currency": currency,
        "formula_version": RATIO_FORMULA_VERSION,
        "data_quality": {
            "status": quality_status,
            "warnings": unavailable_reasons + partial_reasons + annualized_notes,
        },
        "ratios": ratios,
    }


def ratio_inputs_from_mapping(data: dict) -> RatioInputs:
    """Bangun RatioInputs dari dict (misal payload API) dengan validasi field."""
    allowed = {f.name for f in fields(RatioInputs)}
    unknown = set(data) - allowed
    if unknown:
        raise ValueError(f"Field tidak dikenal: {', '.join(sorted(unknown))}")
    kwargs = {k: (_dec(v) if k != "days" else int(v)) for k, v in data.items()}
    return RatioInputs(**kwargs)
