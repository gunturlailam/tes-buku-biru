"use client";

import { useState } from "react";
import { RiskSignalCard } from "@/features/insights/components/RiskSignalCard";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import { Button } from "@/components/ui/Button";
import type { FinancialHealth } from "@/types/financial";
import { Filter } from "lucide-react";

const mockHealthData: FinancialHealth = {
  period: {
    from: "2026-10-01",
    to: "2026-10-31",
  },
  generated_at: new Date().toISOString(),
  overall_status: "attention",
  signals: [
    {
      id: "signal-1",
      title: "Kas Runway Rendah",
      level: "attention",
      trigger_metric: "cash_runway_days",
      current_value: 25,
      threshold: 30,
      period: {
        from: "2026-10-01",
        to: "2026-10-31",
      },
      explanation:
        "Dengan arus kas saat ini, dana operasional cukup untuk 25 hari. Ambang batas perhatian adalah 30 hari. Pertimbangkan untuk meninjau pengeluaran dan memprioritaskan cash inflow.",
      recommendation:
        "Tinjau pengeluaran dan prioritaskan peningkatan cash inflow",
    },
    {
      id: "signal-2",
      title: "Margin Laba Menurun",
      level: "attention",
      trigger_metric: "net_margin_change",
      current_value: -3.2,
      threshold: -5,
      period: {
        from: "2026-10-01",
        to: "2026-10-31",
      },
      explanation:
        "Net margin turun 3.2 poin persentase dibanding periode sebelumnya. Penurunan ini mendekati ambang batas yang memerlukan perhatian khusus.",
      recommendation: "Review struktur biaya dan strategi pricing produk/jasa",
    },
    {
      id: "signal-3",
      title: "Arus Kas Positif",
      level: "normal",
      trigger_metric: "net_cash_flow",
      current_value: 9500000,
      period: {
        from: "2026-10-01",
        to: "2026-10-31",
      },
      explanation:
        "Arus kas bersih positif sebesar Rp 9.500.000 pada periode ini. Kondisi arus kas sehat dan mendukung operasional berkelanjutan.",
    },
    {
      id: "signal-4",
      title: "Pendapatan Stabil",
      level: "normal",
      trigger_metric: "revenue_trend",
      current_value: 2.3,
      period: {
        from: "2026-10-01",
        to: "2026-10-31",
      },
      explanation:
        "Pendapatan tumbuh 2.3% dibanding periode sebelumnya. Pertumbuhan stabil menunjukkan konsistensi penjualan.",
    },
  ],
};

export default function InsightsPage() {
  const [filterLevel, setFilterLevel] = useState<
    "all" | "normal" | "attention" | "critical"
  >("all");

  const filteredSignals =
    filterLevel === "all"
      ? mockHealthData.signals
      : mockHealthData.signals.filter((s) => s.level === filterLevel);

  const criticalCount = mockHealthData.signals.filter(
    (s) => s.level === "critical",
  ).length;
  const attentionCount = mockHealthData.signals.filter(
    (s) => s.level === "attention",
  ).length;
  const normalCount = mockHealthData.signals.filter(
    (s) => s.level === "normal",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1F241D]">
          Insight Kesehatan Keuangan
        </h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Analisis risiko dan indikator kesehatan finansial usaha Anda
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#1F241D]">
              Ringkasan Status
            </h3>
            <p className="text-xs text-[#7E8379] mt-0.5">
              Periode: {mockHealthData.period.from} - {mockHealthData.period.to}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-900">Kritis</span>
              <span className="text-2xl font-serif font-bold text-red-600">
                {criticalCount}
              </span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Memerlukan tindakan segera
            </p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-900">
                Perhatian
              </span>
              <span className="text-2xl font-serif font-bold text-yellow-600">
                {attentionCount}
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">Perlu monitoring</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-900">
                Normal
              </span>
              <span className="text-2xl font-serif font-bold text-emerald-600">
                {normalCount}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">Kondisi sehat</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-[#666A61]">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filter:</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterLevel === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterLevel("all")}
          >
            Semua ({mockHealthData.signals.length})
          </Button>
          <Button
            variant={filterLevel === "critical" ? "danger" : "ghost"}
            size="sm"
            onClick={() => setFilterLevel("critical")}
          >
            Kritis ({criticalCount})
          </Button>
          <Button
            variant={filterLevel === "attention" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterLevel("attention")}
          >
            Perhatian ({attentionCount})
          </Button>
          <Button
            variant={filterLevel === "normal" ? "success" : "ghost"}
            size="sm"
            onClick={() => setFilterLevel("normal")}
          >
            Normal ({normalCount})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredSignals.map((signal) => (
          <RiskSignalCard key={signal.id} signal={signal} />
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-[#7E8379]" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-[#1F241D] mb-2">
              Tidak Ada Sinyal
            </h3>
            <p className="text-sm text-[#7E8379]">
              Tidak ada sinyal dengan level {filterLevel} pada periode ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
