"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Calendar, Search, User, X, LogOut, Settings, ChevronDown } from "lucide-react";
import { authApi } from "@/features/auth/api/auth-api";
import { clearAccessToken } from "@/lib/auth";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

export function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Transaksi Baru",
      message: "Pemasukan Rp 5.000.000 telah dicatat",
      time: "5 menit lalu",
      read: false,
      type: "success",
    },
    {
      id: 2,
      title: "Laporan Siap",
      message: "Laporan keuangan bulan ini sudah tersedia",
      time: "2 jam lalu",
      read: false,
      type: "info",
    },
    {
      id: 3,
      title: "Peringatan",
      message: "Arus kas mendekati batas minimum",
      time: "1 hari lalu",
      read: true,
      type: "warning",
    },
  ]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load current user
  useEffect(() => {
    authApi
      .getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => {});
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("navbar-search")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleLogout = () => {
    clearAccessToken();
    router.replace("/login");
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e5e5e5]">
      {/* Greeting */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[#1f1f1f] flex items-center gap-1.5 mb-0.5">
          <span>Halo, {currentUser?.full_name?.split(" ")[0] || "User"}!</span>
          <span className="text-xl">👋</span>
        </h2>
        <p className="text-xs text-[#666666]">
          Berikut ringkasan kesehatan usaha Anda hari ini
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-56 lg:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
            <Search className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <input
            id="navbar-search"
            className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-[#e5e5e5] rounded-lg text-[#1f1f1f] placeholder-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#ffc900]/50 focus:border-[#ffc900] transition-all shadow-sm hover:shadow-md"
            placeholder="Cari transaksi..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#999999] hover:text-[#666666]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[9px] bg-[#f5f5f5] border border-[#e0e0e0] px-1.5 py-0.5 rounded text-[#666666] font-semibold">
                <span>⌘</span>
                <span>K</span>
              </kbd>
            )}
          </span>
        </form>

        {/* Notification */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowCalendar(false);
              setShowProfileMenu(false);
            }}
            className="relative w-9 h-9 rounded-lg bg-white border border-[#e5e5e5] text-[#666666] flex items-center justify-center hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md"
          >
            <Bell className="w-4 h-4" strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#e5e5e5] shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-[#e5e5e5] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1f1f1f]">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-[#666666]">{unreadCount} baru</span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`w-full p-3 text-left hover:bg-[#f9f9f9] transition-colors border-b border-[#f0f0f0] last:border-0 ${
                        !notif.read ? "bg-[#fffbf0]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notif.type === "success"
                              ? "bg-green-500"
                              : notif.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#1f1f1f] mb-0.5">
                            {notif.title}
                          </p>
                          <p className="text-xs text-[#666666] mb-1">{notif.message}</p>
                          <p className="text-[10px] text-[#999999]">{notif.time}</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-6 text-center text-sm text-[#999999]">
                    Tidak ada notifikasi
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="relative" ref={calendarRef}>
          <button
            onClick={() => {
              setShowCalendar(!showCalendar);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
            className="w-9 h-9 rounded-lg bg-white border border-[#e5e5e5] text-[#666666] flex items-center justify-center hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md"
          >
            <Calendar className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {/* Calendar Dropdown */}
          {showCalendar && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#e5e5e5] shadow-lg z-50 p-4">
              <div className="text-center mb-3">
                <p className="text-xs font-bold text-[#1f1f1f]">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    router.push("/reports");
                    setShowCalendar(false);
                  }}
                  className="w-full p-2 text-left text-xs hover:bg-[#f9f9f9] rounded-lg transition-colors"
                >
                  📊 Lihat Laporan Bulan Ini
                </button>
                <button
                  onClick={() => {
                    router.push("/transactions");
                    setShowCalendar(false);
                  }}
                  className="w-full p-2 text-left text-xs hover:bg-[#f9f9f9] rounded-lg transition-colors"
                >
                  📝 Transaksi Hari Ini
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowCalendar(false);
            }}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-white border border-[#e5e5e5] hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-all shadow-sm hover:shadow-md"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-md overflow-hidden bg-[#ffc900] flex items-center justify-center text-[#1f1f1f] font-bold text-xs shadow-sm">
                {currentUser?.full_name?.[0]?.toUpperCase() || <User className="w-4 h-4" strokeWidth={2.5} />}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#2e7d32] ring-1.5 ring-white shadow-sm" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1f1f1f] leading-tight">
                {currentUser?.full_name || "Demo User"}
              </p>
              <p className="text-[9px] text-[#666666] leading-tight">
                {currentUser?.role || "Premium"}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-[#999999]" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#e5e5e5] shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-[#e5e5e5]">
                <p className="text-xs font-bold text-[#1f1f1f]">
                  {currentUser?.full_name || "Demo User"}
                </p>
                <p className="text-[10px] text-[#666666]">{currentUser?.email || "demo@profitai.local"}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => {
                    router.push("/settings");
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#1f1f1f] hover:bg-[#f9f9f9] rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Pengaturan
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
