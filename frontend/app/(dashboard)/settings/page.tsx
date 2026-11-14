"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Save, ShieldCheck } from "lucide-react";
import {
  authAPI,
  organizationAPI,
  getErrorMessage,
  type OrganizationResponse,
} from "@/lib/api";

export const instant = false;

interface Toast {
  type: "success" | "error";
  message: string;
}

interface CurrentUser {
  id: number;
  email: string;
  full_name: string;
  organization_id: number;
  role: string;
}

function SettingsForm({
  user,
  organization,
}: {
  user: CurrentUser;
  organization: OrganizationResponse;
}) {
  const [name, setName] = useState(organization.name);
  const [industry, setIndustry] = useState(organization.industry ?? "");
  const [currency, setCurrency] = useState(organization.currency);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setToast({ type: "error", message: "Nama organisasi wajib diisi" });
      return;
    }

    setIsSaving(true);
    setToast(null);
    try {
      await organizationAPI.updateOrganization(organization.id, {
        name: name.trim(),
        industry: industry.trim() || null,
        currency,
      });
      setToast({ type: "success", message: "Pengaturan berhasil disimpan" });
    } catch (error) {
      setToast({ type: "error", message: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1F241D]">Pengaturan</h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Kelola informasi organisasi dan preferensi akun
        </p>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBE5DC]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1F241D]">
              Informasi Organisasi
            </h2>
            <p className="text-sm text-[#7E8379]">
              Data ini tersimpan di server, bukan contoh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Nama Organisasi
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama organisasi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Industri
            </label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Contoh: F&B / Kuliner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Mata Uang
            </label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="IDR"
              maxLength={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F241D] mb-2">
              Basis Akuntansi
            </label>
            <Input value={organization.accounting_basis} disabled />
            <p className="text-xs text-[#7E8379] mt-1">
              Basis kas untuk transaksi; neraca/rasio menyusul di tahap
              berikutnya.
            </p>
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

      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBE5DC]">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#1F241D]">Akun</h2>
            <p className="text-sm text-[#7E8379]">Identitas pengguna aktif</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[#7E8379]">Nama</dt>
            <dd className="font-medium text-[#1F241D] mt-1">
              {user.full_name}
            </dd>
          </div>
          <div>
            <dt className="text-[#7E8379]">Email</dt>
            <dd className="font-medium text-[#1F241D] mt-1">{user.email}</dd>
          </div>
          <div>
            <dt className="text-[#7E8379]">Role</dt>
            <dd className="font-medium text-[#1F241D] mt-1 capitalize">
              {user.role}
            </dd>
          </div>
          <div>
            <dt className="text-[#7E8379]">Zona Waktu</dt>
            <dd className="font-medium text-[#1F241D] mt-1">
              {organization.timezone}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-[#7E8379] border-t border-[#EBE5DC] pt-4">
          Ubah kata sandi, 2FA, dan manajemen sesi belum tersedia di MVP ini.
          Fitur tersebut tidak ditampilkan sebagai tombol aktif agar tidak
          menyesatkan.
        </p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery({
    queryKey: ["current-user"],
    queryFn: authAPI.getCurrentUser,
  });

  const {
    data: organization,
    isLoading: isOrgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ["organization", user?.organization_id],
    queryFn: () => organizationAPI.getOrganization(user!.organization_id),
    enabled: Boolean(user?.organization_id),
  });

  if (isUserLoading || isOrgLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (userError || orgError || !user || !organization) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
        Gagal memuat pengaturan. Pastikan backend berjalan dan coba refresh.
      </div>
    );
  }

  return (
    <SettingsForm
      key={organization.id}
      user={user as CurrentUser}
      organization={organization}
    />
  );
}
