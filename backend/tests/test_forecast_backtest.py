"""
Tests untuk:
1. Walk-forward backtest engine (financial_engine.run_walk_forward_backtest)
2. Endpoint POST /api/v1/forecasts/backtest
3. Endpoint GET /api/v1/forecasts/backtests
4. Endpoint GET /api/v1/forecasts/backtests/{id}
5. LLM adapter (llm_adapter.generate_explanation) — tanpa API key nyata
6. Endpoint POST /api/v1/recommendations/{id}/explain

Sesuai FINANCIAL_AI_METHODOLOGY.md §7 & §9:
- Walk-forward / rolling-origin, bukan random shuffle
- Gate check vs naive baseline
- Metrik: MAE, WAPE, sMAPE, Bias, MASE
- LLM harus fallback jika tidak ada API key
- LLM tidak boleh menghasilkan angka absolut ke output
"""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from app.financial_engine import run_walk_forward_backtest
from app.llm_adapter import (
    generate_explanation,
    _sanitize_for_llm,
    _validate_llm_output,
)
from app import models
from app.security import hash_password
from app.main import DEFAULT_CATEGORIES


# ─── Helpers ──────────────────────────────────────────────────────────────────

class FakeTx:
    """Objek transaksi minimal untuk unit test engine."""
    def __init__(self, tx_date, amount, tx_type, status="posted", reversal_of_id=None):
        self.transaction_date = tx_date
        self.amount = Decimal(str(amount))
        self.tx_type = tx_type
        self.status = status
        self.reversal_of_id = reversal_of_id


def make_monthly_txs(months=12, base_income=5_000_000, base_expense=3_000_000):
    """Buat transaksi bulanan fiktif tanpa PII untuk test."""
    txs = []
    start = date(2024, 1, 1)
    for i in range(months):
        d = date(start.year + (start.month + i - 1) // 12,
                 ((start.month + i - 1) % 12) + 1, 15)
        txs.append(FakeTx(d, base_income + i * 100_000, "income"))
        txs.append(FakeTx(d, base_expense + i * 50_000, "expense"))
    return txs


# ─── Unit Tests: Walk-forward backtest engine ─────────────────────────────────

class TestWalkForwardBacktest:

    def test_insufficient_data_returns_gate_failed(self):
        """< 8 periode → status insufficient_data, gate_passed=False."""
        txs = make_monthly_txs(months=4)
        result = run_walk_forward_backtest(txs, horizon=3)

        assert result["gate_passed"] is False
        assert result["status"] == "insufficient_data"
        assert result["data_points"] < 8
        assert result["folds"] == []
        assert "aggregate_metrics" in result

    def test_sufficient_data_produces_folds(self):
        """12 periode → folds terbentuk, metrik tersedia."""
        txs = make_monthly_txs(months=12)
        result = run_walk_forward_backtest(txs, horizon=3)

        assert result["data_points"] == 12
        assert len(result["folds"]) > 0
        assert "mae" in result["aggregate_metrics"]
        assert "bias" in result["aggregate_metrics"]
        assert result["aggregate_metrics"]["n_observations"] > 0

    def test_gate_metrics_present(self):
        """Metrik MAE, WAPE, sMAPE, Bias, MASE semua ada (atau None jika tak tersedia)."""
        txs = make_monthly_txs(months=12)
        result = run_walk_forward_backtest(txs, horizon=3)
        m = result["aggregate_metrics"]

        assert "mae" in m
        assert "bias" in m
        assert "wape_pct" in m
        assert "smape_pct" in m
        assert "mase" in m

    def test_no_random_shuffle_folds_are_ordered(self):
        """Folds harus berurutan (rolling-origin), bukan acak."""
        txs = make_monthly_txs(months=12)
        result = run_walk_forward_backtest(txs, horizon=3)
        folds = result["folds"]

        # Setiap fold berikutnya harus memiliki train window yang lebih panjang
        for i in range(1, len(folds)):
            assert len(folds[i]["train_periods"]) > len(folds[i - 1]["train_periods"])

    def test_baseline_comparison_present(self):
        """baseline_metrics harus ada dan berisi naive_mae serta model_vs_naive."""
        txs = make_monthly_txs(months=12)
        result = run_walk_forward_backtest(txs, horizon=3)
        bm = result["baseline_metrics"]

        assert "naive_mae" in bm
        assert "model_vs_naive" in bm
        assert bm["model_vs_naive"] in ("improved", "worse", "unavailable")

    def test_gate_reason_populated(self):
        """gate_reason harus berisi string non-kosong."""
        txs = make_monthly_txs(months=12)
        result = run_walk_forward_backtest(txs, horizon=3)

        assert isinstance(result["gate_reason"], str)
        assert len(result["gate_reason"]) > 0

    def test_training_window_matches_data(self):
        """training_window from/to harus sesuai dengan periode data."""
        txs = make_monthly_txs(months=12)
        result = run_walk_forward_backtest(txs, horizon=3)

        assert result["training_window"]["from"] == "2024-01"
        assert result["training_window"]["to"] == "2024-12"

    def test_zero_transactions_insufficient(self):
        """Tanpa transaksi → insufficient_data."""
        result = run_walk_forward_backtest([], horizon=3)
        assert result["gate_passed"] is False
        assert result["data_points"] == 0

    def test_non_posted_transactions_excluded(self):
        """Transaksi reversed harus diabaikan dalam agregasi."""
        txs = make_monthly_txs(months=10)
        # Tambah transaksi reversed yang seharusnya tidak dihitung
        for i in range(5):
            txs.append(FakeTx(date(2024, 1, 15), 99_999_999, "income", status="reversed"))
        result = run_walk_forward_backtest(txs, horizon=3)
        # Nilai predicted tidak boleh menggelembung akibat reversed tx
        for fold in result.get("folds", []):
            assert fold["ma_prediction"] < 50_000_000


