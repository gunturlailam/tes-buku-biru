"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { authApi } from "@/features/auth/api/auth-api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import { getErrorMessage } from "@/lib/api-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;

    if (!getAccessToken()) {
      router.replace("/login");
      return () => {
        active = false;
      };
    }

    authApi
      .getCurrentUser()
      .then(() => {
        if (active) {
          setAuthError("");
          setIsCheckingAuth(false);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setAuthError(getErrorMessage(error));
          setIsCheckingAuth(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Memeriksa koneksi backend...
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div role="alert" className="max-w-lg rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-semibold">Tidak dapat memuat akun dari backend.</p>
          <p className="mt-2 text-sm">{authError}</p>
          <button
            type="button"
            className="mt-4 underline"
            onClick={() => {
              clearAccessToken();
              router.replace("/login");
            }}
          >
            Kembali ke login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Suspense fallback={<div className="w-60 flex-shrink-0 bg-white border-r" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col px-6 py-4 overflow-y-auto">
        <Suspense fallback={<div className="h-20" />}>
          <Navbar />
        </Suspense>
        <Suspense fallback={<div className="flex items-center justify-center flex-1"><div className="text-gray-400">Loading...</div></div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
