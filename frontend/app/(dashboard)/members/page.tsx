"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { getErrorMessage } from "@/lib/api-client";
import { UserPlus, Trash2, Pencil, ShieldCheck, Users } from "lucide-react";

type OrgRole = "owner" | "admin" | "member" | "viewer";

interface Member {
  user_id: number;
  email: string;
  full_name: string;
  role: OrgRole;
  joined_at: string;
}

const ROLE_OPTIONS: OrgRole[] = ["owner", "admin", "member", "viewer"];

const ROLE_BADGE: Record<OrgRole, string> = {
  owner:  "bg-[#ffc900] text-[#1a1a1a]",
  admin:  "bg-blue-100 text-blue-700",
  member: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-600",
};

const ROLE_LABEL: Record<OrgRole, string> = {
  owner:  "Owner",
  admin:  "Admin",
  member: "Member",
  viewer: "Viewer",
};

export default function MembersPage() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const orgId = me?.organization_id;

  const [showAdd, setShowAdd]       = useState(false);
  const [newEmail, setNewEmail]     = useState("");
  const [newRole, setNewRole]       = useState<OrgRole>("member");
  const [editId, setEditId]         = useState<number | null>(null);
  const [editRole, setEditRole]     = useState<OrgRole>("member");
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  // --- Fetch members ---
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["members", orgId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/organizations/${orgId}/members`);
      return data;
    },
    enabled: Boolean(orgId),
  });

  // --- Add member ---
  const addMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/organizations/${orgId}/members`, {
        email: newEmail.trim().toLowerCase(),
        role: newRole,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      setShowAdd(false);
      setNewEmail("");
      setNewRole("member");
      setSuccess("Anggota berhasil ditambahkan.");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  // --- Update role ---
  const updateMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: OrgRole }) => {
      await apiClient.patch(`/organizations/${orgId}/members/${userId}`, { role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      setEditId(null);
      setSuccess("Role berhasil diperbarui.");
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  // --- Remove member ---
  const removeMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/organizations/${orgId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", orgId] });
      setSuccess("Anggota berhasil dihapus.");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newEmail) { setError("Email wajib diisi"); return; }
    addMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1f1f1f] flex items-center gap-2">
            <Users className="w-6 h-6" />
            Kelola Anggota
          </h1>
          <p className="text-sm text-[#666666] mt-1">
            Tambah, ubah role, atau hapus anggota organisasi. Hanya owner yang dapat mengakses halaman ini.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#ffc900] hover:bg-[#f0bd00] text-[#1a1a1a] text-sm font-bold rounded-xl transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Anggota
        </button>
      </div>

      {/* Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          {error.includes("belum terdaftar") && (
            <p className="text-xs text-red-500 mt-1">
              Minta anggota tersebut untuk register di{" "}
              <a href="/register" target="_blank" className="underline font-semibold hover:text-red-700">
                halaman daftar
              </a>{" "}
              terlebih dahulu, lalu coba tambahkan kembali.
            </p>
          )}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
          {success}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#1f1f1f] mb-1 flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Tambah Anggota Baru
          </h2>
          <p className="text-xs text-[#999999] mb-4">
            Anggota harus sudah memiliki akun ProfitAI terlebih dahulu.{" "}
            <a href="/register" target="_blank" className="text-[#ffc900] font-semibold underline hover:text-[#f0bd00]">
              Daftar di sini →
            </a>
          </p>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Email anggota yang sudah terdaftar"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ffc900]/50"
              required
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as OrgRole)}
              className="px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ffc900]/50"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-5 py-2.5 bg-[#ffc900] hover:bg-[#f0bd00] text-[#1a1a1a] text-sm font-bold rounded-xl disabled:opacity-60 transition-all"
            >
              {addMutation.isPending ? "Menambahkan..." : "Tambah"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setError(""); }}
              className="px-5 py-2.5 border border-[#e5e5e5] text-[#666666] text-sm rounded-xl hover:bg-[#f5f5f5] transition-all"
            >
              Batal
            </button>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0f0f0] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1f1f1f]">
            Daftar Anggota
          </h2>
          <span className="text-xs text-[#999999]">{members.length} anggota</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#999999]">Memuat anggota...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#999999]">Belum ada anggota.</div>
        ) : (
          <div className="divide-y divide-[#f0f0f0]">
            {members.map((m) => (
              <div key={m.user_id} className="px-5 py-4 flex items-center justify-between gap-4">
                {/* Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#ffc900] flex items-center justify-center text-[#1a1a1a] font-bold text-sm flex-shrink-0">
                    {m.full_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1f1f1f] truncate">
                      {m.full_name}
                      {m.user_id === me?.id && (
                        <span className="ml-2 text-[10px] text-[#999999] font-normal">(Anda)</span>
                      )}
                    </p>
                    <p className="text-xs text-[#666666] truncate">{m.email}</p>
                  </div>
                </div>

                {/* Role + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {editId === m.user_id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as OrgRole)}
                        className="px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#ffc900]/50"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateMutation.mutate({ userId: m.user_id, role: editRole })}
                        disabled={updateMutation.isPending}
                        className="px-3 py-1.5 bg-[#ffc900] text-[#1a1a1a] text-xs font-bold rounded-lg disabled:opacity-60"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="px-3 py-1.5 border border-[#e5e5e5] text-xs rounded-lg hover:bg-[#f5f5f5]"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${ROLE_BADGE[m.role]}`}>
                        <ShieldCheck className="w-3 h-3" />
                        {ROLE_LABEL[m.role]}
                      </span>

                      {/* Jangan tampil edit/delete untuk diri sendiri */}
                      {m.user_id !== me?.id && (
                        <>
                          <button
                            onClick={() => { setEditId(m.user_id); setEditRole(m.role); }}
                            className="p-1.5 text-[#666666] hover:text-[#1f1f1f] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                            title="Ubah role"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus ${m.full_name} dari organisasi?`)) {
                                removeMutation.mutate(m.user_id);
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus anggota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#1f1f1f] mb-3">Panduan Role</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#666666]">
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${ROLE_BADGE.owner}`}>Owner</span>
            <span>Akses penuh: kelola anggota, pengaturan org, semua fitur keuangan.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${ROLE_BADGE.admin}`}>Admin</span>
            <span>Kelola transaksi, import, neraca, pengaturan. Tidak bisa kelola anggota.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${ROLE_BADGE.member}`}>Member</span>
            <span>Buat dan edit transaksi. Tidak bisa import atau akses pengaturan.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`mt-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${ROLE_BADGE.viewer}`}>Viewer</span>
            <span>Hanya baca laporan, dashboard, dan rekomendasi. Tidak bisa buat transaksi.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
