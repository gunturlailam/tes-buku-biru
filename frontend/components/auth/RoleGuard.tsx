"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCurrentUser, type OrgRole } from "@/features/auth/hooks/use-current-user";

interface RoleGuardProps {
  children: React.ReactNode;
  /** Fungsi yang menerima role dan return true jika diizinkan */
  allowed: (role?: OrgRole) => boolean;
  /** Redirect ke sini jika tidak diizinkan. Default: /dashboard */
  redirectTo?: string;
}

export function RoleGuard({ children, allowed, redirectTo = "/dashboard" }: RoleGuardProps) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user && !allowed(user.role)) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, allowed, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-[#666666] text-sm">
        Memeriksa akses...
      </div>
    );
  }

  if (!user || !allowed(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="text-4xl">🔒</div>
        <p className="font-semibold text-[#1f1f1f]">Akses Dibatasi</p>
        <p className="text-sm text-[#666666]">
          Role Anda ({user?.role ?? "-"}) tidak memiliki izin untuk halaman ini.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
