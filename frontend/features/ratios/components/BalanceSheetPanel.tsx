"use client";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BalanceSheetLine, BalanceSheetResponse } from "@/types/ratios";
import { ChevronDown, Landmark, Scale } from "lucide-react";

interface BalanceSheetPanelProps {
  data?: BalanceSheetResponse;
  isLoading: boolean;
  error?: string;
}

function LineGroup({
  title,
  lines,
}: {
  title: string;
  lines: BalanceSheetLine[];
}) {
  if (lines.length === 0) return null;

  return (
    <details className="group border-t border-[#F0EBE3] py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-xs font-semibold text-[#4C5348]">
        <span>
          {title} <span className="text-[#A0A59B]">({lines.length})</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[#9A9F94] transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-1.5 pt-2">
        {lines.map((line) => (
          <div
            key={line.account_id}
            className="flex items-center justify-between gap-3 text-[11px]"
          >
            <span className="text-[#7E8379]">
              {line.code} · {line.name}
              {line.is_current && (
                <span className="ml-1 text-[9px] font-semibold uppercase text-emerald-600">
                  lancar
                </span>
              )}
            </span>
            <span className="font-mono font-semibold text-[#3F463B]">
              {formatCurrency(line.amount, "IDR")}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}

export function BalanceSheetPanel({
  data,
  isLoading,
  error,
}: BalanceSheetPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#EBE5DC]/70 bg-white p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-9 w-44" />
        <div className="mt-5 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Neraca gagal dimuat">
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert variant="warning" title="Neraca belum tersedia">
        Belum ada data neraca untuk periode ini.
      </Alert>
    );
  }

  if (data.status === "unavailable") {
    return (
      <div className="rounded-2xl border border-[#EBE5DC]/70 bg-white p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF7F2]">
            <Scale className="h-4 w-4 text-[#7E8379]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1F241D]">Neraca</h3>
            <p className="text-[11px] text-[#9A9F94]">
              per {formatDate(data.as_of, "long")}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">
          {data.reason ?? "Belum ada balance snapshot untuk tanggal ini."}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[#7E8379]">
          Rasio likuiditas dan solvabilitas membutuhkan saldo neraca. Rasio
          profitabilitas tetap dapat dihitung dari transaksi jika klasifikasi HPP
          sudah lengkap.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#EBE5DC]/70 bg-white p-5 shadow-[0_2px_16px_rgba(39,52,32,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Landmark className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1F241D]">Neraca</h3>
            <p className="text-[11px] text-[#9A9F94]">
              per {formatDate(data.as_of, "long")}
            </p>
          </div>
        </div>
        <Badge variant={data.status === "final" ? "success" : "warning"}>
          {data.status === "final" ? "Final" : "Draft"}
        </Badge>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-end justify-between gap-3 border-b border-[#F0EBE3] pb-3">
          <span className="text-xs font-semibold text-[#7E8379]">Total Aset</span>
          <span className="text-xl font-bold text-[#1F241D]">
            {formatCurrency(data.totals.total_assets, "IDR")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[#7E8379]">Total Liabilitas</span>
          <span className="font-semibold text-[#4C5348]">
            {formatCurrency(data.totals.total_liabilities, "IDR")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[#7E8379]">Total Ekuitas</span>
          <span className="font-semibold text-[#4C5348]">
            {formatCurrency(data.totals.total_equity, "IDR")}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="rounded-xl bg-[#FAF7F2] p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9A9F94]">
              Aset Lancar
            </p>
            <p className="mt-1 text-xs font-bold text-[#3F463B]">
              {formatCurrency(data.totals.current_assets, "IDR")}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF7F2] p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9A9F94]">
              Liabilitas Lancar
            </p>
            <p className="mt-1 text-xs font-bold text-[#3F463B]">
              {formatCurrency(data.totals.current_liabilities, "IDR")}
            </p>
          </div>
        </div>
      </div>

      {(data.data_quality.warnings ?? []).length > 0 && (
        <ul className="mt-4 space-y-1 rounded-xl bg-amber-50/60 p-3 text-[10px] leading-relaxed text-amber-900">
          {(data.data_quality.warnings ?? []).map((warning, index) => (
            <li key={index}>• {warning}</li>
          ))}
        </ul>
      )}

      <div className="mt-3">
        <LineGroup title="Aset" lines={data.assets} />
        <LineGroup title="Liabilitas" lines={data.liabilities} />
        <LineGroup title="Ekuitas" lines={data.equity} />
      </div>
    </div>
  );
}
