"use client";

import { useState, useMemo } from "react";
import { ProfitLossReport } from "@/features/reports/components/ProfitLossReport";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { useQuery } from "@tanstack/react-query";
import { financialAPI } from "@/lib/api";
import { getDateRangeForPeriod, type PeriodType } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/utils";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import type { MetricValue } from "@/types/financial";
import { FileText, TrendingUp } from "lucide-react";


export default function ReportsPage() {
  const [selectedPeriod] = useState<PeriodType>("MTD");
  const [activeTab, setActiveTab] = useState<"profit-loss" | "cash-flow">(
    "profit-loss",
  );

  // Get date range based on selected period
  const dateRange = useMemo(() => getDateRangeForPeriod(selectedPeriod), [selectedPeriod]);

  // Fetch profit & loss report from API
  const { data: profitLossData, isLoading, error } = useQuery({
    queryKey: ["profit-loss", dateRange],
    queryFn: () => financialAPI.getProfitLoss(dateRange),
    enabled: activeTab === "profit-loss",
  });

  const {
    data: cashFlowData,
    isLoading: isCashFlowLoading,
    error: cashFlowError,
  } = useQuery({
    queryKey: ["cash-flow", dateRange],
    queryFn: () => financialAPI.getCashFlow(dateRange),
    enabled: activeTab === "cash-flow",
  });

  const renderMetric = (
    label: string,
    metric: MetricValue | undefined,
    currency: string,
  ) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#EBE5DC]/60 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {metric?.status === "available" && metric.value !== null
          ? formatCurrency(metric.value, currency)
          : metric?.reason || "Tidak tersedia"}
      </span>
    </div>
  );

  // Loading state
  if (isLoading && activeTab === "profit-loss") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Memuat laporan keuangan...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && activeTab === "profit-loss") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan Keuangan
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Analisis keuangan usaha berdasarkan transaksi tercatat
          </p>
        </div>
        <Alert variant="error">
          Gagal memuat laporan keuangan. Pastikan backend berjalan dan coba refresh halaman.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Laporan Keuangan
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Analisis keuangan usaha berdasarkan transaksi tercatat
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant={activeTab === "profit-loss" ? "primary" : "secondary"}
          size="md"
          onClick={() => setActiveTab("profit-loss")}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Laba Rugi</span>
        </Button>
        <Button
          variant={activeTab === "cash-flow" ? "primary" : "secondary"}
          size="md"
          onClick={() => setActiveTab("cash-flow")}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Arus Kas</span>
        </Button>
      </div>

      {activeTab === "profit-loss" && profitLossData && (
        <ProfitLossReport data={profitLossData} />
      )}

      {activeTab === "profit-loss" && !profitLossData && !isLoading && (
        <Alert variant="warning">
          Tidak ada data laporan laba rugi untuk periode ini.
        </Alert>
      )}

      {activeTab === "cash-flow" && (
        <>
          {isCashFlowLoading && (
            <div className="flex items-center justify-center min-h-[240px]">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {cashFlowError && (
            <Alert variant="error">
              Gagal memuat laporan arus kas. Pastikan backend berjalan dan coba
              refresh halaman.
            </Alert>
          )}

          {cashFlowData && !isCashFlowLoading && !cashFlowError && (
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-premium p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Laporan Arus Kas
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {cashFlowData.period.from} – {cashFlowData.period.to}
                  </p>
                </div>
                <DataQualityBadge status={cashFlowData.data_quality.status} />
              </div>

              <div>
                {renderMetric("Kas Masuk", cashFlowData.items.cash_in, cashFlowData.currency)}
                {renderMetric("Kas Keluar", cashFlowData.items.cash_out, cashFlowData.currency)}
                {renderMetric(
                  "Arus Kas Bersih",
                  cashFlowData.items.net_cash_flow,
                  cashFlowData.currency,
                )}
                {renderMetric(
                  "Saldo Kas Awal",
                  cashFlowData.items.opening_cash,
                  cashFlowData.currency,
                )}
                {renderMetric(
                  "Saldo Kas Akhir",
                  cashFlowData.items.closing_cash,
                  cashFlowData.currency,
                )}
              </div>

              {cashFlowData.note && (
                <p className="text-xs text-gray-500">{cashFlowData.note}</p>
              )}

              {cashFlowData.data_quality.warnings &&
                cashFlowData.data_quality.warnings.length > 0 && (
                  <ul className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                    {cashFlowData.data_quality.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
