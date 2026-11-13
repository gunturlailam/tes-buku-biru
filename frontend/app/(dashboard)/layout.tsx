import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex">
      <Suspense fallback={<div className="w-64 flex-shrink-0 bg-[#FAF7F2] border-r" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col px-8 py-7 overflow-y-auto">
        <Suspense fallback={<div className="h-16" />}>
          <Navbar />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
