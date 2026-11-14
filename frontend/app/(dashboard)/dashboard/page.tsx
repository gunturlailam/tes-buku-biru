"use client";

import { useState, useMemo } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import { RiskLevelBadge } from "@/components/shared/RiskLevelBadge";
import { useFinancialSummary } from "@/hooks/use-financial-summary";
import { useFinancialHealth } from "@/features/insights/hooks/use-financial-health";
import { useTransactions } from "@/hooks/use-transactions";
import { getDateRangeForPeriod, type PeriodType } from "@/lib/date-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  AlertCircle,
  Sparkles,
  Target,
  ArrowRight,
  BarChart3,
  Brain,
  Zap,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface RecentTransaction {
  id: number;
  transaction_date?: string;
  date?: string;
  description: string;
  amount: string | number;
  tx_type: string;
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("MTD");

  const dateRange = useMemo(() => getDateRangeForPeriod(selectedPeriod), [selectedPeriod]);

  const { data, isLoading, error } = useFinancialSummary(dateRange);
  const { data: health } = useFinancialHealth(dateRange);
  const { data: recentTransactions = [] } = useTransactions({
    limit: 3,
    from_date: dateRange.from,
    to_date: dateRange.to,
  });

  const recent = recentTransactions as RecentTransaction[];
  const signals = health?.signals ?? [];
  const criticalCount = signals.filter((s) => s.level === "critical").length;
  const attentionCount = signals.filter((s) => s.level === "attention").length;
  const healthLevel =
    criticalCount > 0
      ? "critical"
      : attentionCount > 0
        ? "attention"
        : signals.length > 0
          ? "normal"
          : "insufficient";
  const healthLabel =
    healthLevel === "critical"
      ? "Kritis"
      : healthLevel === "attention"
        ? "Perlu Perhatian"
        : healthLevel === "normal"
          ? "Sehat"
          : "Data Minim";
  const healthDescription =
    signals.length === 0
      ? "Belum ada sinyal risiko pada periode ini."
      : `${signals.length} sinyal terdeteksi (${criticalCount} kritis, ${attentionCount} perhatian).`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Memuat data finansial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="error">
          Gagal memuat data finansial. Pastikan backend berjalan dan coba refresh halaman.
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 p-6">
        <Alert variant="warning">
          Tidak ada data finansial untuk periode ini.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#fafaf9]">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-[#ffc900] rounded-full"></div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#999999]">
          Performa Bisnis
        </span>
      </div>

      {/* Financial Overview Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1f1f1f] mb-2">
            Financial Overview
          </h2>
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Clock className="w-4 h-4" />
            <span>
              {data.period.from} - {data.period.to}
            </span>
          </div>
        </div>

        {/* Period Selector & Data Quality */}
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-white border border-[#e5e5e5] rounded-lg p-1 shadow-sm">
            {(["MTD", "QTD", "YTD"] as PeriodType[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-2 text-xs font-bold rounded transition-all ${
                  selectedPeriod === period
                    ? "bg-[#ffc900] text-[#1f1f1f] shadow-sm"
                    : "text-[#666666] hover:text-[#1f1f1f]"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold rounded-lg border border-[#c8e6c9]">
            <span className="w-2 h-2 bg-[#2e7d32] rounded-full"></span>
            Data Depot Dieperbarui
          </span>
        </div>
      </div>

      {/* Data Quality Warning */}
      {data.data_quality.warnings && data.data_quality.warnings.length > 0 && (
        <div className="bg-[#fff9e6] border-l-4 border-[#ffc900] rounded-lg p-4 shadow-sm flex gap-3">
          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-[#f39c12]" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#8b6914] mb-1">
              Perhatian Kualitas Data
            </h4>
            <ul className="text-sm text-[#8b6914] space-y-1">
              {data.data_quality.warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#ffc900] mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KPICard
          title="Pendapatan Bersih"
          value={data.metrics.net_revenue}
          currency={data.currency}
          icon={<DollarSign className="w-5 h-5 text-white" strokeWidth={2.5} />}
          iconBg="bg-[#ffc900]"
          sparklineColor="#ffc900"
          sparklineGradient="yellowGrad"
        />

        <KPICard
          title="Laba Bersih"
          value={
            data.metrics.simple_surplus ??
            data.metrics.net_profit
          }
          currency={data.currency}
          icon={<TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />}
          iconBg="bg-[#1f1f1f]"
          sparklineColor="#1f1f1f"
          sparklineGradient="darkGrad"
        />

        <KPICard
          title="Arus Kas Bersih"
          value={data.metrics.net_cash_flow}
          currency={data.currency}
          icon={<Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />}
          iconBg="bg-[#333333]"
          sparklineColor="#333333"
          sparklineGradient="grayGrad"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Intelligence Panel */}
        <section className="lg:col-span-8 bg-[#1a1a1a] text-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffc900]/10 rounded-full blur-3xl -z-0"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ffc900]/20 border border-[#ffc900]/40 mb-4">
              <Brain className="w-3.5 h-3.5 text-[#ffc900]" />
              <span className="text-xs font-bold text-[#ffc900] uppercase tracking-wide">
                ProfitAI Intelligence
              </span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-3">
              Analisis Keuangan Cerdas
            </h2>
            <p className="text-sm text-[#cccccc] mb-6">
              Insight berbasis AI untuk optimalisasi performa bisnis Anda.
            </p>

            {/* AI Insights */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#ffc900]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-[#ffc900]" />
                </div>
                <div>
                  <p className="text-sm text-[#e0e0e0] leading-relaxed">
                    Pengeluaran tahunan <span className="font-bold">+23,5%</span> dibanding bulan lalu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#ffc900]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-[#ffc900]" />
                </div>
                <div>
                  <p className="text-sm text-[#e0e0e0] leading-relaxed">
                    Margin laba untuk dikurangi karena & COGS nasar tangkah.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#ffc900]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-[#ffc900]" />
                </div>
                <div>
                  <p className="text-sm text-[#e0e0e0] leading-relaxed">
                    Aset dalam konteks sehat dan managerial <span className="font-bold">+8,6%</span>.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/insights"
              className="inline-flex items-center gap-2 bg-[#ffc900] text-[#1f1f1f] px-5 py-3 rounded-lg font-bold text-sm hover:bg-[#f0bd00] transition-all shadow-lg"
            >
              <span>Lihat Analisis Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Financial Health Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Health Score */}
          <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[#1f1f1f]">Kesehatan Finansial</h3>
              <Link href="/insights" className="text-xs font-bold text-[#ffc900] hover:text-[#f0bd00]">
                Detail →
              </Link>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-24 h-24 flex-shrink-0 rounded-full border-4 flex items-center justify-center text-center font-bold text-2xl ${
                healthLevel === "critical"
                  ? "border-red-300 bg-red-50 text-red-600"
                  : healthLevel === "attention"
                    ? "border-amber-300 bg-amber-50 text-amber-600"
                    : healthLevel === "normal"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : "border-gray-300 bg-gray-50 text-gray-600"
              }`}>
                {healthLevel === "normal" ? "85%" : healthLabel}
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1f1f1f] mb-1">
                  {healthLevel === "normal" ? "Sangat Baik" : healthLabel}
                </h4>
                <p className="text-xs text-[#666666]">{healthDescription}</p>
              </div>
            </div>

            {/* Indicators */}
            <div className="space-y-3">
              {[
                { label: "Likuiditas", status: "Baik" },
                { label: "Profitabilitas", status: "Baik" },
                { label: "Aras Kas", status: "Sangat Baik" },
                { label: "Efisiensi Operasional", status: "Baik" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-xs text-[#666666]">{item.label}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2e7d32]">
                    <span className="w-2 h-2 bg-[#2e7d32] rounded-full"></span>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Section: Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#1f1f1f]">Aktivitas Terkini</h3>
            <p className="text-xs text-[#999999]">Transaksi dan perubahan terbaru</p>
          </div>
          <Link href="/transactions" className="inline-flex items-center gap-2 text-sm font-bold text-[#ffc900] hover:text-[#f0bd00]">
            <span>Lihat Semua</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {recent.length > 0 ? (
            recent.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-[#f5f5f5] hover:bg-[#eeeeee] rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      transaction.tx_type === "income"
                        ? "bg-[#e8f5e9] text-[#2e7d32]"
                        : "bg-[#ffebee] text-[#c62828]"
                    }`}
                  >
                    {transaction.tx_type === "income" ? "+" : "-"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f1f1f]">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-[#999999]">
                      {formatDate(
                        transaction.transaction_date || transaction.date || "",
                      )}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  transaction.tx_type === "income"
                    ? "text-[#2e7d32]"
                    : "text-[#c62828]"
                }`}>
                  {formatCurrency(transaction.amount, data.currency)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#999999]">
              Belum ada transaksi pada periode ini.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
