"use client";

import { useState, useMemo } from "react";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import { RiskLevelBadge } from "@/components/shared/RiskLevelBadge";
import { useFinancialSummary } from "@/hooks/use-financial-summary";
import { getDateRangeForPeriod, type PeriodType } from "@/lib/date-utils";
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
  ShieldCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("MTD");

  // Get date range based on selected period
  const dateRange = useMemo(() => getDateRangeForPeriod(selectedPeriod), [selectedPeriod]);

  // Fetch financial summary from API
  const { data, isLoading, error } = useFinancialSummary(dateRange);

  // Loading state
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

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          Gagal memuat data finansial. Pastikan backend berjalan dan coba refresh halaman.
        </Alert>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="space-y-6">
        <Alert variant="warning">
          Tidak ada data finansial untuk periode ini.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Financial Overview
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>
              {data.period.from} - {data.period.to}
            </span>
          </div>
        </div>

        {/* Period Selector & Data Quality */}
        <div className="flex items-center gap-3">
          <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {(["MTD", "QTD", "YTD"] as PeriodType[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedPeriod === period
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          <DataQualityBadge status={data.data_quality.status} />
        </div>
      </div>

      {/* Data Quality Warning */}
      {data.data_quality.warnings && data.data_quality.warnings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 mb-1">
                Peringatan Kualitas Data
              </h4>
              <ul className="text-sm text-amber-800 space-y-1">
                {data.data_quality.warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KPICard
          title="Pendapatan Bersih"
          value={data.metrics.net_revenue}
          currency={data.currency}
          icon={<DollarSign className="w-5 h-5 text-white" strokeWidth={2.5} />}
          iconBg="bg-gradient-to-br from-emerald-600 to-emerald-700"
          trend={{ value: 12.5, label: "vs bulan lalu" }}
          sparklineColor="#10b981"
          sparklineGradient="emeraldGrad"
        />

        <KPICard
          title="Laba Bersih"
          value={data.metrics.net_profit}
          currency={data.currency}
          icon={<TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />}
          iconBg="bg-gradient-to-br from-blue-600 to-blue-700"
          trend={{ value: 8.3, label: "vs bulan lalu" }}
          sparklineColor="#3b82f6"
          sparklineGradient="blueGrad"
        />

        <KPICard
          title="Arus Kas Bersih"
          value={data.metrics.net_cash_flow}
          currency={data.currency}
          icon={<Wallet className="w-5 h-5 text-white" strokeWidth={2.5} />}
          iconBg="bg-gradient-to-br from-violet-600 to-violet-700"
          trend={{ value: 9.6, label: "vs bulan lalu" }}
          sparklineColor="#8b5cf6"
          sparklineGradient="violetGrad"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* AI Intelligence Panel - Featured */}
        <section className="lg:col-span-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-2xl hover-lift">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-blue-600/10" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3">
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    ProfitAI Intelligence
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Analisis Keuangan Cerdas
                </h2>
                <p className="text-sm text-gray-300">
                  Insight berbasis AI untuk optimasi performa bisnis Anda
                </p>
              </div>
            </div>

            {/* AI Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Insight Card 1 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      Peningkatan Arus Kas
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Arus kas meningkat 9.6%. Pertahankan momentum dengan mengelola piutang.
                    </p>
                  </div>
                </div>
              </div>

              {/* Insight Card 2 */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      Margin Profit Optimal
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Margin laba 28% di atas rata-rata industri. Fokus pada efisiensi operasional.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl group"
            >
              <span>Lihat Semua Insight</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Quick Actions & Health */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Financial Health Score */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-premium hover:shadow-premium-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Kesehatan Finansial</h3>
              <Link
                href="/insights"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Detail →
              </Link>
            </div>

            {/* Health Score Circle */}
            <div className="flex items-center gap-4 mb-5">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="text-emerald-500"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray="85, 100"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">85%</span>
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 mb-1">Sangat Baik</h4>
                <p className="text-xs text-gray-500">
                  Semua indikator dalam kondisi sehat
                </p>
              </div>
            </div>

            {/* Health Indicators */}
            <div className="space-y-2">
              {[
                { label: "Arus Kas", status: "normal", color: "emerald" },
                { label: "Margin Laba", status: "attention", color: "amber" },
                { label: "Pendapatan", status: "normal", color: "emerald" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.color === "emerald" ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                  </div>
                  <RiskLevelBadge level={item.status as any} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2.5">
            <Link
              href="/transactions/new"
              className="group flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200/60 hover:border-emerald-200 rounded-xl p-3.5 transition-all shadow-premium-sm hover:shadow-premium"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">Tambah Transaksi</h4>
                <p className="text-xs text-gray-500">Catat transaksi baru</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/reports"
              className="group flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200/60 hover:border-blue-200 rounded-xl p-3.5 transition-all shadow-premium-sm hover:shadow-premium"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" strokeWidth="2.5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">Lihat Laporan</h4>
                <p className="text-xs text-gray-500">Laba rugi & arus kas</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/recommendations"
              className="group flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200/60 hover:border-violet-200 rounded-xl p-3.5 transition-all shadow-premium-sm hover:shadow-premium"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" strokeWidth="2.5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">Rekomendasi AI</h4>
                <p className="text-xs text-gray-500">Saran optimasi bisnis</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </aside>
      </div>

      {/* Bottom Section: Recent Activity */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-premium">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Aktivitas Terkini</h3>
            <p className="text-xs text-gray-500">Transaksi dan perubahan terbaru</p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Activity Items */}
        <div className="space-y-3">
          {[
            { type: "income", label: "Penjualan Produk", amount: "+Rp 5,250,000", time: "2 jam lalu" },
            { type: "expense", label: "Pembelian Bahan Baku", amount: "-Rp 2,100,000", time: "5 jam lalu" },
            { type: "income", label: "Transfer Bank", amount: "+Rp 8,500,000", time: "1 hari lalu" },
          ].map((activity, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.type === "income"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {activity.type === "income" ? (
                    <TrendingUp className="w-4.5 h-4.5" strokeWidth="2.5" />
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{activity.label}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
              <span
                className={`text-sm font-bold financial-number ${
                  activity.type === "income" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {activity.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