# ─── Unit Tests: LLM adapter ──────────────────────────────────────────────────

class TestLlmAdapter:

    SAMPLE_REC = {
        "rule_id": "REC-CF-01",
        "priority": "high",
        "trigger_metrics": {"net_cash_flow": "-1500000.00", "cash_out": "8000000.00"},
        "evidence": [
            "Arus kas keluar (Rp 8.000.000) melebihi arus kas masuk (Rp 6.500.000).",
            "Defisit kas bersih Rp 1.500.000."
        ],
        "suggested_actions": [
            "Tunda pembelian non-esensial",
            "Percepat penagihan piutang"
        ]
    }

    def test_fallback_when_no_api_key(self):
        """Tanpa OPENAI_API_KEY → source harus 'fallback'."""
        with patch("app.llm_adapter.LLM_ENABLED", False):
            result = generate_explanation(self.SAMPLE_REC)

        assert result["source"] == "fallback"
        assert result["llm_enabled"] is False
        assert len(result["explanation"]) > 20
        assert "privacy_note" in result

    def test_sanitize_removes_absolute_numbers(self):
        """_sanitize_for_llm harus menghapus angka absolut dari evidence."""
        sanitized = _sanitize_for_llm(self.SAMPLE_REC)

        for ev in sanitized["evidence_summary"]:
            # Tidak boleh ada angka besar (Rp nominal)
            assert "8.000.000" not in ev
            assert "1.500.000" not in ev

    def test_sanitize_converts_metrics_to_direction(self):
        """trigger_metrics harus dikonversi ke arah (positif/negatif/nol)."""
        sanitized = _sanitize_for_llm(self.SAMPLE_REC)
        directions = sanitized["trigger_directions"]

        assert directions["net_cash_flow"] == "negatif"
        assert directions["cash_out"] == "positif"

    def test_validate_output_rejects_absolute_numbers(self):
        """Output LLM dengan angka besar harus ditolak."""
        bad_output = "Arus kas defisit sebesar Rp 1500000 perlu ditangani."
        is_valid, reason = _validate_llm_output(bad_output)

        assert is_valid is False
        assert "terlarang" in reason

    def test_validate_output_rejects_certainty_claims(self):
        """Output LLM dengan kata 'pasti' harus ditolak."""
        bad_output = "Langkah ini pasti akan meningkatkan kas usaha Anda."
        is_valid, reason = _validate_llm_output(bad_output)

        assert is_valid is False

    def test_validate_output_accepts_clean_text(self):
        """Teks narasi bersih tanpa angka absolut harus diterima."""
        good_output = (
            "Pengeluaran usaha melebihi pemasukan pada periode ini. "
            "Disarankan untuk meninjau pos biaya non-esensial dan mempercepat "
            "penagihan agar likuiditas tetap terjaga."
        )
        is_valid, reason = _validate_llm_output(good_output)

        assert is_valid is True
        assert reason == "ok"

    def test_validate_output_rejects_too_short(self):
        """Teks terlalu pendek harus ditolak."""
        is_valid, _ = _validate_llm_output("ok")
        assert is_valid is False

    def test_fallback_uses_known_rule_template(self):
        """Rule yang dikenal harus menggunakan template spesifik, bukan default."""
        with patch("app.llm_adapter.LLM_ENABLED", False):
            result = generate_explanation(self.SAMPLE_REC)

        # Template REC-CF-01 mengandung kata "likuiditas"
        assert "likuiditas" in result["explanation"].lower()

    def test_fallback_unknown_rule_uses_default(self):
        """Rule tidak dikenal harus menggunakan fallback default."""
        rec = dict(self.SAMPLE_REC, rule_id="REC-UNKNOWN-99")
        with patch("app.llm_adapter.LLM_ENABLED", False):
            result = generate_explanation(rec)

        assert result["source"] == "fallback"
        assert len(result["explanation"]) > 20

    def test_llm_output_validation_fallback_on_bad_response(self):
        """Jika LLM merespons dengan output tidak valid → fallback."""
        with patch("app.llm_adapter.LLM_ENABLED", True):
            with patch("app.llm_adapter._call_openai", return_value="Rp 99999999 pasti untung!"):
                result = generate_explanation(self.SAMPLE_REC)

        assert result["source"] == "fallback"

    def test_llm_none_response_uses_fallback(self):
        """Jika LLM merespons None (timeout/error) → fallback."""
        with patch("app.llm_adapter.LLM_ENABLED", True):
            with patch("app.llm_adapter._call_openai", return_value=None):
                result = generate_explanation(self.SAMPLE_REC)

        assert result["source"] == "fallback"
        assert len(result["explanation"]) > 20


