"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/features/auth/api/auth-api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type AuthStatus = "checking" | "authenticated";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      const token = getAccessToken();
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await authApi.getCurrentUser();
        if (!cancelled) {
          setStatus("authenticated");
        }
      } catch {
        clearAccessToken();
        if (!cancelled) {
          router.replace("/login");
        }
      }
    };

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-[#666666]">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
