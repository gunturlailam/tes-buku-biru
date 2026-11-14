"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { Building2, Users, ShieldAlert, BarChart3, Ban, CheckCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/api-client";

interface OrgItem {
  id: number;
  name: string;
  industry: string | null;
  owner_name: string | null;
  owner_email: string | null;
  member_count: number;
  transaction_count: number;
  is_active: boolean;
  suspended_reason: string | null;
  created_at: string;
}

interface UserItem {
  id: number;
  email: string;
  full_name: string;
  is_superadmin: boolean;
  organization_count: number;
  created_at: string;
}

interface Stats {
  total_organizations: number;
  total_users: number;
  total_posted_transactions: number;
  total_confirmed_imports: number;
  new_organizations_today: number;
  new_users_today: number;
  generated_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me, isLoading } = useCurrentUser();
  const [tab, setTab] = useState<"orgs" | "users" | "stats">("stats");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && me && !me.is_superadmin) {
      router.replace("/dashboard");
    }
  }, [me, isLoading, router]);

  const orgsQuery = useQuery<{ total: number; items: OrgItem[] }>({
    queryKey: ["admin-orgs"],
    queryFn: async () => { const { data } = await apiClient.get("/admin/organizations"); return data; },
    enabled: Boolean(me?.is_superadmin),
  });

  const usersQuery = useQuery<{ total: number; items: UserItem[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => { const { data } = await apiClient.get("/admin/users"); return data; },
    enabled: Boolean(me?.is_superadmin),
  });

  const statsQuery = useQuery<Stats>({
    queryKey: ["admin-stats"],
    queryFn: async () => { const { data } = await apiClient.get("/admin/stats"); return data; },
    enabled: Boolean(me?.is_superadmin),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ orgId, suspend, reason }: { orgId: number; suspend: boolean; reason?: string }) => {
      const { data } = await apiClient.patch(`/admin/organizations/${orgId}/suspend`, { suspend, reason });
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orgs"] }); setError(""); },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (isLoading || !me?.is_superadmin) return null;

  const statCards = [
    { label: "Total Organisasi", value: statsQuery.data?.total_organizations ?? "—", icon: Building2, color: "blue" },
    { label: "Total Pengguna", value: statsQuery.data?.total_users ?? "—", icon: Users, color: "green" },
    { label: "Total Transaksi", value: statsQuery.data?.total_posted_transactions ?? "—", icon: BarChart3, color: "purple" },
    { label: "Org Baru Hari Ini", value: statsQuery.data?.new_organizations_today ?? "—", icon: Building2, color: "yellow" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1f1f1f] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-sm text-[#666666] mt-1">Panel internal ProfitAI</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5" /> Super Admin
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-sm">
            <p className="text-2xl font-bold text-[#1f1f1f]">{s.value}</p>
            <p className="text-xs text-[#666666] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["stats", "orgs", "users"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? "bg-[#1f1f1f] text-white" : "bg-white border border-[#e5e5e5] text-[#666666] hover:bg-[#f5f5f5]"}`}>
            {t === "stats" ? "Statistik" : t === "orgs" ? `Organisasi (${orgsQuery.data?.total ?? 0})` : `Pengguna (${usersQuery.data?.total ?? 0})`}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === "stats" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Total Organisasi", value: statsQuery.data?.total_organizations },
            { label: "Total Pengguna", value: statsQuery.data?.total_users },
            { label: "Total Transaksi (Posted)", value: statsQuery.data?.total_posted_transactions },
            { label: "Total Import (Confirmed)", value: statsQuery.data?.total_confirmed_imports },
            { label: "Org Baru Hari Ini", value: statsQuery.data?.new_organizations_today },
            { label: "User Baru Hari Ini", value: statsQuery.data?.new_users_today },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-sm flex items-center justify-between">
              <p className="text-sm text-[#666666]">{s.label}</p>
              <p className="text-2xl font-bold text-[#1f1f1f]">{s.value ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orgs tab */}
      {tab === "orgs" && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Organisasi</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Owner</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#666666]">Anggota</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#666666]">Transaksi</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {orgsQuery.isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#999999]">Memuat...</td></tr>
                ) : orgsQuery.data?.items.map((org) => (
                  <tr key={org.id} className={`hover:bg-[#fafafa] ${!org.is_active ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1f1f1f]">{org.name}</p>
                      <p className="text-xs text-[#999999]">ID: {org.id} · {org.industry ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#1f1f1f]">{org.owner_name ?? "—"}</p>
                      <p className="text-xs text-[#999999]">{org.owner_email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{org.member_count}</td>
                    <td className="px-4 py-3 text-right font-semibold">{org.transaction_count}</td>
                    <td className="px-4 py-3">
                      {org.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            <Ban className="w-3 h-3" /> Suspended
                          </span>
                          {org.suspended_reason && (
                            <p className="text-[10px] text-[#999999] mt-0.5">{org.suspended_reason}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {org.is_active ? (
                        <button
                          onClick={() => {
                            const reason = prompt("Alasan suspend:");
                            if (reason !== null) {
                              suspendMutation.mutate({ orgId: org.id, suspend: true, reason });
                            }
                          }}
                          className="px-3 py-1 text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendMutation.mutate({ orgId: org.id, suspend: false })}
                          className="px-3 py-1 text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          Aktifkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Pengguna</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#666666]">Org</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {usersQuery.isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#999999]">Memuat...</td></tr>
                ) : usersQuery.data?.items.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3 font-semibold text-[#1f1f1f]">{u.full_name}</td>
                    <td className="px-4 py-3 text-[#666666]">{u.email}</td>
                    <td className="px-4 py-3 text-right font-semibold">{u.organization_count}</td>
                    <td className="px-4 py-3">
                      {u.is_superadmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          <ShieldAlert className="w-3 h-3" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#999999]">{u.created_at.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
