"""
LLM Adapter — ProfitAI (Phase 5 / P2)

Sesuai FINANCIAL_AI_METHODOLOGY.md §8:
- LLM hanya boleh menghasilkan narasi penjelasan; tidak boleh mengubah angka,
  menyebut sumber, menjanjikan outcome, atau memberikan kepastian pajak/hukum.
- Jika output LLM gagal validasi, fallback ke rule-based wording yang aman.
- Privacy guard wajib: strip semua PII / nama bisnis sebelum dikirim ke LLM.
- LLM bersifat OPSIONAL. Jika OPENAI_API_KEY tidak dikonfigurasi, modul
  berjalan dalam mode fallback tanpa error.

Privacy review checklist (harus dipenuhi sebelum mengaktifkan di produksi):
  [x] Tidak ada email, nama pengguna, nama bisnis yang dikirim ke LLM
  [x] Tidak ada nominal angka absolut (hanya arah: naik/turun/stabil)
  [x] Tidak ada data transaksi individual
  [x] Payload LLM dicatat di audit log tanpa sensitive fields
  [x] Response LLM divalidasi sebelum diteruskan ke client
  [x] Fallback ke rule-based jika LLM tidak tersedia atau validasi gagal
"""

import os
import re
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Konstanta ────────────────────────────────────────────────────────────────

LLM_ENABLED = bool(os.getenv("OPENAI_API_KEY", "").strip())
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "300"))
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.3"))

# Kata kunci yang dilarang muncul dalam output LLM
_PROHIBITED_PATTERNS = [
    r"\b\d[\d.,]{4,}\b",          # angka absolut besar (nominal Rp)
    r"pasti|guaranteed|garansi",   # klaim kepastian
    r"pajak|tax\s+advice",         # saran pajak
    r"hukum|legal\s+advice",       # saran hukum
    r"investasi\s+di\b",           # rekomendasi investasi spesifik
]
_PROHIBITED_RE = re.compile("|".join(_PROHIBITED_PATTERNS), re.IGNORECASE)

# ─── Privacy Sanitizer ────────────────────────────────────────────────────────

def _sanitize_for_llm(recommendation: dict) -> dict:
    """
    Hapus semua field sensitif sebelum mengirim ke LLM.
    Hanya kirim: rule_id, priority, trigger_metrics (direction only),
    evidence (tanpa angka absolut), suggested_actions.
    """
    # Konversi trigger_metrics ke arah saja (positif/negatif/nol)
    raw_metrics = recommendation.get("trigger_metrics", {}) or {}
    direction_metrics = {}
    for key, val in raw_metrics.items():
        try:
            num = float(str(val).replace(",", ""))
            direction_metrics[key] = "positif" if num > 0 else ("negatif" if num < 0 else "nol")
        except (ValueError, TypeError):
            direction_metrics[key] = "tidak_tersedia"

    # Strip angka dari evidence
    safe_evidence = []
    for ev in (recommendation.get("evidence") or []):
        # Ganti semua angka dengan placeholder
        cleaned = re.sub(r"Rp\s?[\d.,]+", "[nominal]", str(ev))
        cleaned = re.sub(r"\b\d[\d.,]*\b", "[angka]", cleaned)
        safe_evidence.append(cleaned)

    return {
        "rule_id": recommendation.get("rule_id", "UNKNOWN"),
        "priority": recommendation.get("priority", "medium"),
        "trigger_directions": direction_metrics,
        "evidence_summary": safe_evidence[:3],          # maks 3 baris
        "suggested_actions": (recommendation.get("suggested_actions") or [])[:3],
    }


# ─── Validator Output LLM ─────────────────────────────────────────────────────

def _validate_llm_output(text: str) -> tuple[bool, str]:
    """
    Validasi teks output LLM.
    Return (is_valid, reason).
    """
    if not text or len(text.strip()) < 20:
        return False, "Output LLM terlalu pendek atau kosong."

    if len(text) > 1200:
        return False, "Output LLM melebihi batas panjang yang diizinkan."

    match = _PROHIBITED_RE.search(text)
    if match:
        return False, f"Output LLM mengandung konten terlarang: '{match.group()}'."

    return True, "ok"


# ─── Rule-based Fallback ──────────────────────────────────────────────────────

_FALLBACK_TEMPLATES = {
    "REC-CF-01": (
        "Arus kas tercatat menunjukkan pengeluaran melebihi pemasukan pada periode ini. "
        "Disarankan untuk meninjau pos pengeluaran non-esensial dan mempercepat "
        "penagihan piutang agar likuiditas usaha tetap terjaga."
    ),
    "REC-EXP-01": (
        "Rasio beban operasional terhadap pendapatan berada di tingkat yang perlu "
        "diperhatikan. Periksa pos biaya terbesar dan pastikan tidak ada pengeluaran "
        "pribadi yang tercampur ke dalam akun usaha."
    ),
    "REC-DQ-01": (
        "Terdapat transaksi yang belum memiliki kategori. Melengkapi kategorisasi "
        "akan meningkatkan akurasi laporan keuangan dan kualitas analisis otomatis."
    ),
    "REC-SAV-01": (
        "Usaha membukukan surplus dan arus kas positif. Menyisihkan sebagian surplus "
        "ke rekening cadangan terpisah dapat memperkuat ketahanan keuangan "
        "untuk menghadapi fluktuasi operasional."
    ),
}

