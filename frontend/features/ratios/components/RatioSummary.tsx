import { Activity, AlertTriangle, CheckCircle2, Gauge } from "lucide-react";
import type { RatioItem } from "@/types/ratios";

interface RatioSummaryProps {
  ratios: RatioItem[];
}

export function RatioSummary({ ratios }: RatioSummaryProps) {
  const available = ratios.filter((ratio) => ratio.status === "available").length;
  const above = ratios.filter((ratio) => ratio.band === "above_target").length;
  const attention = ratios.filter(
    (ratio) =>
      ratio.band === "between_target_warning" ||
      ratio.band === "between_warning_critical",
  ).length;
  const unavailable = ratios.filter(
    (ratio) => ratio.band === "insufficient" || ratio.status === "unavailable",
  ).length;

  const cards = [
    {
      label: "Rasio tersedia",
      value: `${available}/${ratios.length}`,
      hint: "Dihitung dari data periode",
      icon: Gauge,
      tone: "bg-[#273420] text-white",
    },
    {
      label: "Memenuhi target",
      value: String(above),
      hint: "Band di atas target",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Perlu perhatian",
      value: String(attention),
      hint: "Pantau tren dan tindakan",
      icon: AlertTriangle,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Belum tersedia",
      value: String(unavailable),
      hint: "Data atau klasifikasi kurang",
      icon: Activity,
      tone: "bg-[#FAF7F2] text-[#7E8379]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-2xl border border-[#EBE5DC]/70 bg-white p-4 shadow-[0_2px_16px_rgba(39,52,32,0.03)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9A9F94]">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-[#1F241D]">
                  {card.value}
                </p>
              </div>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-[#9A9F94]">
              {card.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
}
