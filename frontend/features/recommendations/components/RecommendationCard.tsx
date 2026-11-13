"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Recommendation } from "@/types/financial";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RecommendationCardProps {
  recommendation: Recommendation;
  onMarkDone?: (id: string) => void;
}

const priorityColorMap = {
  low: "bg-blue-100 text-blue-800 border-blue-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-red-100 text-red-800 border-red-300",
};

const priorityLabelMap = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

export function RecommendationCard({ recommendation, onMarkDone }: RecommendationCardProps) {
  const { id, title, priority, evidence, suggested_actions, assumptions, limitations, status, llm_explanation } = recommendation;

  return (
    <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-11 h-11 bg-[#F6EFEA] rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-[#C98A82]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-serif font-semibold text-[#1F241D] leading-snug">
              {title}
            </h3>
            <p className="text-xs text-[#7E8379] mt-1">
              Periode: {recommendation.period.from} - {recommendation.period.to}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${priorityColorMap[priority]}`}
        >
          {priorityLabelMap[priority]}
        </span>
      </div>

      {llm_explanation && (
        <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EBE5DC]/50">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 bg-[#273420] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <p className="text-sm text-[#1F241D] leading-relaxed flex-1">
              {llm_explanation}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-[#7E8379] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Evidence / Bukti</span>
          </h4>
          <ul className="space-y-1.5">
            {evidence.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[#1F241D]">
                <span className="text-[#8FA382] mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-[#7E8379] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tindakan yang Disarankan</span>
          </h4>
          <ol className="space-y-2">
            {suggested_actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-[#1F241D]">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#273420] text-white text-xs font-semibold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </div>

        {(assumptions.length > 0 || limitations.length > 0) && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
            {assumptions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Asumsi</span>
                </h4>
                <ul className="space-y-1">
                  {assumptions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-yellow-800">
                      <span className="mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {limitations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Keterbatasan</span>
                </h4>
                <ul className="space-y-1">
                  {limitations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-yellow-800">
                      <span className="mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {status === "active" && onMarkDone && (
        <div className="flex gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMarkDone(id)}
            className="flex-1"
          >
            Tandai Selesai
          </Button>
          <Button variant="ghost" size="sm">
            Lihat Detail
          </Button>
        </div>
      )}

      {status === "reviewed" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 pt-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-medium">Sudah ditinjau</span>
        </div>
      )}
    </div>
  );
}
