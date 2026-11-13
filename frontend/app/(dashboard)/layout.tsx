import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Suspense fallback={<div className="w-60 flex-shrink-0 bg-white border-r" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col px-8 py-6 overflow-y-auto">
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