# ─── Integration Tests: Endpoint backtest ─────────────────────────────────────

@pytest.fixture
def org_with_transactions(db_session):
    """Org dengan 12 bulan transaksi untuk test backtest."""
    user = models.User(
        email="backtest_user@profitai.test",
        password_hash=hash_password("Password123!"),
        full_name="Backtest User"
    )
    db_session.add(user); db_session.flush()

    org = models.Organization(name="Usaha Backtest")
    db_session.add(org); db_session.flush()

    db_session.add(models.Membership(organization_id=org.id, user_id=user.id, role="owner"))
    db_session.add(models.BusinessProfile(organization_id=org.id, industry="Retail"))

    cats = {}
    for name, t in DEFAULT_CATEGORIES:
        c = models.Category(organization_id=org.id, name=name, tx_type=t)
        db_session.add(c); db_session.flush()
        cats[(name, t)] = c.id

    # Tambah 12 bulan transaksi (Jan 2024 - Dec 2024)
    for month in range(1, 13):
        d = date(2024, month, 15)
        db_session.add(models.Transaction(
            organization_id=org.id, transaction_date=d,
            description=f"Penjualan bulan {month}", amount=Decimal("5000000"),
            tx_type="income", status="posted", created_by=user.id
        ))
        db_session.add(models.Transaction(
            organization_id=org.id, transaction_date=d,
            description=f"Operasional bulan {month}", amount=Decimal("3000000"),
            tx_type="expense", status="posted", created_by=user.id
        ))

    sess = models.Session(token="token_backtest_valid_789", user_id=user.id)
    db_session.add(sess)
    db_session.commit()

    return {
        "user": user, "org": org,
        "headers": {"Authorization": "Bearer token_backtest_valid_789"}
    }


