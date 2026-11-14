"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Building2, Users, ShieldAlert } from "lucide-react";

interface OrgItem {
  id: number;
  name: string;
  industry: string | null;
  owner_name: string | null;
  owner_email: string | null;
  member_count: number;
  transaction_count: number;
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

export default function AdminPage() {
  const router = useRouter();
  const { data: me, isLoading } = useCurrentUser();
  const [tab, setTab] = useState<"orgs" | "users">("orgs");

  useEffect(() => {
    if (!isLoading && me && !me.is_superadmin) {
      router.replace("/dashboard");
    }
  }, [me, isLoading, router]);

  const orgsQuery = useQuery<{ total: number; items: OrgItem[] }>({
    queryKey: ["admin-orgs"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/organizations");
      return data;
    },
    enabled: Boolean(me?.is_superadmin),
  });

  const usersQuery = useQuery<{ total: number; items: UserItem[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await apiClient.get("/admin/users");
      return data;
    },
    enabled: Boolean(me?.is_superadmin),
  });

  if (isLoading || !me?.is_superadmin) return null;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1f1f1f] flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-[#666666] mt-1">
          Panel internal ProfitAI — data semua organisasi dan pengguna.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1f1f1f]">{orgsQuery.data?.total ?? "—"}</p>
              <p className="text-xs text-[#666666]">Total Organisasi</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1f1f1f]">{usersQuery.data?.total ?? "—"}</p>
              <p className="text-xs text-[#666666]">Total Pengguna</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("orgs")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "orgs" ? "bg-[#1f1f1f] text-white" : "bg-white border border-[#e5e5e5] text-[#666666] hover:bg-[#f5f5f5]"}`}
        >
          Organisasi ({orgsQuery.data?.total ?? 0})
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "users" ? "bg-[#1f1f1f] text-white" : "bg-white border border-[#e5e5e5] text-[#666666] hover:bg-[#f5f5f5]"}`}
        >
          Pengguna ({usersQuery.data?.total ?? 0})
        </button>
      </div>

      {/* Orgs Table */}
      {tab === "orgs" && (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f9f9f9] border-b border-[#e5e5e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Organisasi</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Industri</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#666666]">Anggota</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-[#666666]">Transaksi</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#666666]">Daftar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {orgsQuery.isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#999999]">Memuat...</td></tr>
                ) : orgsQuery.data?.items.map((org) => (
                  <tr key={org.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1f1f1f]">{org.name}</p>
                      <p className="text-xs text-[#999999]">ID: {org.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#1f1f1f]">{org.owner_name ?? "—"}</p>
                      <p className="text-xs text-[#999999]">{org.owner_email ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-[#666666]">{org.industry ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{org.member_count}</td>
                    <td className="px-4 py-3 text-right font-semibold">{org.transaction_count}</td>
                    <td className="px-4 py-3 text-xs text-[#999999]">{org.created_at.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Table */}
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
                          Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                          User
                        </span>
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
