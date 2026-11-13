"use client";

import { Bell, Calendar, Search } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl lg:text-[27px] font-semibold text-[#1F241D] flex items-center gap-2">
          <span>Halo, User!</span>
          <span className="text-xl">👋</span>
        </h2>
        <p className="text-xs lg:text-[13px] text-[#7E8379] mt-0.5">
          Berikut ringkasan keuangan usaha Anda hari ini.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-64 lg:w-72">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7E8379]/70">
            <Search className="w-4 h-4" />
          </span>
          <input
            className="w-full pl-9 pr-11 py-2 text-xs bg-white border border-[#EBE5DC]/80 rounded-full text-[#1F241D] placeholder-[#7E8379]/70 focus:outline-none focus:ring-1 focus:ring-[#314028] focus:border-[#314028] transition-shadow shadow-xs"
            placeholder="Cari transaksi..."
            type="text"
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <kbd className="text-[10px] bg-[#FAF7F2] border border-[#EBE5DC] px-1.5 py-0.5 rounded text-[#7E8379] font-sans font-medium">
              ⌘K
            </kbd>
          </span>
        </div>

        {/* Notification */}
        <button className="w-9 h-9 rounded-full bg-white border border-[#EBE5DC]/80 text-[#1F241D] flex items-center justify-center hover:bg-[#FAF7F2] transition-colors shadow-xs relative">
          <Bell className="w-4 h-4 text-[#1F241D]/80" />
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-2 right-2"></span>
        </button>

        {/* Calendar */}
        <button className="w-9 h-9 rounded-full bg-white border border-[#EBE5DC]/80 text-[#1F241D] flex items-center justify-center hover:bg-[#FAF7F2] transition-colors shadow-xs">
          <Calendar className="w-4 h-4 text-[#1F241D]/80" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 pl-1.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white bg-[#273420] flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>
        </div>
      </div>
    </header>
  );
}