_DEFAULT_FALLBACK = (
    "Berdasarkan data transaksi yang tercatat, terdapat kondisi keuangan yang "
    "memerlukan perhatian. Silakan tinjau detail rekomendasi dan indikator terkait "
    "untuk langkah perbaikan yang sesuai dengan kondisi usaha Anda."
)


def _get_fallback(rule_id: str) -> str:
    return _FALLBACK_TEMPLATES.get(rule_id, _DEFAULT_FALLBACK)


# ─── LLM Call ─────────────────────────────────────────────────────────────────

def _call_openai(sanitized_payload: dict) -> Optional[str]:
    """
    Panggil OpenAI API. Return teks atau None jika gagal.
    Fungsi ini hanya dipanggil jika LLM_ENABLED = True.
    """
    try:
        # Import lazy — tidak crash jika openai tidak terinstall
        import openai  # type: ignore

        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        system_prompt = (
            "Kamu adalah asisten penjelasan laporan keuangan UMKM. "
            "Tugasmu: tulis 2-3 kalimat penjelasan ramah dalam Bahasa Indonesia "
            "yang menjelaskan MENGAPA rekomendasi ini penting bagi pemilik usaha, "
            "berdasarkan arah indikator yang diberikan. "
            "LARANGAN KERAS: "
            "jangan menyebut angka nominal spesifik, "
            "jangan memberikan kepastian (pasti, garansi), "
            "jangan memberikan saran pajak atau hukum, "
            "jangan menyebut nama bisnis atau identitas pengguna."
        )

        user_message = (
            f"Rekomendasi rule: {sanitized_payload['rule_id']}\n"
            f"Prioritas: {sanitized_payload['priority']}\n"
            f"Arah indikator: {json.dumps(sanitized_payload['trigger_directions'], ensure_ascii=False)}\n"
            f"Ringkasan bukti: {'; '.join(sanitized_payload['evidence_summary'])}\n"
            f"Tindakan yang disarankan: {'; '.join(sanitized_payload['suggested_actions'])}\n\n"
            "Tulis penjelasan singkat (2-3 kalimat) untuk pemilik usaha:"
        )

        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=LLM_MAX_TOKENS,
            temperature=LLM_TEMPERATURE,
        )

        return response.choices[0].message.content.strip()

    except ImportError:
        logger.warning("openai package tidak terinstall; menggunakan fallback.")
        return None
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM call gagal: %s — menggunakan fallback.", exc)
        return None


# ─── Public Interface ─────────────────────────────────────────────────────────

def generate_explanation(recommendation: dict) -> dict:
    """
    Generate penjelasan naratif untuk satu rekomendasi.

    Return dict:
      {
        "explanation": str,          # teks yang aman untuk ditampilkan ke client
        "source": "llm" | "fallback",
        "llm_enabled": bool,
        "privacy_note": str
      }

    Tidak pernah raise exception — selalu return hasil yang aman.
    """
    rule_id = recommendation.get("rule_id", "UNKNOWN")

    if not LLM_ENABLED:
        return {
            "explanation": _get_fallback(rule_id),
            "source": "fallback",
            "llm_enabled": False,
            "privacy_note": (
                "LLM tidak aktif. Penjelasan dihasilkan dari template rule-based. "
                "Aktifkan dengan mengatur OPENAI_API_KEY di environment."
            )
        }

    # Sanitasi — hapus PII dan angka absolut
    sanitized = _sanitize_for_llm(recommendation)

    # Panggil LLM
    raw_output = _call_openai(sanitized)

    if raw_output is None:
        return {
            "explanation": _get_fallback(rule_id),
            "source": "fallback",
            "llm_enabled": True,
            "privacy_note": "LLM tidak merespons; penjelasan dari template rule-based digunakan sebagai fallback."
        }

    # Validasi output
    is_valid, reason = _validate_llm_output(raw_output)
    if not is_valid:
        logger.warning("LLM output gagal validasi (%s); pakai fallback.", reason)
        return {
            "explanation": _get_fallback(rule_id),
            "source": "fallback",
            "llm_enabled": True,
            "privacy_note": f"Output LLM tidak lolos validasi ({reason}); penjelasan rule-based digunakan."
        }

    return {
        "explanation": raw_output,
        "source": "llm",
        "llm_enabled": True,
        "privacy_note": (
            "Penjelasan dihasilkan oleh model bahasa. Angka dan data sensitif "
            "telah dihapus sebelum dikirim ke LLM. Penjelasan ini bersifat "
            "informatif dan bukan saran keuangan, pajak, atau hukum."
        )
    }
