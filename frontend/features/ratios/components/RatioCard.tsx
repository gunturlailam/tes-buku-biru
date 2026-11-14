"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { RatioExplainResponse, RatioItem } from "@/types/ratios";
import { Info, Sparkles } from "lucide-react";
import { bandConfig, formatRatioValue, formatThreshold } from "../ratio-format";

interface RatioCardProps {
  ratio: RatioItem;
  explanation?: RatioExplainResponse;
  isExplaining: boolean;
  onExplain: (code: string) => void;
}

export function RatioCard({
  ratio,
  explanation,
  isExplaining,
  onExplain,
}: RatioCardProps) {
  const band = bandConfig(ratio.band);
  const isUnavailable = ratio.status === "unavailable";
  const narrative = explanation ?? ratio.narrative;

  const accent =
    ratio.band === "above_target"
      ? "border-l-emerald-500"
      : ratio.band === "between_target_warning"
        ? "border-l-amber-500"
        : ratio.band === "between_warning_critical" ||
            ratio.band === "below_critical"
          ? "border-l-red-500"
          : "border-l-[#D8D2C8]";

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border border-[#EBE5DC]/70 border-l-4 bg-white p-5 shadow-[0_2px_16px_rgba(39,52,32,0.03)]",
        accent,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#1F241D]">{ratio.name}</h3>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[#9A9F94]">
            {ratio.code}
          </p>
        </div>
        <Badge variant={band.variant}>{band.label}</Badge>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p
          className={cn(
            "text-3xl font-bold tracking-tight",
            isUnavailable ? "text-[#A8ADA3]" : "text-[#1F241D]",
          )}
        >
          {isUnavailable ? "—" : formatRatioValue(ratio.value, ratio.unit)}
        </p>
        {ratio.threshold ? (
          <p className="text-right text-[11px] leading-tight text-[#7E8379]">
            Target{" "}
            {ratio.threshold.direction === "higher" ? "≥" : "≤"}{" "}
            <span className="font-semibold text-[#4C5348]">
              {formatThreshold(ratio.threshold.target, ratio.unit)}
            </span>
          </p>
        ) : (
          <p className="text-right text-[11px] leading-tight text-[#9A9F94]">
            Tanpa ambang default
          </p>
        )}
      </div>

      {isUnavailable ? (
        <div className="mt-4 rounded-xl bg-amber-50/70 p-3">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-900">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{ratio.reason ?? "Data belum cukup untuk menghitung rasio ini."}</span>
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-[#666A61]">
          {narrative.explanation}
        </p>
      )}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#9A9F94]">
            {narrative.source === "llm" ? "Narasi AI" : "Narasi rule-based"}
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                narrative.source === "llm" ? "bg-violet-500" : "bg-emerald-500",
              )}
            />
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onExplain(ratio.code)}
            disabled={isExplaining}
            className="text-[11px]"
          >
            <Sparkles className={cn("h-3.5 w-3.5", isExplaining && "animate-pulse")} />
            {isExplaining ? "Menyusun..." : "Jelaskan"}
          </Button>
        </div>
        {explanation?.privacy_note && (
          <p className="mt-2 text-[10px] leading-relaxed text-[#A0A59B]">
            {explanation.privacy_note}
          </p>
        )}
      </div>
    </article>
  );
}