class TestForecastBacktestEndpoint:

    def test_run_backtest_sufficient_data(self, client, org_with_transactions):
        """POST /api/v1/forecasts/backtest dengan data cukup → 201, gate_passed."""
        headers = org_with_transactions["headers"]
        resp = client.post("/api/v1/forecasts/backtest",
                           json={"horizon": 3, "period_unit": "month"},
                           headers=headers)

        assert resp.status_code == 201
        data = resp.json()
        assert "gate_passed" in data
        assert "aggregate_metrics" in data
        assert "folds" in data
        assert data["data_points"] == 12
        assert "id" in data

    def test_run_backtest_stores_result(self, client, org_with_transactions):
        """Hasil backtest harus tersimpan dan bisa diambil via GET."""
        headers = org_with_transactions["headers"]
        post_resp = client.post("/api/v1/forecasts/backtest",
                                json={"horizon": 3, "period_unit": "month"},
                                headers=headers)
        assert post_resp.status_code == 201
        backtest_id = post_resp.json()["id"]

        get_resp = client.get(f"/api/v1/forecasts/backtests/{backtest_id}",
                              headers=headers)
        assert get_resp.status_code == 200
        detail = get_resp.json()
        assert detail["id"] == backtest_id
        assert detail["horizon"] == 3
        assert "aggregate_metrics" in detail

    def test_list_backtests(self, client, org_with_transactions):
        """GET /api/v1/forecasts/backtests → daftar backtest milik org."""
        headers = org_with_transactions["headers"]
        client.post("/api/v1/forecasts/backtest",
                    json={"horizon": 3, "period_unit": "month"},
                    headers=headers)

        list_resp = client.get("/api/v1/forecasts/backtests", headers=headers)
        assert list_resp.status_code == 200
        items = list_resp.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        assert "gate_passed" in items[0]

    def test_backtest_not_found_returns_404(self, client, org_with_transactions):
        """GET /api/v1/forecasts/backtests/99999 → 404."""
        headers = org_with_transactions["headers"]
        resp = client.get("/api/v1/forecasts/backtests/99999", headers=headers)
        assert resp.status_code == 404

    def test_backtest_no_data_returns_insufficient(self, client, db_session):
        """Org tanpa transaksi → status insufficient_data."""
        user = models.User(
            email="empty_org@profitai.test",
            password_hash=hash_password("Password123!"),
            full_name="Empty User"
        )
        db_session.add(user); db_session.flush()
        org = models.Organization(name="Org Kosong")
        db_session.add(org); db_session.flush()
        db_session.add(models.Membership(organization_id=org.id, user_id=user.id, role="owner"))
        db_session.add(models.BusinessProfile(organization_id=org.id))
        sess = models.Session(token="token_empty_org_000", user_id=user.id)
        db_session.add(sess)
        db_session.commit()

        headers = {"Authorization": "Bearer token_empty_org_000"}
        resp = client.post("/api/v1/forecasts/backtest",
                           json={"horizon": 3, "period_unit": "month"},
                           headers=headers)

        assert resp.status_code == 201
        data = resp.json()
        assert data["gate_passed"] is False
        assert data["status"] == "insufficient_data"


# ─── Integration Tests: Endpoint explain ──────────────────────────────────────

class TestRecommendationExplainEndpoint:

    def test_explain_returns_explanation(self, client, org_with_transactions):
        """POST explain → mengembalikan penjelasan dan source."""
        headers = org_with_transactions["headers"]
        org = org_with_transactions["org"]

        # Ambil rekomendasi dulu
        from datetime import date
        rec_resp = client.get(
            "/api/v1/recommendations",
            params={"from": "2024-01-01", "to": "2024-12-31"},
            headers=headers
        )
        assert rec_resp.status_code == 200
        recs = rec_resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("Tidak ada rekomendasi yang dihasilkan untuk data ini")

        rec_id = recs[0]["id"]
        explain_resp = client.post(
            f"/api/v1/recommendations/{rec_id}/explain",
            headers=headers
        )

        assert explain_resp.status_code == 200
        data = explain_resp.json()
        assert "explanation" in data
        assert "source" in data
        assert data["source"] in ("llm", "fallback")
        assert "privacy_note" in data
        assert "disclaimer" in data
        assert len(data["explanation"]) > 20

    def test_explain_nonexistent_rec_returns_404(self, client, org_with_transactions):
        """POST explain untuk rec yang tidak ada → 404."""
        headers = org_with_transactions["headers"]
        resp = client.post("/api/v1/recommendations/99999/explain", headers=headers)
        assert resp.status_code == 404

    def test_explain_uses_fallback_without_api_key(self, client, org_with_transactions):
        """Tanpa OPENAI_API_KEY → source pasti 'fallback'."""
        headers = org_with_transactions["headers"]

        rec_resp = client.get(
            "/api/v1/recommendations",
            params={"from": "2024-01-01", "to": "2024-12-31"},
            headers=headers
        )
        recs = rec_resp.json().get("recommendations", [])
        if not recs:
            pytest.skip("Tidak ada rekomendasi")

        rec_id = recs[0]["id"]
        with patch("app.llm_adapter.LLM_ENABLED", False):
            resp = client.post(
                f"/api/v1/recommendations/{rec_id}/explain",
                headers=headers
            )

        assert resp.status_code == 200
        assert resp.json()["source"] == "fallback"
        assert resp.json()["llm_enabled"] is False
