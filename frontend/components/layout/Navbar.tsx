"use client";

import { Bell, Calendar, Search, User } from "lucide-react";

export function Navbar() {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e5e5e5]">
      {/* Greeting */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[#1f1f1f] flex items-center gap-1.5 mb-0.5">
          <span>Halo, User!</span>
          <span className="text-xl">👋</span>
        </h2>
        <p className="text-xs text-[#666666]">
          Berikut ringkasan kesehatan usaha Anda hari ini
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="relative w-56 lg:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <input
            className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg text-[#1f1f1f] placeholder-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#ffc900]/50 focus:border-[#ffc900] transition-all shadow-sm hover:shadow-md"
            placeholder="Cari transaksi..."
            type="text"
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[9px] bg-[#f5f5f5] border border-[#e0e0e0] px-1.5 py-0.5 rounded text-[#666666] font-semibold">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </span>
        </div>

        {/* Notification */}
        <button className="relative w-9 h-9 rounded-lg bg-white border border-[#e5e5e5] text-[#666666] flex items-center justify-center hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md">
          <Bell className="w-4 h-4 group-hover:text-[#ffc900] transition-colors" strokeWidth={2.5} />
          <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white shadow-sm">
            3
          </span>
        </button>

        {/* Calendar */}
        <button className="w-9 h-9 rounded-lg bg-white border border-[#e5e5e5] text-[#666666] flex items-center justify-center hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md">
          <Calendar className="w-4 h-4 group-hover:text-[#ffc900] transition-colors" strokeWidth={2.5} />
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-white border border-[#e5e5e5] hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md">
          <div className="relative">
            <div className="w-7 h-7 rounded-md overflow-hidden bg-[#ffc900] flex items-center justify-center text-[#1f1f1f] font-bold text-xs shadow-sm">
              <User className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#2e7d32] ring-1.5 ring-white shadow-sm" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#1f1f1f] leading-tight">Demo User</p>
            <p className="text-[9px] text-[#666666] leading-tight">Premium</p>
          </div>
        </button>
      </div>
    </header>
  );
}
