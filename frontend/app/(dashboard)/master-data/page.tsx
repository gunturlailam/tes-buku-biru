"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { FixedAssetsTab } from "@/features/data-intake/components/FixedAssetsTab";
import { InventoryTab } from "@/features/data-intake/components/InventoryTab";
import { LoansTab } from "@/features/data-intake/components/LoansTab";
import { PayablesTab } from "@/features/data-intake/components/PayablesTab";
import { ReceivablesTab } from "@/features/data-intake/components/ReceivablesTab";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "receivables", label: "Piutang" },
  { id: "payables", label: "Utang" },
  { id: "inventory", label: "Persediaan" },
  { id: "assets", label: "Aset Tetap" },
  { id: "loans", label: "Pinjaman" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabId>("receivables");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-semibold text-[#1F241D]">
          Master Data
        </h1>
        <p className="text-sm text-[#7E8379] mt-1">
          Lengkapi piutang, utang, persediaan, aset tetap, dan pinjaman. Data
          ini memperkaya input rasio dan analisis CFO.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-[#273420] bg-[#273420] text-white"
                : "border-[#EBE5DC] bg-white text-[#666A61] hover:bg-[#FAF7F2]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tabs.find((tab) => tab.id === activeTab)?.label}</CardTitle>
          <CardDescription>
            Semua perubahan tersimpan ke backend dengan validasi tenant dan
            audit event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTab === "receivables" && <ReceivablesTab />}
          {activeTab === "payables" && <PayablesTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "assets" && <FixedAssetsTab />}
          {activeTab === "loans" && <LoansTab />}
        </CardContent>
      </Card>
    </div>
  );
}
