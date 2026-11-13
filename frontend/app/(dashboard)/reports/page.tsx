"use client";

import { useState } from "react";
import { ProfitLossReport } from "@/features/reports/components/ProfitLossReport";
import { Button } from "@/components/ui/Button";
import { FileText, TrendingUp } from "lucide-react";
import type { ProfitLossReport as ProfitLossReportType } from "@/types/financial";

const mockProfitLossData: ProfitLossReportType = {
  period: {
    from: "2026-10-01",
    to: "2026-10-31",
  },
  currency: "IDR",
  data_quality: {
    status: "partial",
    warnings: [
      "15 transaksi income/expense belum berkategori",
      "Cash basis dari transaksi tercatat; bukan laporan keuangan formal",
    ],
  },
  formula_version: "1.0.0",
  generated_at: new Date().toISOString(),
  items: {
    gross_sales: {
      value: "18500000.00",
      status: "available",
    },
    sales_returns: {
      value: "500000.00",
      status: "available",
    },
    sales_discounts: {
      value: null,
      status: "unavailable",
      reason: "Diskon tidak dicatat",
    },
    net_revenue: {
      value: "18000000.00",
      status: "available",
    },
    cogs: {
      value: null,
      status: "unavailable",
      reason: "COGS belum diklasifikasikan",
    },
    gross_profit: {
      value: null,
      status: "unavailable",
      reason: "COGS belum diklasifikasikan",
    },
    operating_expenses: {
      value: "8500000.00",
      status: "available",
    },
    operating_profit: {
      value: null,
      status: "unavailable",
      reason: "Perlu klasifikasi beban & COGS lengkap",
    },
    other_income: {
      value: null,
      status: "unavailable",
    },
    finance_cost: {
      value: null,
      status: "unavailable",
    },
    tax_expense: {
      value: null,
      status: "unavailable",
    },
    net_profit: {
      value: "9500000.00",
      status: "available",
    },
  },
  ratios: {
    gross_margin: {
      value: null,
      status: "unavailable",
      reason: "COGS belum diklasifikasikan",
    },
    operating_margin: {
      value: null,
      status: "unavailable",
      reason: "Perlu klasifikasi beban & COGS lengkap",
    },
    net_margin: {
      value: 52.8,
      status: "available",
    },
  },
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"profit-loss" | "cash-flow">(
    "profit-loss",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#1F241D]">
          Laporan Keuangan
        </h1>
        <p className="text-sm text-[#7E8379] mt-1">
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

      {activeTab === "profit-loss" && (
        <ProfitLossReport data={mockProfitLossData} />
      )}

      {activeTab === "cash-flow" && (
        <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-[#7E8379]" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-[#1F241D] mb-2">
              Laporan Arus Kas
            </h3>
            <p className="text-sm text-[#7E8379]">
              Fitur ini sedang dalam pengembangan dan akan segera tersedia.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
