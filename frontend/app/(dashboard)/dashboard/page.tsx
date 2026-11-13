"use client";

import { KPICard } from "@/components/dashboard/KPICard";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import { RiskLevelBadge } from "@/components/shared/RiskLevelBadge";
import { DollarSign, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

// Mock data - akan diganti dengan API call
const mockData = {
  period: {
    from: "2026-01-01",
    to: "2026-01-31",
  },
  currency: "IDR" as const,
  data_quality: {
    status: "usable" as const,
    warnings: ["Data pembukaan saldo belum lengkap"],
  },
  formula_version: "1.0.0",
  generated_at: new Date().toISOString(),
  metrics: {
    net_revenue: {
      value: "125000000",
      status: "available" as const,
    },
    net_profit: {
      value: "35000000",
      status: "available" as const,
    },
    net_cash_flow: {
      value: "42000000",
      status: "available" as const,
    },
    gross_margin: {
      value: 35.5,
      status: "available" as const,
    },
  },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Period & Data Quality */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#7E8379]">
            Periode: {mockData.period.from} - {mockData.period.to}
          </p>
        </div>
        <DataQualityBadge status={mockData.data_quality.status} />
      </div>

      {/* Warning Banner */}
      {mockData.data_quality.warnings && mockData.data_quality.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">
                Perhatian: Kualitas Data
              </h4>
              <ul className="mt-1 text-xs text-yellow-700 space-y-0.5">
                {mockData.data_quality.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <KPICard
          title="Pendapatan Bersih"
          value={mockData.metrics.net_revenue}
          currency={mockData.currency}
          icon={
            <DollarSign className="w-4 h-4 text-emerald-100" strokeWidth={1.8} />
          }
          iconBg="bg-[#273420] text-white"
          trend={{ value: 12.5, label: "vs bulan lalu" }}
          sparklineColor="#5E7351"
          sparklineGradient="oliveGrad"
        />

        <KPICard
          title="Laba Bersih"
          value={mockData.metrics.net_profit}
          currency={mockData.currency}
          icon={
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={1.8} />
          }
          iconBg="bg-[#EFAAA4] text-white"
          trend={{ value: 8.3, label: "vs bulan lalu" }}
          sparklineColor="#EFAAA4"
          sparklineGradient="blushGrad"
        />

        <KPICard
          title="Arus Kas Bersih"
          value={mockData.metrics.net_cash_flow}
          currency={mockData.currency}
          icon={
            <Wallet className="w-4 h-4 text-white" strokeWidth={1.8} />
          }
          iconBg="bg-[#3B4A34] text-white"
          trend={{ value: 9.6, label: "vs bulan lalu" }}
          sparklineColor="#8FA382"
          sparklineGradient="sageGrad"
        />
      </div>

      {/* Featured Banner & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Featured Banner */}
        <section className="lg:col-span-5 bg-[#273420] text-white rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-[0_8px_30px_-4px_rgba(44,56,37,0.05)] min-h-[300px]">
          <div className="z-10 max-w-[210px]">
            <p className="font-serif italic text-[#8FA382] text-base tracking-wide">
              Fokus Bulan Ini
            </p>
            <h3 className="font-serif text-3xl font-semibold leading-tight text-[#FAF7F2] mt-1.5">
              Tingkatkan<br />Arus Kas<br />Usaha Anda
            </h3>
            <p className="text-xs text-[#C5CCC0] leading-relaxed mt-4">
              Optimalkan kesehatan keuangan dengan insight dan rekomendasi AI.
            </p>
          </div>
          <div className="z-10 mt-6">
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 bg-[#FAF7F2] hover:bg-white text-[#273420] text-xs font-semibold px-4 py-2.5 rounded-full transition-all shadow-sm"
            >
              <span>Lihat Insight</span>
              <span>→</span>
            </Link>
          </div>
          <div className="absolute -right-4 -bottom-4 w-56 h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <div className="w-full h-full bg-gradient-to-br from-[#3E4F34] to-[#273420]"></div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="lg:col-span-3 flex flex-col justify-between gap-3">
          <Link
            href="/transactions/new"
            className="bg-white rounded-2xl p-4 border border-[#EBE5DC]/70 hover:border-[#314028]/40 transition-all flex items-center gap-3.5 shadow-[0_2px_16px_rgba(39,52,32,0.03)] group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F6EFE9] group-hover:bg-[#ECE4DC] text-amber-800/80 flex items-center justify-center shrink-0 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1F241D] group-hover:text-[#273420]">
                Tambah Transaksi
              </h4>
              <p className="text-[11px] text-[#7E8379] mt-0.5 leading-snug">
                Catat transaksi baru usaha Anda
              </p>
            </div>
          </Link>

          <Link
            href="/reports"
            className="bg-white rounded-2xl p-4 border border-[#EBE5DC]/70 hover:border-[#EFAAA4]/40 transition-all flex items-center gap-3.5 shadow-[0_2px_16px_rgba(39,52,32,0.03)] group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#F7E7E5]/70 group-hover:bg-[#F7E7E5] text-[#DC9690] flex items-center justify-center shrink-0 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1F241D] group-hover:text-[#273420]">
                Lihat Laporan
              </h4>
              <p className="text-[11px] text-[#7E8379] mt-0.5 leading-snug">
                Laba rugi & arus kas lengkap
              </p>
            </div>
          </Link>

          <Link
            href="/recommendations"
            className="bg-white rounded-2xl p-4 border border-[#EBE5DC]/70 hover:border-[#8FA382]/40 transition-all flex items-center gap-3.5 shadow-[0_2px_16px_rgba(39,52,32,0.03)] group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8EFE5] group-hover:bg-[#DFE9DB] text-[#4F6844] flex items-center justify-center shrink-0 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#1F241D] group-hover:text-[#273420]">
                Rekomendasi AI
              </h4>
              <p className="text-[11px] text-[#7E8379] mt-0.5 leading-snug">
                Saran berbasis analisis data Anda
              </p>
            </div>
          </Link>
        </section>

        {/* Financial Health */}
        <section className="lg:col-span-4 bg-white rounded-2xl p-5 border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DC]/50">
            <h3 className="text-sm font-semibold text-[#1F241D]">Kesehatan Finansial</h3>
            <Link
              href="/insights"
              className="text-[11px] font-medium text-[#1F241D] bg-[#FAF7F2] hover:bg-[#F4EFEA] border border-[#EBE5DC]/70 px-3 py-1 rounded-full transition-colors"
            >
              Lihat Detail
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-[#1F241D]">Arus Kas</span>
              </div>
              <RiskLevelBadge level="normal" />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-medium text-[#1F241D]">Margin Laba</span>
              </div>
              <RiskLevelBadge level="attention" />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#FAF7F2] rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-[#1F241D]">Pendapatan</span>
              </div>
              <RiskLevelBadge level="normal" />
            </div>
          </div>
        </section>
      </div>

      {/* Store Health Banner */}
      <section className="bg-[#273420] text-white rounded-3xl p-6 shadow-[0_8px_30px_-4px_rgba(44,56,37,0.05)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-[#8FA382]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="85, 100"
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-serif text-lg font-semibold text-white">
                85%
              </div>
            </div>
            <div>
              <span className="text-xs tracking-wider uppercase text-[#C2CCC0] font-medium">
                SKOR KESEHATAN
              </span>
              <h3 className="text-xl font-serif font-semibold text-white mt-1">
                Kondisi Baik!
              </h3>
              <p className="text-xs text-[#C2CCC0] mt-1">
                Semua indikator performa & keuangan terverifikasi.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[#C2CCC0]">Performa</span>
              <span className="font-semibold">Sangat Baik</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-[#C2CCC0]">Keamanan</span>
              <span className="font-semibold">Aman</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span className="text-[#C2CCC0]">Optimasi</span>
              <span className="font-semibold">Perlu Peningkatan</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
