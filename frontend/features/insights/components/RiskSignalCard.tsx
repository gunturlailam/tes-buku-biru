"use client";

import { Card } from "@/components/ui/Card";
import { RiskLevelBadge } from "@/components/shared/RiskLevelBadge";
import type { RiskSignal } from "@/types/financial";
import { AlertCircle, AlertTriangle, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";

interface RiskSignalCardProps {
  signal: RiskSignal;
}

const iconMap = {
  normal: CheckCircle,
  attention: AlertCircle,
  critical: AlertTriangle,
  insufficient: AlertCircle,
};

const iconColorMap = {
  normal: "text-emerald-600",
  attention: "text-yellow-600",
  critical: "text-red-600",
  insufficient: "text-gray-500",
};

const bgColorMap = {
  normal: "bg-emerald-50",
  attention: "bg-yellow-50",
  critical: "bg-red-50",
  insufficient: "bg-gray-50",
};

const borderColorMap = {
  normal: "border-emerald-200",
  attention: "border-yellow-200",
  critical: "border-red-200",
  insufficient: "border-gray-200",
};

export function RiskSignalCard({ signal }: RiskSignalCardProps) {
  const Icon = iconMap[signal.level];

  return (
    <div
      className={`rounded-2xl border ${borderColorMap[signal.level]} ${bgColorMap[signal.level]} p-5 transition-all hover:shadow-md hover:border-opacity-80`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${iconColorMap[signal.level]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {signal.title}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {signal.period.from} - {signal.period.to}
            </p>
          </div>
        </div>
        <RiskLevelBadge level={signal.level} showIcon={false} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
          <span className="text-sm text-gray-600">Metrik Pemicu</span>
          <span className="text-sm font-medium text-gray-900">
            {signal.trigger_metric}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
          <span className="text-sm text-gray-600">Nilai Saat Ini</span>
          <span className="text-sm font-semibold text-gray-900">
            {typeof signal.current_value === "number"
              ? signal.current_value.toLocaleString("id-ID")
              : signal.current_value || "-"}
          </span>
        </div>

        {signal.threshold && (
          <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
            <span className="text-sm text-gray-600">Ambang Batas</span>
            <span className="text-sm font-medium text-gray-700">
              {typeof signal.threshold === "number"
                ? signal.threshold.toLocaleString("id-ID")
                : signal.threshold}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-white rounded-xl shadow-sm">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Penjelasan
        </h4>
        <p className="text-sm text-gray-900 leading-relaxed">
          {signal.explanation}
        </p>
      </div>

      {signal.recommendation && (
        <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200/60 shadow-sm">
          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rekomendasi</span>
          </h4>
          <p className="text-sm text-gray-900 leading-relaxed">
            {signal.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
