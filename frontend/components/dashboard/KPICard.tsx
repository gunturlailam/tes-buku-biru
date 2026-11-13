"use client";

import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { MetricValue, Period, Currency } from "@/types/financial";

interface KPICardProps {
  title: string;
  value: MetricValue<string>;
  currency?: Currency;
  icon: React.ReactNode;
  iconBg: string;
  trend?: {
    value: number;
    label: string;
  };
  sparklineColor: string;
  sparklineGradient: string;
}

export function KPICard({
  title,
  value,
  currency = "IDR",
  icon,
  iconBg,
  trend,
  sparklineColor,
  sparklineGradient,
}: KPICardProps) {
  const displayValue =
    value.status === "available" && value.value !== null
      ? formatCurrency(value.value, currency)
      : "Data Tidak Tersedia";

  const isPositiveTrend = trend && trend.value > 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", iconBg)}>
          {icon}
        </div>
        <div className="flex-1 ml-3.5">
          <p className="text-xs text-[#7E8379] font-medium">{title}</p>
          <h3 className="text-2xl font-serif font-bold text-[#1F241D] tracking-tight mt-0.5">
            {value.status === "unavailable" ? (
              <span className="text-base text-[#7E8379]">
                {value.reason || "Data Tidak Tersedia"}
              </span>
            ) : (
              displayValue
            )}
          </h3>
          {trend && value.status === "available" && (
            <p className="text-[11px] text-[#7E8379] mt-1 flex items-center gap-1">
              <span
                className={cn(
                  "font-medium flex items-center gap-0.5",
                  isPositiveTrend ? "text-emerald-700" : "text-red-700"
                )}
              >
                {isPositiveTrend ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trend.value > 0 ? "+" : ""}
                {trend.value.toFixed(1)}%
              </span>
              <span>{trend.label}</span>
            </p>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {value.status === "available" && (
        <div className="mt-2 h-10 w-full overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 45">
            <defs>
              <linearGradient id={sparklineGradient} x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.18" />
                <stop offset="100%" stopColor={sparklineColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M0,35 Q30,34 55,28 T110,24 T150,15 T200,8 L200,45 L0,45 Z"
              fill={`url(#${sparklineGradient})`}
            />
            <path
              d="M0,35 Q30,34 55,28 T110,24 T150,15 T200,8"
              fill="none"
              stroke={sparklineColor}
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
