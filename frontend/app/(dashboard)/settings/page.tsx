"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Save, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState("PT. Demo Business");
  const [email, setEmail] = useState("admin@demobusiness.com");
  const [phone, setPhone] = useState("+62 812-3456-7890");
  const [industry, setIndustry] = useState("Retail");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    alert("Pengaturan berhasil disimpan");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1F241D]">Pengaturan</h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Kelola informasi perusahaan dan preferensi Anda
        </p>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBE5DC]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1F241D]">Informasi Perusahaan</h2>
            <p className="text-sm text-[#7E8379]">Data dasar perusahaan Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Nama Perusahaan
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nama perusahaan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Industri
            </label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Jenis industri"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email perusahaan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Telepon
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor telepon"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBE5DC]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1F241D]">Keamanan</h2>
            <p className="text-sm text-[#7E8379]">Kelola keamanan akun Anda</p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="font-medium text-[#1F241D]">Ubah Kata Sandi</span>
            <ChevronRight className="w-5 h-5 text-[#7E8379]" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="font-medium text-[#1F241D]">Autentikasi Dua Faktor</span>
            <ChevronRight className="w-5 h-5 text-[#7E8379]" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="font-medium text-[#1F241D]">Sesi Aktif</span>
            <ChevronRight className="w-5 h-5 text-[#7E8379]" />
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBE5DC]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1F241D]">Preferensi</h2>
            <p className="text-sm text-[#7E8379]">Pengaturan tampilan dan bahasa</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-3">
              Tema
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button className="p-3 rounded-lg border-2 border-emerald-500 bg-white text-center font-medium text-sm text-[#1F241D]">
                Terang
              </button>
              <button className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-center font-medium text-sm text-[#7E8379] hover:border-gray-300">
                Gelap
              </button>
              <button className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-center font-medium text-sm text-[#7E8379] hover:border-gray-300">
                Otomatis
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-3">
              Bahasa
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button className="p-3 rounded-lg border-2 border-emerald-500 bg-white text-center font-medium text-sm text-[#1F241D]">
                Bahasa Indonesia
              </button>
              <button className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-center font-medium text-sm text-[#7E8379] hover:border-gray-300">
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
