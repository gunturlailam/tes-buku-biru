from datetime import date
from decimal import Decimal
from app.financial_engine import (
    summarize,
    calculate_profit_loss,
    calculate_cash_flow,
    calculate_financial_health,
    generate_recommendations,
)

class MockTx:
    def __init__(self, amount, tx_type, category_id=1, status="posted", reversal_of_id=None):
        self.amount = Decimal(str(amount))
        self.tx_type = tx_type
        self.category_id = category_id
        self.status = status
        self.reversal_of_id = reversal_of_id
        self.transaction_date = date(2026, 1, 15)

def test_financial_engine_basic_surplus_and_exclusions():
    txs = [
        MockTx("10000000.00", "income"),
        MockTx("3000000.00", "expense"),
        MockTx("500000.00", "refund"),
        # Non-operational cash flows (must NOT be in revenue or expense)
        MockTx("2000000.00", "transfer"),
        MockTx("5000000.00", "owner_contribution"),
        MockTx("1000000.00", "owner_draw"),
        MockTx("4000000.00", "loan_received"),
        MockTx("800000.00", "loan_repayment"),
    ]
    summary = summarize(txs, date(2026, 1, 1), date(2026, 1, 31))
    m = summary["metrics"]

    # Net revenue = income (10,000,000) - refund (500,000) = 9,500,000.00
    assert m["net_revenue"]["value"] == "9500000.00"
    # Expense = 3,000,000.00
    assert m["total_expense"]["value"] == "3000000.00"
    # Surplus = 9,500,000 - 3,000,000 = 6,500,000.00
    assert m["simple_surplus"]["value"] == "6500000.00"

    # Cash in = 10,000,000 (income) + 5,000,000 (owner_contribution) + 4,000,000 (loan_received) = 19,000,000.00
    assert m["cash_in"]["value"] == "19000000.00"
    # Cash out = 3,000,000 (expense) + 500,000 (refund) + 1,000,000 (owner_draw) + 800,000 (loan_repayment) = 5,300,000.00
    assert m["cash_out"]["value"] == "5300000.00"
    # Net cash flow = 19,000,000 - 5,300,000 = 13,700,000.00
    assert m["net_cash_flow"]["value"] == "13700000.00"

def test_zero_revenue_denominator_handling():
    # If there is no income, margin must be unavailable, not 0.00 or crash
    txs = [MockTx("1500000.00", "expense")]
    summary = summarize(txs, date(2026, 2, 1), date(2026, 2, 28))
    margin = summary["metrics"]["surplus_margin_pct"]
    assert margin["status"] == "unavailable"
    assert margin["value"] is None
    assert "Net revenue nol" in margin["reason"]

def test_reversal_negates_original_transaction():
    txs = [
        MockTx("2500000.00", "income", status="reversed"),  # Original reversed tx
        MockTx("2500000.00", "income", status="posted", reversal_of_id=1),  # Reversal row
        MockTx("2500000.00", "income", status="posted"),  # Original valid row
    ]
    summary = summarize(txs, date(2026, 3, 1), date(2026, 3, 31))
    # Original reversed row is ignored, reversal row (-2.5M) and posted row (+2.5M) cancel out
    assert summary["metrics"]["net_revenue"]["value"] == "0.00"

def test_profit_loss_report():
    txs = [
        MockTx("8000000.00", "income"),
        MockTx("200000.00", "refund"),
        MockTx("3500000.00", "expense"),
    ]
    pl = calculate_profit_loss(txs, date(2026, 1, 1), date(2026, 1, 31))
    items = pl["items"]
    assert items["gross_sales"]["value"] == "8000000.00"
    assert items["sales_returns"]["value"] == "200000.00"
    assert items["net_revenue"]["value"] == "7800000.00"
    assert items["operating_expenses"]["value"] == "3500000.00"
    assert items["net_profit"]["value"] == "4300000.00"
    # Net margin ratio
    ratio = pl["ratios"]["net_margin"]
    assert ratio["status"] == "available"
    assert ratio["value"] == 55.13  # (4,300,000 / 7,800,000) * 100 = 55.128... -> 55.13

def test_cash_flow_report():
    txs = [
        MockTx("5000000.00", "income"),
        MockTx("2000000.00", "expense"),
        MockTx("1000000.00", "owner_contribution"),
    ]
    cf = calculate_cash_flow(txs, date(2026, 1, 1), date(2026, 1, 31))
    assert cf["items"]["cash_in"]["value"] == "6000000.00"
    assert cf["items"]["cash_out"]["value"] == "2000000.00"
    assert cf["items"]["net_cash_flow"]["value"] == "4000000.00"
    assert cf["breakdown"]["operating_activities"]["value"] == "3000000.00"
    assert cf["breakdown"]["financing_activities"]["value"] == "1000000.00"

def test_financial_health_and_recommendations():
    # Deficit scenario
    txs = [
        MockTx("1000000.00", "income"),
        MockTx("3000000.00", "expense"),
        MockTx("500000.00", "expense", category_id=None),  # Uncategorized
    ]
    health = calculate_financial_health(txs, date(2026, 1, 1), date(2026, 1, 31))
    assert health["overall_status"] == "critical"

    recs = generate_recommendations(txs, date(2026, 1, 1), date(2026, 1, 31))
    rec_rules = [r["rule_id"] for r in recs["recommendations"]]
    assert "RULE-CF-01" in rec_rules  # Cash flow deficit recommendation triggered
    assert "RULE-DQ-01" in rec_rules  # Uncategorized data quality recommendation triggered

