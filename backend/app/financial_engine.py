from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict

FORMULA_VERSION = "1.0.0"
ZERO = Decimal("0")

def money(v: Decimal) -> str:
    return str(v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

def metric(v): return {"value": money(v), "status": "available"}
def unavailable(reason): return {"value": None, "status": "unavailable", "reason": reason}

def summarize(transactions, period_from, period_to, currency="IDR"):
    totals = defaultdict(lambda: ZERO)
    uncategorized = count = 0
    for tx in transactions:
        if tx.status != "posted":
            continue
        sign = Decimal(-1) if tx.reversal_of_id else Decimal(1)
        totals[tx.tx_type] += sign * tx.amount
        count += 1
        if tx.category_id is None and tx.tx_type in ("income", "expense"):
            uncategorized += 1

    net_revenue = totals["income"] - totals["refund"]
    expense = totals["expense"]
    cash_in = totals["income"] + totals["loan_received"] + totals["owner_contribution"]
    cash_out = (totals["expense"] + totals["refund"]
                + totals["loan_repayment"] + totals["owner_draw"])
    surplus = net_revenue - expense

    warnings = ["Cash basis dari transaksi tercatat; bukan laporan keuangan formal"]
    if uncategorized:
        warnings.append(f"{uncategorized} transaksi income/expense belum berkategori")
    if count == 0:
        warnings.append("Tidak ada transaksi pada periode ini")

    margin = (unavailable("Net revenue nol, margin tidak dapat dihitung")
              if net_revenue == 0 else metric(surplus / net_revenue * 100))

    return {
        "period": {"from": str(period_from), "to": str(period_to)},
        "currency": currency,
        "formula_version": FORMULA_VERSION,
        "data_quality": {"status": "partial" if (uncategorized or count == 0) else "usable",
                         "warnings": warnings, "transaction_count": count},
        "metrics": {
            "net_revenue": metric(net_revenue),
            "total_expense": metric(expense),
            "simple_surplus": metric(surplus),
            "gross_profit": unavailable("COGS belum diklasifikasikan"),
            "net_profit": unavailable("Perlu klasifikasi beban & COGS lengkap"),
            "surplus_margin_pct": margin,
            "cash_in": metric(cash_in),
            "cash_out": metric(cash_out),
            "net_cash_flow": metric(cash_in - cash_out),
        },
        "excluded_from_revenue_expense": ["transfer", "owner_contribution",
            "owner_draw", "loan_received", "loan_repayment"],
    }