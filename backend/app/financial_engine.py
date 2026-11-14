from decimal import Decimal, ROUND_HALF_UP
from collections import defaultdict
from datetime import datetime, timezone

FORMULA_VERSION = "1.0.0"
ZERO = Decimal("0")

def money(v: Decimal) -> str:
    return str(v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

def metric(v):
    return {"value": money(v), "status": "available"}

def unavailable(reason):
    return {"value": None, "status": "unavailable", "reason": reason}

def _aggregate_transactions(transactions):
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

    quality_status = "partial" if (uncategorized or count == 0) else "usable"

    return {
        "totals": totals,
        "count": count,
        "uncategorized": uncategorized,
        "net_revenue": net_revenue,
        "expense": expense,
        "cash_in": cash_in,
        "cash_out": cash_out,
        "surplus": surplus,
        "warnings": warnings,
        "quality_status": quality_status,
    }

def summarize(transactions, period_from, period_to, currency="IDR"):
    agg = _aggregate_transactions(transactions)
    net_revenue = agg["net_revenue"]
    expense = agg["expense"]
    surplus = agg["surplus"]
    cash_in = agg["cash_in"]
    cash_out = agg["cash_out"]

    margin = (unavailable("Net revenue nol, margin tidak dapat dihitung")
              if net_revenue == ZERO else metric(surplus / net_revenue * 100))

    return {
        "period": {"from": str(period_from), "to": str(period_to)},
        "currency": currency,
        "formula_version": FORMULA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_quality": {
            "status": agg["quality_status"],
            "warnings": agg["warnings"],
            "transaction_count": agg["count"]
        },
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
        "excluded_from_revenue_expense": [
            "transfer", "owner_contribution",
            "owner_draw", "loan_received", "loan_repayment"
        ],
    }

def calculate_profit_loss(transactions, period_from, period_to, currency="IDR"):
    agg = _aggregate_transactions(transactions)
    totals = agg["totals"]
    gross_sales = totals["income"]
    sales_returns = totals["refund"]
    sales_discounts = ZERO
    net_revenue = agg["net_revenue"]
    operating_expenses = agg["expense"]
    net_profit = agg["surplus"]  # Sesuai basis simple surplus MVP

    net_margin = (
        unavailable("Net revenue nol, margin tidak dapat dihitung")
        if net_revenue == ZERO
        else {"value": float(round((net_profit / net_revenue) * 100, 2)), "status": "available"}
    )

    return {
        "period": {"from": str(period_from), "to": str(period_to)},
        "currency": currency,
        "data_quality": {
            "status": agg["quality_status"],
            "warnings": agg["warnings"]
        },
        "formula_version": FORMULA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "items": {
            "gross_sales": metric(gross_sales),
            "sales_returns": metric(sales_returns),
            "sales_discounts": metric(sales_discounts),
            "net_revenue": metric(net_revenue),
            "cogs": unavailable("COGS belum diklasifikasikan terpisah"),
            "gross_profit": unavailable("COGS belum diklasifikasikan terpisah"),
            "operating_expenses": metric(operating_expenses),
            "operating_profit": metric(net_revenue - operating_expenses),
            "other_income": unavailable("Belum ada pencatatan pendapatan lain"),
            "finance_cost": unavailable("Belum ada pencatatan biaya keuangan"),
            "tax_expense": unavailable("Belum ada pencatatan pajak"),
            "net_profit": metric(net_profit),
        },
        "ratios": {
            "gross_margin": unavailable("Gross profit belum tersedia"),
            "operating_margin": net_margin,
            "net_margin": net_margin,
        }
    }

