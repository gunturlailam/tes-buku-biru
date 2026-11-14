"use client";

import { Bell, Calendar, Search, User } from "lucide-react";

export function Navbar() {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#e5e5e5]">
      {/* Greeting */}
      <div>
        <h2 className="text-3xl font-bold text-[#1f1f1f] flex items-center gap-2 mb-2">
          <span>Halo, User!</span>
          <span className="text-3xl">👋</span>
        </h2>
        <p className="text-sm text-[#666666]">
          Berikut ringkasan kesehatan usaha Anda hari ini
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative w-64 lg:w-80">
          <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#999999]">
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <input
            className="w-full pl-11 pr-12 py-2.5 text-sm bg-white border border-[#e5e5e5] rounded-lg text-[#1f1f1f] placeholder-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#ffc900]/50 focus:border-[#ffc900] transition-all shadow-sm hover:shadow-md"
            placeholder="Cari transaksi, laporan..."
            type="text"
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-[#f5f5f5] border border-[#e0e0e0] px-2 py-1 rounded-md text-[#666666] font-semibold">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </span>
        </div>

        {/* Notification */}
        <button className="relative w-10 h-10 rounded-lg bg-white border border-[#e5e5e5] text-[#666666] flex items-center justify-center hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md group">
          <Bell className="w-4.5 h-4.5 group-hover:text-[#ffc900] transition-colors" strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
            3
          </span>
        </button>

        {/* Calendar */}
        <button className="w-10 h-10 rounded-lg bg-white border border-[#e5e5e5] text-[#666666] flex items-center justify-center hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md group">
          <Calendar className="w-4.5 h-4.5 group-hover:text-[#ffc900] transition-colors" strokeWidth={2.5} />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg bg-white border border-[#e5e5e5] hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md group">
          <div className="relative">
            <div className="w-8 h-8 rounded-md overflow-hidden bg-[#ffc900] flex items-center justify-center text-[#1f1f1f] font-bold text-sm shadow-sm">
              <User className="w-4.5 h-4.5" strokeWidth={2.5} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2e7d32] ring-2 ring-white shadow-sm" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#1f1f1f] leading-tight">Demo User</p>
            <p className="text-[10px] text-[#666666] leading-tight">Premium</p>
          </div>
        </button>
      </div>
    </header>
  );
}
