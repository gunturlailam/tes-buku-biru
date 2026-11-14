"use client";

import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { MetricValue, Currency } from "@/types/financial";

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
  const isNeutralTrend = trend && trend.value === 0;

  return (
    <div className="group bg-white rounded-2xl p-6 border border-gray-200/60 hover:border-emerald-200 hover:shadow-premium transition-all duration-300 relative overflow-hidden">
      {/* Subtle Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-emerald-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 financial-number tracking-tight">
              {value.status === "unavailable" ? (
                <span className="text-base text-gray-400 font-normal">
                  {value.reason || "Data Tidak Tersedia"}
                </span>
              ) : (
                displayValue
              )}
            </h3>
          </div>

          {/* Icon */}
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300",
              iconBg
            )}
          >
            {icon}
          </div>
        </div>

        {/* Trend Indicator */}
        {trend && value.status === "available" && (
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold",
                isNeutralTrend
                  ? "bg-gray-100 text-gray-700"
                  : isPositiveTrend
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              )}
            >
              {isNeutralTrend ? (
                <Minus className="w-3 h-3" />
              ) : isPositiveTrend ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="financial-number">
                {trend.value > 0 ? "+" : ""}
                {trend.value.toFixed(1)}%
              </span>
            </span>
            <span className="text-xs text-gray-500">{trend.label}</span>
          </div>
        )}

        {/* Enhanced Sparkline */}
        {value.status === "available" && (
          <div className="mt-3 h-12 w-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-transparent">
            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 200 48"
            >
              <defs>
                <linearGradient
                  id={`${sparklineGradient}-fill`}
                  x1="0%"
                  x2="0%"
                  y1="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* Area Fill */}
              <path
                d="M0,36 Q30,34 55,28 T110,24 T150,16 T200,10 L200,48 L0,48 Z"
                fill={`url(#${sparklineGradient}-fill)`}
              />
              
              {/* Line with Glow */}
              <path
                d="M0,36 Q30,34 55,28 T110,24 T150,16 T200,10"
                fill="none"
                stroke={sparklineColor}
                strokeLinecap="round"
                strokeWidth="2.5"
                filter="url(#glow)"
                className="group-hover:stroke-[3] transition-all"
              />
              
              {/* Current Value Dot */}
              <circle
                cx="200"
                cy="10"
                r="4"
                fill={sparklineColor}
                className="group-hover:r-[5] transition-all"
              >
                <animate
                  attributeName="opacity"
                  values="1;0.5;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