def calculate_cash_flow(transactions, period_from, period_to, currency="IDR"):
    agg = _aggregate_transactions(transactions)
    totals = agg["totals"]
    cash_in = agg["cash_in"]
    cash_out = agg["cash_out"]
    net_cash_flow = cash_in - cash_out

    operating_cash = totals["income"] - totals["refund"] - totals["expense"]
    financing_cash = (totals["loan_received"] + totals["owner_contribution"]) - (totals["loan_repayment"] + totals["owner_draw"])

    return {
        "period": {"from": str(period_from), "to": str(period_to)},
        "currency": currency,
        "data_quality": {
            "status": agg["quality_status"],
            "warnings": agg["warnings"]
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "note": "Ringkasan pergerakan kas berbasis transaksi tercatat; bukan laporan arus kas formal",
        "items": {
            "opening_cash": unavailable("Saldo awal kas belum tercatat"),
            "cash_in": metric(cash_in),
            "cash_out": metric(cash_out),
            "net_cash_flow": metric(net_cash_flow),
            "closing_cash": unavailable("Saldo akhir memerlukan saldo awal kas"),
        },
        "breakdown": {
            "operating_activities": metric(operating_cash),
            "investing_activities": unavailable("Belum ada transaksi aktivitas investasi"),
            "financing_activities": metric(financing_cash),
        }
    }

def calculate_financial_health(transactions, period_from, period_to):
    agg = _aggregate_transactions(transactions)
    net_revenue = agg["net_revenue"]
    net_cash_flow = agg["cash_in"] - agg["cash_out"]
    surplus = agg["surplus"]
    count = agg["count"]
    uncategorized = agg["uncategorized"]

    signals = []

    # Signal 1: Net Cash Flow
    if count == 0:
        signals.append({
            "id": "SIG-NCF-01",
            "title": "Arus Kas Bersih",
            "level": "insufficient",
            "trigger_metric": "net_cash_flow",
            "current_value": None,
            "period": {"from": str(period_from), "to": str(period_to)},
            "explanation": "Tidak ada data transaksi kas pada periode ini.",
            "recommendation": "Catat transaksi pemasukan dan pengeluaran kas."
        })
    elif net_cash_flow < ZERO:
        signals.append({
            "id": "SIG-NCF-01",
            "title": "Arus Kas Bersih Defisit",
            "level": "critical",
            "trigger_metric": "net_cash_flow",
            "current_value": money(net_cash_flow),
            "threshold": "0.00",
            "period": {"from": str(period_from), "to": str(period_to)},
            "explanation": f"Arus kas keluar melebihi pemasukan dengan defisit sebesar Rp {money(abs(net_cash_flow))}.",
            "recommendation": "Tinjau pengeluaran operasional dan percepat penerimaan pembayaran piutang."
        })
    else:
        signals.append({
            "id": "SIG-NCF-01",
            "title": "Arus Kas Bersih Positif",
            "level": "normal",
            "trigger_metric": "net_cash_flow",
            "current_value": money(net_cash_flow),
            "threshold": "0.00",
            "period": {"from": str(period_from), "to": str(period_to)},
            "explanation": f"Arus kas bersih surplus sebesar Rp {money(net_cash_flow)}.",
            "recommendation": "Pertahankan surplus kas dan sisihkan sebagian sebagai cadangan dana darurat."
        })

    # Signal 2: Surplus Margin
    if count == 0 or net_revenue == ZERO:
        signals.append({
            "id": "SIG-MRG-01",
            "title": "Margin Surplus Usaha",
            "level": "insufficient",
            "trigger_metric": "surplus_margin_pct",
            "current_value": None,
            "period": {"from": str(period_from), "to": str(period_to)},
            "explanation": "Pendapatan bersih nol atau tidak ada transaksi, margin tidak dapat dihitung.",
            "recommendation": "Catat transaksi penjualan untuk menghitung margin keuntungan."
        })
    else:
        margin_pct = (surplus / net_revenue) * 100
        margin_str = money(margin_pct)
        if margin_pct < ZERO:
            signals.append({
                "id": "SIG-MRG-01",
                "title": "Margin Usaha Negatif",
                "level": "critical",
                "trigger_metric": "surplus_margin_pct",
                "current_value": margin_str,
                "threshold": "0.00",
                "period": {"from": str(period_from), "to": str(period_to)},
                "explanation": f"Operasional merugi dengan margin {margin_str}%.",
                "recommendation": "Lakukan audit efisiensi beban biaya atau evaluasi penetapan harga jual."
            })
        elif margin_pct < Decimal("10.00"):
            signals.append({
                "id": "SIG-MRG-01",
                "title": "Margin Usaha Tipis",
                "level": "attention",
                "trigger_metric": "surplus_margin_pct",
                "current_value": margin_str,
                "threshold": "10.00",
                "period": {"from": str(period_from), "to": str(period_to)},
                "explanation": f"Margin surplus relatif tipis ({margin_str}%), rentan terhadap kenaikan biaya.",
                "recommendation": "Pantau ketat pos biaya rutin operasional."
            })
        else:
            signals.append({
                "id": "SIG-MRG-01",
                "title": "Margin Usaha Sehat",
                "level": "normal",
                "trigger_metric": "surplus_margin_pct",
                "current_value": margin_str,
                "threshold": "10.00",
                "period": {"from": str(period_from), "to": str(period_to)},
                "explanation": f"Margin surplus berada di batas aman ({margin_str}%).",
                "recommendation": "Pertahankan efisiensi operasional saat ini."
            })

    # Signal 3: Data Quality Completeness
    if uncategorized > 0:
        signals.append({
            "id": "SIG-DQ-01",
            "title": "Kelengkapan Kategori Transaksi",
            "level": "attention",
            "trigger_metric": "uncategorized_count",
            "current_value": uncategorized,
            "threshold": 0,
            "period": {"from": str(period_from), "to": str(period_to)},
            "explanation": f"Terdapat {uncategorized} transaksi pemasukan/pengeluaran tanpa kategori.",
            "recommendation": "Lengkapi kategori transaksi untuk meningkatkan akurasi laporan keuangan."
        })
    else:
        signals.append({
            "id": "SIG-DQ-01",
            "title": "Kualitas Data Baik",
            "level": "normal",
            "trigger_metric": "uncategorized_count",
            "current_value": 0,
            "threshold": 0,
            "period": {"from": str(period_from), "to": str(period_to)},
            "explanation": "Semua transaksi telah terklasifikasi ke dalam kategori yang tepat.",
            "recommendation": "Pertahankan disiplin kategorisasi transaksi."
        })

    # Determine overall status
    levels = [s["level"] for s in signals]
    if "critical" in levels:
        overall = "critical"
    elif "attention" in levels:
        overall = "attention"
    elif "insufficient" in levels:
        overall = "insufficient"
    else:
        overall = "normal"

    return {
        "period": {"from": str(period_from), "to": str(period_to)},
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "overall_status": overall,
        "signals": signals
    }

def generate_recommendations(transactions, period_from, period_to):
    agg = _aggregate_transactions(transactions)
    net_revenue = agg["net_revenue"]
    expense = agg["expense"]
    cash_in = agg["cash_in"]
    cash_out = agg["cash_out"]
    surplus = agg["surplus"]
    net_cash_flow = cash_in - cash_out
    uncategorized = agg["uncategorized"]
    now_iso = datetime.now(timezone.utc).isoformat()
    period = {"from": str(period_from), "to": str(period_to)}

    recs = []

    # REC-1: Cash Deficit
    if net_cash_flow < ZERO:
        recs.append({
            "id": "REC-CF-01",
            "rule_id": "RULE-CF-01",
            "rule_version": "1.0.0",
            "title": "Kendalikan Pengeluaran Kas & Amankan Likuiditas",
            "priority": "high",
            "trigger_metrics": {
                "net_cash_flow": money(net_cash_flow),
                "cash_out": money(cash_out)
            },
            "period": period,
            "evidence": [
                f"Arus kas keluar (Rp {money(cash_out)}) melebihi arus kas masuk (Rp {money(cash_in)}) pada periode ini.",
                f"Defisit kas bersih tercatat sebesar Rp {money(abs(net_cash_flow))}."
            ],
            "suggested_actions": [
                "Tunda pembelian aset atau pengeluaran diskresioner non-esensial",
                "Percepat tindak lanjut penagihan piutang pelanggan",
                "Lakukan renegosiasi termin pembayaran dengan vendor"
            ],
            "assumptions": ["Transaksi kas yang tercatat mencerminkan pergerakan riil rekening usaha"],
            "limitations": ["Tidak memperhitungkan fasilitas kredit atau plafon overdraft yang belum dicairkan"],
            "confidence_label": "Tinggi",
            "status": "active",
            "created_at": now_iso
        })

    # REC-2: High Expense Ratio
    if net_revenue > ZERO and (expense / net_revenue) > Decimal("0.85"):
        ratio = (expense / net_revenue) * 100
        recs.append({
            "id": "REC-EXP-01",
            "rule_id": "RULE-EXP-01",
            "rule_version": "1.0.0",
            "title": "Evaluasi dan Rasionalisasi Beban Operasional",
            "priority": "medium",
            "trigger_metrics": {
                "expense_ratio_pct": money(ratio),
                "total_expense": money(expense)
            },
            "period": period,
            "evidence": [
                f"Beban operasional menyerap {money(ratio)}% dari total pendapatan bersih usaha."
            ],
            "suggested_actions": [
                "Periksa 3 pos beban pengeluaran terbesar untuk mencari potensi efisiensi",
                "Pastikan tidak ada pengeluaran pribadi yang tercampur ke dalam akun beban usaha"
            ],
            "assumptions": ["Beban operasional tercatat akurat dan tidak ada biaya tunda"],
            "limitations": ["Biaya musiman atau investasi awal dapat mendistorsi rasio jangka pendek"],
            "confidence_label": "Sedang",
            "status": "active",
            "created_at": now_iso
        })

    # REC-3: Uncategorized Transactions
    if uncategorized > 0:
        recs.append({
            "id": "REC-DQ-01",
            "rule_id": "RULE-DQ-01",
            "rule_version": "1.0.0",
            "title": "Lengkapi Kategori Transaksi untuk Meningkatkan Akurasi Laporan",
            "priority": "medium",
            "trigger_metrics": {
                "uncategorized_count": uncategorized
            },
            "period": period,
            "evidence": [
                f"Terdapat {uncategorized} transaksi pemasukan/pengeluaran yang belum memiliki kategori."
            ],
            "suggested_actions": [
                "Buka menu Daftar Transaksi dan pilih kategori yang sesuai untuk setiap transaksi tanpa kategori"
            ],
            "assumptions": ["Setiap transaksi dapat dipetakan ke salah satu kategori yang tersedia"],
            "limitations": ["Selama belum berkategori, status kualitas data laporan tetap berstatus 'partial'"],
            "confidence_label": "Tinggi",
            "status": "active",
            "created_at": now_iso
        })

    # REC-4: Surplus Optimization
    if surplus > ZERO and net_cash_flow > ZERO:
        recs.append({
            "id": "REC-SAV-01",
            "rule_id": "RULE-SAV-01",
            "rule_version": "1.0.0",
            "title": "Optimalkan Alokasi Cadangan Kas Dana Darurat",
            "priority": "low",
            "trigger_metrics": {
                "simple_surplus": money(surplus),
                "net_cash_flow": money(net_cash_flow)
            },
            "period": period,
            "evidence": [
                f"Usaha membukukan surplus operasional Rp {money(surplus)} dan arus kas positif Rp {money(net_cash_flow)}."
            ],
            "suggested_actions": [
                "Sisihkan 10% - 20% dari surplus ke rekening kas darurat usaha terpisah",
                "Targetkan saldo dana darurat kas operasional minimal 1-3 bulan kebutuhan operasional"
            ],
            "assumptions": ["Arus kas masuk tetap stabil pada periode berikutnya"],
            "limitations": ["Rekomendasi bersifat umum; kebutuhan modal kerja spesifik tergantung siklus penagihan usaha"],
            "confidence_label": "Sedang",
            "status": "active",
            "created_at": now_iso
        })

    return {
        "recommendations": recs,
        "period": period,
        "generated_at": now_iso
    }

def calculate_cash_flow_forecast(transactions, horizon=3, period_unit="month"):
    now_iso = datetime.now(timezone.utc).isoformat()
    monthly_flows = defaultdict(lambda: ZERO)
    for tx in transactions:
        if tx.status != "posted":
            continue
        sign = Decimal(-1) if tx.reversal_of_id else Decimal(1)
        month_key = tx.transaction_date.strftime("%Y-%m")
        if tx.tx_type in ("income", "loan_received", "owner_contribution"):
            monthly_flows[month_key] += sign * tx.amount
        elif tx.tx_type in ("expense", "refund", "loan_repayment", "owner_draw"):
            monthly_flows[month_key] -= sign * tx.amount

    sorted_months = sorted(monthly_flows.keys())

    if len(sorted_months) < 2:
        return {
            "target": "cash_flow",
            "horizon": horizon,
            "period_unit": period_unit,
            "status": "evaluating",
            "model_version": "baseline-ma-v1",
            "baseline_model": "3-month moving average",
            "training_window": {
                "from": sorted_months[0] if sorted_months else "",
                "to": sorted_months[-1] if sorted_months else ""
            },
            "created_at": now_iso,
            "limitations": ["Data historis kurang dari 2 periode; evaluasi model ditangguhkan sesuai METODOLOGI."],
            "predictions": [],
            "evaluation": {}
        }

    recent_vals = [monthly_flows[m] for m in sorted_months[-3:]]
    avg_flow = sum(recent_vals) / Decimal(len(recent_vals))

    diffs = [abs(monthly_flows[sorted_months[i]] - monthly_flows[sorted_months[i-1]]) for i in range(1, len(sorted_months))]
    mae = float(sum(diffs) / Decimal(len(diffs))) if diffs else 0.0

    predictions = []
    last_year, last_month = map(int, sorted_months[-1].split("-"))
    for step in range(1, horizon + 1):
        m_next = last_month + step
        y_next = last_year + (m_next - 1) // 12
        m_norm = ((m_next - 1) % 12) + 1
        period_label = f"{y_next:04d}-{m_norm:02d}"
        predictions.append({
            "period": period_label,
            "predicted_value": money(avg_flow),
            "lower_bound": money(avg_flow * Decimal("0.85")),
            "upper_bound": money(avg_flow * Decimal("1.15"))
        })

    return {
        "target": "cash_flow",
        "horizon": horizon,
        "period_unit": period_unit,
        "status": "available",
        "model_version": "baseline-ma-v1",
        "baseline_model": "3-month moving average",
        "training_window": {
            "from": sorted_months[0],
            "to": sorted_months[-1]
        },
        "created_at": now_iso,
        "limitations": [
            "Estimasi berbasis Moving Average deterministik; belum memperhitungkan variasi musiman jangka panjang",
            "Forecast hanya memproyeksikan arus kas bersih dari transaksi tercatat"
        ],
        "predictions": predictions,
        "evaluation": {
            "mae": round(mae, 2)
        }
    }



# ==========================================
# WALK-FORWARD BACKTEST (Phase 5 / P2)
# ==========================================

def run_walk_forward_backtest(transactions, horizon=3, period_unit="month", min_train_periods=3):
    """
    Walk-forward / rolling-origin validation untuk baseline Moving Average forecast.

    Metodologi sesuai FINANCIAL_AI_METHODOLOGY.md §7:
    - Tidak menggunakan random shuffle pada time-series.
    - Setiap fold: train pada periode [0..t-1], prediksi periode [t..t+horizon-1].
    - Metrik: MAE, WAPE, sMAPE, Bias, MASE.
    - Model hanya di-release jika melewati gate (beat naive baseline, bias acceptable).
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # Agregasi per bulan
    monthly_flows = defaultdict(lambda: ZERO)
    for tx in transactions:
        if tx.status != "posted":
            continue
        sign = Decimal(-1) if tx.reversal_of_id else Decimal(1)
        month_key = tx.transaction_date.strftime("%Y-%m")
        if tx.tx_type in ("income", "loan_received", "owner_contribution"):
            monthly_flows[month_key] += sign * tx.amount
        elif tx.tx_type in ("expense", "refund", "loan_repayment", "owner_draw"):
            monthly_flows[month_key] -= sign * tx.amount

    sorted_months = sorted(monthly_flows.keys())
    n = len(sorted_months)

    # Gate: minimal 8 titik data sesuai metodologi
    if n < 8:
        return {
            "status": "insufficient_data",
            "model_version": "baseline-ma-v1",
            "period_unit": period_unit,
            "horizon": horizon,
            "data_points": n,
            "minimum_required": 8,
            "message": f"Data historis hanya {n} periode. Minimum 8 periode diperlukan untuk backtest.",
            "folds": [],
            "aggregate_metrics": {},
            "baseline_metrics": {},
            "gate_passed": False,
            "gate_reason": "Jumlah titik data di bawah minimum metodologi (8 periode).",
            "created_at": now_iso
        }

    actual_values = [monthly_flows[m] for m in sorted_months]

    # --- Rolling-origin folds ---
    folds = []
    all_errors = []          # MA model errors
    all_naive_errors = []    # Naive baseline errors
    all_actuals = []
    all_predicted = []

    for t in range(min_train_periods, n - horizon + 1):
        train = actual_values[:t]
        test = actual_values[t:t + horizon]

        # MA prediction: rata-rata 3 periode terakhir train
        window = train[-3:] if len(train) >= 3 else train
        ma_pred = sum(window) / Decimal(len(window))

        # Naive baseline: nilai terakhir train diulang
        naive_pred = train[-1]

        fold_results = []
        fold_naive_results = []
        for step_idx, actual in enumerate(test):
            err_ma = ma_pred - actual
            err_naive = naive_pred - actual
            fold_results.append({
                "step": step_idx + 1,
                "period": sorted_months[t + step_idx],
                "predicted": float(ma_pred),
                "actual": float(actual),
                "error": float(err_ma),
                "abs_error": float(abs(err_ma))
            })
            fold_naive_results.append(float(abs(err_naive)))
            all_errors.append(err_ma)
            all_naive_errors.append(abs(err_naive))
            all_actuals.append(actual)
            all_predicted.append(ma_pred)

        folds.append({
            "fold_index": t - min_train_periods,
            "train_periods": sorted_months[:t],
            "test_periods": sorted_months[t:t + horizon],
            "ma_prediction": float(ma_pred),
            "naive_prediction": float(naive_pred),
            "steps": fold_results
        })

    if not all_errors:
        return {
            "status": "insufficient_folds",
            "model_version": "baseline-ma-v1",
            "data_points": n,
            "gate_passed": False,
            "gate_reason": "Tidak cukup fold yang dapat dibentuk dari data yang tersedia.",
            "folds": [],
            "aggregate_metrics": {},
            "created_at": now_iso
        }

    # --- Hitung metrik agregat ---
    n_obs = len(all_errors)
    mae = sum(abs(e) for e in all_errors) / Decimal(n_obs)
    bias = sum(all_errors) / Decimal(n_obs)

    total_actual = sum(abs(a) for a in all_actuals)
    wape = (sum(abs(e) for e in all_errors) / total_actual * 100) if total_actual != ZERO else None

    # sMAPE
    smape_vals = []
    for pred, act in zip(all_predicted, all_actuals):
        denom = (abs(act) + abs(pred)) / 2
        if denom != ZERO:
            smape_vals.append(abs(pred - act) / denom * 100)
    smape = sum(smape_vals) / Decimal(len(smape_vals)) if smape_vals else None

    # MASE: MAE model / MAE naive in-sample
    # In-sample naive: naive = nilai periode sebelumnya
    naive_mae_insample = sum(
        abs(actual_values[i] - actual_values[i - 1])
        for i in range(1, n)
    ) / Decimal(n - 1) if n > 1 else None

    mase = (mae / naive_mae_insample) if (naive_mae_insample and naive_mae_insample != ZERO) else None

    # Metrik naive baseline (dari folds)
    naive_mae = sum(all_naive_errors) / Decimal(len(all_naive_errors)) if all_naive_errors else None

    # --- Gate check ---
    gate_passed = True
    gate_reasons = []

    # 1. MA harus lebih baik atau sebanding dengan naive (MAE)
    if naive_mae is not None and mae > naive_mae * Decimal("1.05"):
        gate_passed = False
        gate_reasons.append(
            f"MAE model ({float(mae):.2f}) lebih buruk dari naive baseline ({float(naive_mae):.2f}). "
            "Model tidak memenuhi gate improvement."
        )

    # 2. Bias tidak boleh ekstrem (>50% dari MAE)
    if mae != ZERO and abs(bias) > mae * Decimal("0.50"):
        gate_passed = False
        gate_reasons.append(
            f"Bias ({float(bias):.2f}) terlalu besar relatif terhadap MAE ({float(mae):.2f}). "
            "Forecast memiliki kecenderungan sistematis yang tidak acceptable."
        )

    # 3. Minimal data points cukup
    if n < 8:
        gate_passed = False
        gate_reasons.append("Jumlah data point di bawah minimum 8 periode.")

    gate_reason_text = " | ".join(gate_reasons) if gate_reasons else "Semua kriteria gate terpenuhi."

    aggregate_metrics = {
        "mae": round(float(mae), 2),
        "bias": round(float(bias), 2),
        "wape_pct": round(float(wape), 2) if wape is not None else None,
        "smape_pct": round(float(smape), 2) if smape is not None else None,
        "mase": round(float(mase), 4) if mase is not None else None,
        "n_observations": n_obs,
        "n_folds": len(folds)
    }

    baseline_metrics = {
        "naive_mae": round(float(naive_mae), 2) if naive_mae is not None else None,
        "model_vs_naive": (
            "improved" if (naive_mae and mae <= naive_mae)
            else "worse" if naive_mae else "unavailable"
        )
    }

    return {
        "status": "passed" if gate_passed else "failed",
        "model_version": "baseline-ma-v1",
        "baseline_model": "3-month moving average",
        "period_unit": period_unit,
        "horizon": horizon,
        "data_points": n,
        "training_window": {
            "from": sorted_months[0],
            "to": sorted_months[-1]
        },
        "aggregate_metrics": aggregate_metrics,
        "baseline_metrics": baseline_metrics,
        "gate_passed": gate_passed,
        "gate_reason": gate_reason_text,
        "limitations": [
            "Validasi berbasis Moving Average deterministik, belum mencakup model musiman.",
            "Backtest bukan jaminan performa masa depan; representativitas window sangat bergantung pada data historis.",
            "Jika gate tidak terpenuhi, forecast tidak boleh digunakan."
        ],
        "folds": folds,
        "created_at": now_iso
    }
