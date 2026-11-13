"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  FileText,
  TrendingUp,
  Lightbulb,
  Settings,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transaksi",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Laporan",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Insight Risiko",
    href: "/insights",
    icon: TrendingUp,
  },
  {
    name: "Rekomendasi",
    href: "/recommendations",
    icon: Lightbulb,
  },
  {
    name: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200/60 flex flex-col justify-between p-4 min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* Brand Logo - Compact & Premium */}
        <div className="px-2 py-3 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none text-gray-900 font-semibold tracking-tight">
                ProfitAI
              </h1>
              <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase mt-0.5">
                Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Refined */}
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/25"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 transition-transform duration-200",
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-600 group-hover:scale-110"
                  )}
                  strokeWidth={2.5}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Premium Upgrade Card - More Elegant */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden group hover-lift">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          
          <h4 className="text-sm font-bold text-white mb-1">
            Upgrade ke Pro
          </h4>
          <p className="text-xs leading-relaxed text-gray-300 mb-4">
            Forecasting AI & insight mendalam untuk bisnis Anda.
          </p>
          
          <button className="w-full bg-white hover:bg-gray-50 text-gray-900 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm group/btn">
            <span>Mulai Sekarang</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
        <div className="absolute -left-4 -top-4 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl" />
      </div>
    </aside>
  );
}
