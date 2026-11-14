"use client";

import { useState, useMemo } from "react";
import { ProfitLossReport } from "@/features/reports/components/ProfitLossReport";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { useQuery } from "@tanstack/react-query";
import { financialAPI } from "@/lib/api";
import { getDateRangeForPeriod, type PeriodType } from "@/lib/date-utils";
import { FileText, TrendingUp } from "lucide-react";
import type { ProfitLossReport as ProfitLossReportType } from "@/types/financial";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("MTD");
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
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-premium p-8 text-center hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Laporan Arus Kas
            </h3>
            <p className="text-sm text-gray-600">
              Fitur ini sedang dalam pengembangan dan akan segera tersedia.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
