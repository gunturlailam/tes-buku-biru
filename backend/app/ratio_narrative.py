"""Narasi rasio: fallback deterministik + LLM opsional.

LLM hanya menerima kode rasio, band, arah, dan kualitas data. Tidak ada
nominal, nama bisnis, atau data transaksi yang dikirim. Output LLM divalidasi
oleh llm_adapter; jika gagal, teks fallback dipakai.
"""

from .ratio_engine import RATIO_META
from .llm_adapter import generate_ratio_explanation


BAND_LABEL = {
    "above_target": "di atas target",
    "between_target_warning": "di antara target dan batas warning",
    "between_warning_critical": "di antara warning dan batas kritis",
    "below_critical": "melewati batas kritis",
    "not_configured": "belum memiliki ambang yang dikonfigurasi",
    "insufficient": "belum dapat dihitung karena data belum lengkap",
}

RATIO_BASE = {
    "CR": "Current ratio membandingkan aset lancar dengan utang lancar.",
    "QR": "Quick ratio mengukur likuiditas tanpa mengandalkan persediaan dan prepaid.",
    "CASH_RATIO": "Cash ratio mengukur kemampuan kas menutup utang lancar.",
    "DER": "Debt to equity membandingkan total utang dengan ekuitas.",
    "DAR": "Debt to asset menunjukkan porsi aset yang dibiayai utang.",
    "ICR": "Interest coverage mengukur kemampuan laba operasi menutup beban bunga.",
    "INV_TURN": "Inventory turnover menunjukkan kecepatan persediaan berputar menjadi penjualan.",
    "ACP": "Average collection period menunjukkan rata-rata waktu penagihan piutang.",
    "DPO": "Days payable outstanding menunjukkan rata-rata waktu pembayaran utang usaha.",
    "TATO": "Total asset turnover mengukur produktivitas aset dalam menghasilkan pendapatan.",
    "GPM": "Gross profit margin menunjukkan margin setelah harga pokok penjualan.",
    "OPM": "Operating margin menunjukkan margin setelah beban operasional.",
    "NPM": "Net profit margin menunjukkan margin laba bersih.",
    "ROA": "Return on assets mengukur laba terhadap rata-rata aset.",
    "ROE": "Return on equity mengukur laba terhadap rata-rata ekuitas.",
    "REV_GROWTH": "Revenue growth membandingkan pendapatan dengan periode sebelumnya.",
}

CATEGORY_ACTIONS = {
    "liquidity": {
        "above_target": "Pertahankan buffer kas dan hindari menambah utang jangka pendek tanpa kebutuhan operasional.",
        "between_target_warning": "Pantau arus kas mingguan dan percepat penagihan piutang.",
        "between_warning_critical": "Susun rencana likuiditas 30 hari; tunda belanja modal dan negosiasikan jatuh tempo utang.",
        "below_critical": "Prioritaskan penagihan, restrukturisasi utang jangka pendek, dan tahan pengeluaran non-esensial.",
    },
    "solvency": {
        "above_target": "Pertahankan struktur modal dan jaga rasio utang dalam batas aman.",
        "between_target_warning": "Batasi tambahan utang dan evaluasi beban bunga.",
        "between_warning_critical": "Susun rencana penurunan utang dan hindari ekspansi dengan utang baru.",
        "below_critical": "Segera negosiasikan restrukturisasi utang dan fokus pada perbaikan ekuitas.",
    },
    "activity": {
        "above_target": "Pertahankan efisiensi dan dokumentasikan kebijakan persediaan serta penagihan.",
        "between_target_warning": "Tinjau umur persediaan dan proses penagihan untuk mengurangi dana tertahan.",
        "between_warning_critical": "Identifikasi stok lambat dan piutang jatuh tempo; tetapkan target perbaikan.",
        "below_critical": "Lakukan audit persediaan dan piutang, hentikan pembelian berlebih, dan percepat konversi menjadi kas.",
    },
    "profitability": {
        "above_target": "Pertahankan margin dan fokus pada kualitas pendapatan, bukan hanya volume.",
        "between_target_warning": "Tinjau harga jual, biaya bahan, dan beban operasional terbesar.",
        "between_warning_critical": "Susun rencana perbaikan margin dan disiplin biaya dalam 30-60 hari.",
        "below_critical": "Evaluasi harga, HPP, dan biaya tetap; hentikan lini produk yang merugi.",
    },
    "growth": {
        "above_target": "Pertahankan momentum pertumbuhan sambil menjaga kualitas piutang dan margin.",
        "between_target_warning": "Diversifikasi sumber pendapatan dan pantau konsistensi pertumbuhan.",
        "between_warning_critical": "Analisis penyebab perlambatan dan fokus pada retensi pelanggan.",
        "below_critical": "Tinjau strategi penjualan, kanal akuisisi, dan retensi pelanggan.",
    },
}

DEFAULT_ACTION = {
    "above_target": "Pertahankan kondisi saat ini dan pantau perubahan secara berkala.",
    "between_target_warning": "Pantau tren dan siapkan langkah preventif sebelum kondisi memburuk.",
    "between_warning_critical": "Prioritaskan perbaikan dalam siklus kas berikutnya.",
    "below_critical": "Ambil tindakan korektif segera dan tetapkan pemilik tindakan.",
    "not_configured": "Tetapkan ambang target, warning, dan kritis agar rasio dapat ditafsirkan.",
    "insufficient": "Lengkapi data sumber dan klasifikasi akun sebelum menilai rasio ini.",
}

DISCLAIMER = (
    "Narasi ini bersifat informatif, bukan saran keuangan, pajak, atau hukum. "
    "Angka rasio dihitung oleh engine deterministik, bukan oleh model bahasa."
)


def fallback_narrative(code: str, band: str, quality: str = "ok",
                       reason: str = "") -> dict:
    name, category, _unit = RATIO_META.get(code, (code, "other", "x"))
    base = RATIO_BASE.get(code, f"Rasio {name} menunjukkan kondisi {category} usaha.")
    band_label = BAND_LABEL.get(band, band)
    action = CATEGORY_ACTIONS.get(category, {}).get(band) or DEFAULT_ACTION.get(
        band, DEFAULT_ACTION["insufficient"]
    )

    if band == "insufficient" and reason:
        explanation = f"{reason} {action}"
    else:
        explanation = f"{base} Nilai saat ini {band_label}. {action}"

    return {
        "explanation": explanation,
        "action": action,
        "source": "fallback",
        "llm_enabled": False,
        "quality": quality,
        "disclaimer": DISCLAIMER,
    }


def explain_ratio(code: str, band: str, quality: str = "ok",
                  direction: str = "higher", reason: str = "") -> dict:
    """Coba LLM dengan payload tersanitasi; selalu punya fallback aman."""
    fallback = fallback_narrative(code, band, quality, reason)
    if band == "insufficient":
        return fallback

    name, category, _unit = RATIO_META.get(code, (code, "other", "x"))
    llm_result = generate_ratio_explanation(
        {
            "ratio_code": code,
            "ratio_name": name,
            "category": category,
            "band": band,
            "direction": direction,
            "quality": quality,
        },
        fallback["explanation"],
    )

    merged = dict(fallback)
    merged.update(llm_result)
    return merged
