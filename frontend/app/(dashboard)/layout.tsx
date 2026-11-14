import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { authApi } from "@/features/auth/api/auth-api";
import { getAccessToken } from "@/lib/auth";

async function verifyAuth() {
  const token = getAccessToken();
  if (!token) {
    redirect("/login");
  }

  try {
    await authApi.getCurrentUser();
  } catch {
    redirect("/login");
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifyAuth();

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
