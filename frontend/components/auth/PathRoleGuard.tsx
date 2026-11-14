"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  useCurrentUser,
  canAdminFinance,
  canEditSettings,
  canManageMembers,
  type OrgRole,
} from "@/features/auth/hooks/use-current-user";

/**
 * Map path prefix → fungsi permission.
 * Jika path cocok dan user tidak punya akses → redirect ke /dashboard.
 */
const PROTECTED_PATHS: Array<{ prefix: string; allowed: (role?: OrgRole) => boolean }> = [
  { prefix: "/imports",      allowed: canAdminFinance },
  { prefix: "/balance-sheet", allowed: canAdminFinance },
  { prefix: "/master-data",   allowed: canAdminFinance },
  { prefix: "/settings",      allowed: canEditSettings },
  { prefix: "/members",       allowed: canManageMembers },
];

export function PathRoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading || !user) return;

    for (const rule of PROTECTED_PATHS) {
      if (pathname.startsWith(rule.prefix) && !rule.allowed(user.role)) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [pathname, user, isLoading, router]);

  return <>{children}</>;
}
