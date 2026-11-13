"use client";

import { useState } from "react";
import { RecommendationCard } from "@/features/recommendations/components/RecommendationCard";
import { Button } from "@/components/ui/Button";
import type { Recommendation } from "@/types/financial";
import { Filter, Sparkles } from "lucide-react";

const mockRecommendations: Recommendation[] = [
  {
    id: "rec-1",
    rule_id: "receivable_days_high",
    rule_version: "1.0.0",
    title: "Tinjau Piutang Usaha",
    priority: "high",
    trigger_metrics: {
      receivable_days: 45,
      historical_median: 30,
    },
    period: {
      from: "2026-10-01",
      to: "2026-10-31",
    },
    evidence: [
      "Receivable days saat ini: 45 hari",
      "Median historis: 30 hari",
      "1.5× dari baseline normal",
    ],
    suggested_actions: [
      "Review aging receivables report untuk identifikasi pelanggan dengan tunggakan >30 hari",
      "Follow up aktif ke pelanggan dengan outstanding invoice terlama",
      "Pertimbangkan penyesuaian payment term untuk pelanggan baru",
      "Evaluasi pemberian diskon early payment untuk mempercepat collection",
    ],
    assumptions: [
      "Semua transaksi penjualan kredit sudah dicatat",
      "Pola historis representatif untuk kondisi normal",
    ],
    limitations: [
      "Rekomendasi berdasarkan 3 bulan data historis",
      "Faktor spesifik per pelanggan belum dipertimbangkan",
      "Kondisi industri dan seasonal pattern tidak termasuk dalam analisis",
    ],
    confidence_label: "Medium confidence",
    status: "active",
    created_at: new Date().toISOString(),
    llm_explanation:
      "Piutang usaha Anda saat ini rata-rata tertagih dalam 45 hari, lebih lama 50% dari rata-rata historis 30 hari. Hal ini dapat mengganggu arus kas operasional. Disarankan untuk melakukan review mendalam terhadap proses collection dan mempertimbangkan incentive untuk pembayaran lebih cepat.",
  },
  {
    id: "rec-2",
    rule_id: "margin_decline",
    rule_version: "1.0.0",
    title: "Evaluasi Struktur Biaya Operasional",
    priority: "medium",
    trigger_metrics: {
      net_margin_current: 52.8,
      net_margin_previous: 56.0,
      decline_pct: -3.2,
    },
    period: {
      from: "2026-10-01",
      to: "2026-10-31",
    },
    evidence: [
      "Net margin turun dari 56% ke 52.8%",
      "Penurunan 3.2 poin persentase",
      "Operating expenses meningkat 8% vs periode lalu",
    ],
    suggested_actions: [
      "Analisis breakdown operating expenses untuk identifikasi cost driver terbesar",
      "Review efisiensi proses operasional dan identifikasi area pemborosan",
      "Evaluasi pricing strategy produk/jasa untuk maintain margin",
      "Pertimbangkan renegotiasi kontrak dengan supplier untuk cost reduction",
    ],
    assumptions: [
      "Volume penjualan relatif stabil",
      "Tidak ada perubahan signifikan mix produk/jasa",
    ],
    limitations: [
      "Analisis belum mempertimbangkan seasonality",
      "Cost allocation antar kategori mungkin perlu refinement",
    ],
    confidence_label: "High confidence",
    status: "active",
    created_at: new Date().toISOString(),
    llm_explanation:
      "Margin laba bersih Anda mengalami penurunan 3.2 poin persentase. Meskipun masih di level yang sehat (52.8%), tren penurunan ini perlu diperhatikan. Peningkatan operating expenses menjadi faktor utama. Review mendalam terhadap struktur biaya dapat membantu mempertahankan profitabilitas.",
  },
  {
    id: "rec-3",
    rule_id: "cash_positive_maintain",
    rule_version: "1.0.0",
    title: "Pertahankan Momentum Arus Kas Positif",
    priority: "low",
    trigger_metrics: {
      net_cash_flow: 9500000,
      cash_flow_trend: "positive",
    },
    period: {
      from: "2026-10-01",
      to: "2026-10-31",
    },
    evidence: [
      "Net cash flow positif Rp 9.500.000",
      "3 bulan berturut-turut cash flow positif",
      "Cash runway 25 hari, masih di atas minimum",
    ],
    suggested_actions: [
      "Maintain disciplined cash management practices yang sudah berjalan",
      "Pertimbangkan alokasi surplus untuk emergency fund hingga 3 bulan operating expenses",
      "Evaluasi opportunity untuk reinvestasi dalam pertumbuhan bisnis",
    ],
    assumptions: [
      "Pola cash flow akan relatif stabil",
      "Tidak ada planned major capex dalam waktu dekat",
    ],
    limitations: [
      "Recommendation bersifat general guidance",
      "Specific investment opportunity belum dievaluasi",
    ],
    confidence_label: "High confidence",
    status: "active",
    created_at: new Date().toISOString(),
    llm_explanation:
      "Kondisi arus kas Anda saat ini sehat dengan net cash flow positif. Ini adalah pencapaian yang baik. Fokus saat ini adalah mempertahankan momentum ini dan membangun buffer untuk mengantisipasi volatilitas di masa depan.",
  },
];

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [filterPriority, setFilterPriority] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "reviewed"
  >("all");

  const handleMarkDone = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, status: "reviewed" as const } : rec,
      ),
    );
  };

  let filteredRecommendations = recommendations;

  if (filterPriority !== "all") {
    filteredRecommendations = filteredRecommendations.filter(
      (rec) => rec.priority === filterPriority,
    );
  }

  if (filterStatus !== "all") {
    filteredRecommendations = filteredRecommendations.filter(
      (rec) => rec.status === filterStatus,
    );
  }

  const highPriorityCount = recommendations.filter(
    (r) => r.priority === "high",
  ).length;
  const mediumPriorityCount = recommendations.filter(
    (r) => r.priority === "medium",
  ).length;
  const lowPriorityCount = recommendations.filter(
    (r) => r.priority === "low",
  ).length;
  const activeCount = recommendations.filter(
    (r) => r.status === "active",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1F241D]">
          Rekomendasi AI
        </h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Saran berbasis analisis data keuangan Anda
        </p>
      </div>

      <div className="bg-gradient-to-br from-[#273420] to-[#3B4A34] text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif font-semibold mb-2">
              {activeCount} Rekomendasi Aktif
            </h3>
            <p className="text-sm text-white/80 leading-relaxed">
              Rekomendasi ini dihasilkan berdasarkan analisis pola keuangan
              usaha Anda. Setiap rekomendasi dilengkapi dengan evidence,
              assumptions, dan limitations untuk transparansi penuh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              Prioritas Tinggi
            </p>
            <p className="text-2xl font-serif font-bold mt-1">
              {highPriorityCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              Prioritas Sedang
            </p>
            <p className="text-2xl font-serif font-bold mt-1">
              {mediumPriorityCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              Prioritas Rendah
            </p>
            <p className="text-2xl font-serif font-bold mt-1">
              {lowPriorityCount}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-[#666A61]">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filter:</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterPriority === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("all")}
          >
            Semua Prioritas
          </Button>
          <Button
            variant={filterPriority === "high" ? "danger" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("high")}
          >
            Tinggi ({highPriorityCount})
          </Button>
          <Button
            variant={filterPriority === "medium" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("medium")}
          >
            Sedang ({mediumPriorityCount})
          </Button>
          <Button
            variant={filterPriority === "low" ? "ghost" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("low")}
          >
            Rendah ({lowPriorityCount})
          </Button>
        </div>
        <div className="h-6 w-px bg-[#EBE5DC]"></div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Semua Status
          </Button>
          <Button
            variant={filterStatus === "active" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterStatus("active")}
          >
            Aktif ({activeCount})
          </Button>
          <Button
            variant={filterStatus === "reviewed" ? "ghost" : "ghost"}
            size="sm"
            onClick={() => setFilterStatus("reviewed")}
          >
            Selesai
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {filteredRecommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onMarkDone={handleMarkDone}
          />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-[#7E8379]" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-[#1F241D] mb-2">
              Tidak Ada Rekomendasi
            </h3>
            <p className="text-sm text-[#7E8379]">
              Tidak ada rekomendasi yang sesuai dengan filter yang dipilih.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
