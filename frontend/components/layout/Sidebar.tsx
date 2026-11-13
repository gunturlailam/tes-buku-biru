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
  MessageSquare,
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
    <aside className="w-64 flex-shrink-0 bg-[#FAF7F2] border-r border-[#EBE5DC]/70 flex flex-col justify-between p-5 min-h-screen sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* Brand Logo */}
        <div className="px-3 pt-2 pb-6 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#273420] flex items-center justify-center text-white">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-tight leading-none text-[#1F241D] font-semibold">
              ProfitAI
            </h1>
            <p className="text-[9px] font-semibold tracking-[0.24em] text-[#7E8379] uppercase mt-0.5">
              Financial Intelligence
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#273420] text-white shadow-sm"
                    : "text-[#666A61] hover:text-[#1F241D] hover:bg-white/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-emerald-100/90" : "text-[#767676] opacity-80"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Upgrade Card */}
      <div className="mt-8 p-4 rounded-2xl bg-[#F6EFEA] border border-[#EBE5DC]/60 text-center relative overflow-hidden">
        <div className="mx-auto w-9 h-9 rounded-full bg-white/80 shadow-xs flex items-center justify-center text-[#C98A82] mb-2.5">
          <TrendingUp className="w-5 h-5" />
        </div>
        <h4 className="font-serif text-base font-semibold text-[#1F241D]">
          Tingkatkan ke<br />ProfitAI Pro
        </h4>
        <p className="text-[11px] leading-relaxed text-[#7E8379] mt-1 px-1">
          Dapatkan fitur forecasting dan insight lebih mendalam.
        </p>
        <button className="mt-3.5 w-full bg-[#273420] hover:bg-[#314028] text-white text-xs font-medium py-2.5 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm">
          <span>Upgrade Sekarang</span>
          <span className="text-xs">→</span>
        </button>
      </div>
    </aside>
  );
}
