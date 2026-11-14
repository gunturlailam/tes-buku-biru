import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PathRoleGuard } from "@/components/auth/PathRoleGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <PathRoleGuard>
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
      </PathRoleGuard>
    </AuthGuard>
  );
}
