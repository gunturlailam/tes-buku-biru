"use client";

import { useState, useMemo } from "react";
import { RiskSignalCard } from "@/features/insights/components/RiskSignalCard";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { useFinancialHealth } from "@/features/insights/hooks/use-financial-health";
import { getDateRangeForPeriod, type PeriodType } from "@/lib/date-utils";
import type { FinancialHealth } from "@/types/financial";
import { Filter } from "lucide-react";

export default function InsightsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("MTD");
  const [filterLevel, setFilterLevel] = useState<
    "all" | "normal" | "attention" | "critical"
  >("all");

  // Get date range based on selected period
  const dateRange = useMemo(() => getDateRangeForPeriod(selectedPeriod), [selectedPeriod]);

  // Fetch financial health from API
  const { data: healthData, isLoading, error } = useFinancialHealth(dateRange);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Memuat data kesehatan finansial...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          Gagal memuat data insights. Pastikan backend berjalan dan coba refresh halaman.
        </Alert>
      </div>
    );
  }

  // No data state
  if (!healthData) {
    return (
      <div className="space-y-6">
        <Alert variant="warning">
          Tidak ada data insights untuk periode ini.
        </Alert>
      </div>
    );
  }

  const filteredSignals =
    filterLevel === "all"
      ? healthData.signals
      : healthData.signals.filter((s) => s.level === filterLevel);

  const criticalCount = healthData.signals.filter(
    (s) => s.level === "critical",
  ).length;
  const attentionCount = healthData.signals.filter(
    (s) => s.level === "attention",
  ).length;
  const normalCount = healthData.signals.filter(
    (s) => s.level === "normal",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Insight Kesehatan Keuangan
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Analisis risiko dan indikator kesehatan finansial usaha Anda
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-premium p-5 hover:border-emerald-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Ringkasan Status
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Periode: {healthData.period.from} - {healthData.period.to}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-900">Kritis</span>
              <span className="financial-number text-2xl font-bold text-red-600">
                {criticalCount}
              </span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              Memerlukan tindakan segera
            </p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-900">
                Perhatian
              </span>
              <span className="financial-number text-2xl font-bold text-yellow-600">
                {attentionCount}
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">Perlu monitoring</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-900">
                Normal
              </span>
              <span className="financial-number text-2xl font-bold text-emerald-600">
                {normalCount}
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">Kondisi sehat</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filter:</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterLevel === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterLevel("all")}
          >
            Semua ({healthData.signals.length})
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
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-premium p-8 text-center hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak Ada Sinyal
            </h3>
            <p className="text-sm text-gray-600">
              Tidak ada sinyal dengan level {filterLevel} pada periode ini.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
