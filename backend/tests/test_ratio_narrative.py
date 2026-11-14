from app.ratio_narrative import explain_ratio, fallback_narrative


def test_fallback_narrative_is_deterministic_and_prescriptive():
    result = fallback_narrative("CR", "below_critical", "ok")
    assert result["source"] == "fallback"
    assert result["llm_enabled"] is False
    assert "batas kritis" in result["explanation"]
    assert "penagihan" in result["action"].lower()
    assert "bukan saran keuangan" in result["disclaimer"]


def test_unavailable_narrative_uses_reason_without_llm():
    result = fallback_narrative(
        "ICR", "insufficient", "insufficient",
        "Beban bunga nol; ICR tidak bermakna.",
    )
    assert result["explanation"].startswith("Beban bunga nol")
    assert result["action"]


def test_explain_ratio_without_api_key_returns_fallback(monkeypatch):
    monkeypatch.setattr("app.llm_adapter.LLM_ENABLED", False)
    result = explain_ratio("NPM", "between_warning_critical", "ok")
    assert result["source"] == "fallback"
    assert result["llm_enabled"] is False
    assert result["explanation"]
    assert result["action"]
