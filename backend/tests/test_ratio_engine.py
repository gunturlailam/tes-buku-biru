from datetime import date
from decimal import Decimal

import pytest

from app.ratio_engine import (
    RATIO_FORMULA_VERSION,
    RatioInputs,
    compute_ratios,
    ratio_inputs_from_mapping,
)


def full_inputs(**overrides):
    values = dict(
        cash=Decimal("50000000"),
        receivables=Decimal("30000000"),
        inventory=Decimal("20000000"),
        prepaid=Decimal("5000000"),
        other_current_assets=Decimal("0"),
        accounts_payable=Decimal("25000000"),
        short_term_loans=Decimal("15000000"),
        tax_payable=Decimal("5000000"),
        total_assets=Decimal("200000000"),
        total_liabilities=Decimal("100000000"),
        total_equity=Decimal("100000000"),
        beginning_inventory=Decimal("15000000"),
        beginning_receivables=Decimal("25000000"),
        beginning_payables=Decimal("20000000"),
        beginning_assets=Decimal("180000000"),
        beginning_equity=Decimal("90000000"),
        revenue=Decimal("120000000"),
        prior_revenue=Decimal("100000000"),
        cogs=Decimal("70000000"),
        operating_expenses=Decimal("30000000"),
        interest_expense=Decimal("5000000"),
        tax_expense=Decimal("3000000"),
        net_profit=Decimal("12000000"),
        days=30,
    )
    values.update(overrides)
    return RatioInputs(**values)


def by_code(result):
    return {ratio["code"]: ratio for ratio in result["ratios"]}


def test_all_16_ratios_are_present_and_ordered():
    result = compute_ratios(full_inputs(), date(2026, 10, 1), date(2026, 10, 31))

    assert result["formula_version"] == RATIO_FORMULA_VERSION
    assert result["period"] == {"from": "2026-10-01", "to": "2026-10-31"}
    assert len(result["ratios"]) == 16
    assert [r["code"] for r in result["ratios"]] == [
        "CR", "QR", "CASH_RATIO", "DER", "DAR", "ICR", "INV_TURN", "ACP",
        "DPO", "TATO", "GPM", "OPM", "NPM", "ROA", "ROE", "REV_GROWTH",
    ]
    assert result["data_quality"]["status"] == "usable"
    assert any("disetahunkan" in w for w in result["data_quality"]["warnings"])


def test_hand_calculated_ratio_values():
    result = compute_ratios(full_inputs(), date(2026, 10, 1), date(2026, 10, 31))
    ratios = by_code(result)

    expected = {
        "CR": ("2.3333", "2.33x"),
        "QR": ("1.7778", "1.78x"),
        "CASH_RATIO": ("1.1111", "1.11x"),
        "DER": ("1.0000", "1.00x"),
        "DAR": ("0.5000", "0.50x"),
        "ICR": ("4.0000", "4.00x"),
        "INV_TURN": ("48.6667", "48.67x"),
        "ACP": ("6.8750", "6.88 hari"),
        "DPO": ("9.6429", "9.64 hari"),
        "TATO": ("7.6842", "7.68x"),
        "GPM": ("0.4167", "41.67%"),
        "OPM": ("0.1667", "16.67%"),
        "NPM": ("0.1000", "10.00%"),
        "ROA": ("0.7684", "76.84%"),
        "ROE": ("1.5368", "153.68%"),
        "REV_GROWTH": ("0.2000", "20.00%"),
    }

    for code, (value, display) in expected.items():
        assert ratios[code]["value"] == value, code
        assert ratios[code]["display"] == display, code
        assert ratios[code]["status"] == "available", code


def test_threshold_bands():
    ratios = by_code(
        compute_ratios(full_inputs(), date(2026, 10, 1), date(2026, 10, 31))
    )

    assert ratios["CR"]["band"] == "above_target"
    assert ratios["QR"]["band"] == "above_target"
    assert ratios["DER"]["band"] == "above_target"
    assert ratios["DAR"]["band"] == "above_target"
    assert ratios["ICR"]["band"] == "above_target"
    assert ratios["INV_TURN"]["band"] == "above_target"
    assert ratios["ACP"]["band"] == "above_target"
    assert ratios["TATO"]["band"] == "above_target"
    assert ratios["GPM"]["band"] == "above_target"
    assert ratios["NPM"]["band"] == "above_target"
    assert ratios["ROA"]["band"] == "above_target"

    # Rasio tanpa ambang default tidak boleh diberi band karangan.
    assert ratios["CASH_RATIO"]["band"] == "not_configured"
    assert ratios["DPO"]["band"] == "not_configured"
    assert ratios["OPM"]["band"] == "not_configured"
    assert ratios["ROE"]["band"] == "not_configured"
    assert ratios["REV_GROWTH"]["band"] == "not_configured"


def test_missing_inputs_make_all_ratios_unavailable():
    result = compute_ratios(RatioInputs(), date(2026, 10, 1), date(2026, 10, 31))

    assert result["data_quality"]["status"] == "insufficient"
    assert len(result["ratios"]) == 16
    assert all(r["status"] == "unavailable" for r in result["ratios"])
    assert all(r["reason"] for r in result["ratios"])


def test_zero_denominator_is_unavailable_not_zero():
    inputs = full_inputs(
        revenue=Decimal("0"),
        cogs=Decimal("0"),
        operating_expenses=Decimal("0"),
        net_profit=Decimal("0"),
        prior_revenue=Decimal("0"),
    )
    ratios = by_code(
        compute_ratios(inputs, date(2026, 10, 1), date(2026, 10, 31))
    )

    assert ratios["GPM"]["status"] == "unavailable"
    assert "Pendapatan nol" in ratios["GPM"]["reason"]
    assert ratios["OPM"]["status"] == "unavailable"
    assert ratios["NPM"]["status"] == "unavailable"
    assert ratios["ACP"]["status"] == "unavailable"
    assert ratios["REV_GROWTH"]["status"] == "unavailable"
    assert ratios["DPO"]["status"] == "unavailable"


def test_negative_equity_invalidates_der_and_roe():
    inputs = full_inputs(
        total_equity=Decimal("-10000000"),
        beginning_equity=Decimal("-5000000"),
        total_assets=Decimal("90000000"),
    )
    ratios = by_code(
        compute_ratios(inputs, date(2026, 10, 1), date(2026, 10, 31))
    )

    assert ratios["DER"]["status"] == "unavailable"
    assert "Ekuitas negatif" in ratios["DER"]["reason"]
    assert ratios["ROE"]["status"] == "unavailable"
    assert "Ekuitas negatif" in ratios["ROE"]["reason"]
    assert ratios["DAR"]["status"] == "available"


def test_missing_beginning_balance_uses_ending_balance_and_marks_partial():
    inputs = full_inputs(beginning_inventory=None)
    result = compute_ratios(inputs, date(2026, 10, 1), date(2026, 10, 31))

    ratio = by_code(result)["INV_TURN"]
    assert ratio["value"] == "42.5833"
    assert ratio["quality"] == "partial"
    assert result["data_quality"]["status"] == "partial"
    assert any("INV_TURN" in warning for warning in result["data_quality"]["warnings"])


def test_ratio_inputs_from_mapping_validates_unknown_fields():
    parsed = ratio_inputs_from_mapping({"cash": "1000", "days": 30})
    assert parsed.cash == Decimal("1000")
    assert parsed.days == 30

    with pytest.raises(ValueError, match="Field tidak dikenal"):
        ratio_inputs_from_mapping({"cash": "1000", "unexpected": "x"})
