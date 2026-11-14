import { useQuery } from "@tanstack/react-query";
import { authApi, type CurrentUser } from "@/features/auth/api/auth-api";
import { getAccessToken } from "@/lib/auth";

export type OrgRole = "owner" | "admin" | "member" | "viewer";

export interface CurrentUserWithRole extends CurrentUser {
  role: OrgRole;
}

export function useCurrentUser() {
  return useQuery<CurrentUserWithRole>({
    queryKey: ["current-user"],
    queryFn: () => authApi.getCurrentUser() as Promise<CurrentUserWithRole>,
    enabled: Boolean(getAccessToken()),
    staleTime: 1000 * 60 * 5, // 5 menit
    retry: false,
  });
}

// --- Permission helpers ---

/** Bisa buat/edit/hapus transaksi */
export function canWriteTransactions(role?: OrgRole) {
  return role === "owner" || role === "admin" || role === "member";
}

/** Bisa reverse transaksi, kelola kategori/akun, import, neraca */
export function canAdminFinance(role?: OrgRole) {
  return role === "owner" || role === "admin";
}

/** Bisa kelola anggota organisasi */
export function canManageMembers(role?: OrgRole) {
  return role === "owner";
}

/** Bisa ubah pengaturan organisasi */
export function canEditSettings(role?: OrgRole) {
  return role === "owner" || role === "admin";
}

/** Semua role bisa baca laporan */
export function canReadReports(_role?: OrgRole) {
  return true;
}
