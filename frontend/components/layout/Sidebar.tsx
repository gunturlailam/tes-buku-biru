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
  Gauge,
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
    name: "Rasio CFO",
    href: "/ratios",
    icon: Gauge,
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
    <aside className="w-60 flex-shrink-0 bg-[#1a1a1a] border-r border-[#333333] flex flex-col justify-between p-4 min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* Brand Logo - Compact & Premium */}
        <div className="px-2 py-3 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#ffc900] flex items-center justify-center text-[#1a1a1a] shadow-lg shadow-[#ffc900]/20">
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
              <h1 className="font-display text-2xl leading-none text-white font-bold tracking-tight">
                ProfitAI
              </h1>
              <p className="text-[9px] font-bold tracking-[0.2em] text-[#666666] uppercase mt-0.5">
                Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - Refined */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#ffc900] text-[#1a1a1a] shadow-lg shadow-[#ffc900]/25"
                    : "text-[#999999] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 transition-transform duration-200",
                    isActive
                      ? "text-[#1a1a1a]"
                      : "text-[#666666] group-hover:text-[#e0e0e0] group-hover:scale-110"
                  )}
                  strokeWidth={2.5}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/80 shadow-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Premium Upgrade Card - More Elegant */}
      <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border border-[#ffc900]/30 text-white relative overflow-hidden group hover-lift">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffc900]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="w-10 h-10 rounded-lg bg-[#ffc900] flex items-center justify-center mb-3 shadow-lg shadow-[#ffc900]/25">
            <Sparkles className="w-5 h-5 text-[#1a1a1a]" strokeWidth={2.5} />
          </div>
          
          <h4 className="text-sm font-bold text-white mb-1">
            Upgrade ke Pro
          </h4>
          <p className="text-xs leading-relaxed text-[#cccccc] mb-4">
            Forecasting AI & insight mendalam untuk bisnis Anda.
          </p>
          
          <button className="w-full bg-[#ffc900] hover:bg-[#f0bd00] text-[#1a1a1a] text-xs font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md group/btn">
            <span>Mulai Sekarang</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#ffc900]/5 rounded-full blur-2xl" />
        <div className="absolute -left-4 -top-4 w-16 h-16 bg-[#ffc900]/10 rounded-full blur-xl" />
      </div>
    </aside>
  );
}
