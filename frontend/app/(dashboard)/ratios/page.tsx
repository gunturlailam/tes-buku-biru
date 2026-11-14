"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import { getErrorMessage } from "@/lib/api-client";
import {
  getDateRangeForRatioPeriod,
  formatDateForDisplay,
  type RatioPeriodType,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export const instant = false;
import { BalanceSheetPanel } from "@/features/ratios/components/BalanceSheetPanel";
import { RatioCard } from "@/features/ratios/components/RatioCard";
import { RatioSummary } from "@/features/ratios/components/RatioSummary";
import {
  RATIO_CATEGORY_DESCRIPTION,
  RATIO_CATEGORY_LABEL,
  RATIO_CATEGORY_ORDER,
} from "@/features/ratios/ratio-format";
import {
  useBalanceSheet,
  useExplainRatio,
  useRatios,
} from "@/features/ratios/hooks/use-ratios";
import type { RatioExplainResponse } from "@/types/ratios";
import { BarChart3, Info, RefreshCw, ShieldCheck } from "lucide-react";

const PERIOD_OPTIONS: Array<{ value: RatioPeriodType; label: string }> = [
  { value: "last_month", label: "Bulan lalu" },
  { value: "MTD", label: "MTD" },
  { value: "QTD", label: "QTD" },
  { value: "YTD", label: "YTD" },
];

export default function RatiosPage() {
  const [periodType, setPeriodType] = useState<RatioPeriodType>("last_month");
  const range = useMemo(
    () => getDateRangeForRatioPeriod(periodType),
    [periodType],
  );
  const queryParams = useMemo(
    () => ({ from: range.from, to: range.to, as_of: range.as_of }),
    [range.from, range.to, range.as_of],
  );
  const periodKey = `${range.from}_${range.to}_${range.as_of}`;

  const ratiosQuery = useRatios(queryParams);
  const balanceQuery = useBalanceSheet(range.as_of);
  const explainMutation = useExplainRatio(queryParams);

  const [explanationsByPeriod, setExplanationsByPeriod] = useState<
    Record<string, Record<string, RatioExplainResponse>>
  >({});
  const [explainErrors, setExplainErrors] = useState<Record<string, string>>(
    {},
  );

  const explanations = explanationsByPeriod[periodKey] ?? {};
  const explainError = explainErrors[periodKey] ?? "";

  const data = ratiosQuery.data;
  const warnings = data?.data_quality.warnings ?? [];
  const isRefreshing = ratiosQuery.isFetching || balanceQuery.isFetching;

  const handleExplain = (code: string) => {
    setExplainErrors((previous) => ({ ...previous, [periodKey]: "" }));
    explainMutation.mutate(code, {
      onSuccess: (result) => {
        setExplanationsByPeriod((previous) => ({
          ...previous,
          [periodKey]: {
            ...(previous[periodKey] ?? {}),
            [code]: result,
          },
        }));
      },
      onError: (error) => {
        setExplainErrors((previous) => ({
          ...previous,
          [periodKey]: getErrorMessage(error),
        }));
      },
    });
  };

  const handleRefresh = () => {
    void ratiosQuery.refetch();
    void balanceQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#1F241D]">Rasio CFO</h1>
            {data && <DataQualityBadge status={data.data_quality.status} />}
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#7E8379]">
            Analisis likuiditas, solvabilitas, aktivitas, profitabilitas, dan
            pertumbuhan dari neraca serta transaksi. Semua angka dihitung oleh
            engine deterministik di backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#EBE5DC] bg-white p-1 shadow-sm">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriodType(option.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  periodType === option.value
                    ? "bg-[#273420] text-white shadow-sm"
                    : "text-[#666A61] hover:bg-[#FAF7F2] hover:text-[#1F241D]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            />
            Perbarui
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9A9F94]">
        <span>
          Periode{" "}
          <span className="font-semibold text-[#4C5348]">
            {formatDateForDisplay(range.from)} –{" "}
            {formatDateForDisplay(range.to)}
          </span>
        </span>
        <span>
          Snapshot neraca{" "}
          <span className="font-semibold text-[#4C5348]">
            {formatDateForDisplay(range.as_of)}
          </span>
        </span>
        <span className="font-mono text-[10px]">
          formula v{data?.formula_version ?? "—"}
        </span>
      </div>

      {ratiosQuery.error && (
        <Alert variant="error" title="Rasio gagal dimuat">
          <p>{getErrorMessage(ratiosQuery.error)}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={handleRefresh}
          >
            Coba lagi
          </Button>
        </Alert>
      )}

      {explainError && (
        <Alert variant="error" title="Narasi AI gagal dimuat">
          {explainError}
        </Alert>
      )}

      {ratiosQuery.isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border border-[#EBE5DC]/70 bg-white"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonCard key={item} />
            ))}
          </div>
        </div>
      )}

      {!ratiosQuery.isLoading && !ratiosQuery.error && !data && (
        <EmptyState
          icon={BarChart3}
          title="Rasio belum tersedia"
          description="Belum ada data yang cukup untuk periode ini. Lengkapi transaksi dan snapshot neraca terlebih dahulu."
        />
      )}

      {data && (
        <>
          <RatioSummary ratios={data.ratios} />

          {warnings.length > 0 && (
            <Alert
              variant={
                data.data_quality.status === "usable" ? "info" : "warning"
              }
              title="Catatan kualitas data"
            >
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              {RATIO_CATEGORY_ORDER.map((category) => {
                const items = data.ratios.filter(
                  (ratio) => ratio.category === category,
                );
                if (items.length === 0) return null;

                return (
                  <section key={category}>
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-[#1F241D]">
                          {RATIO_CATEGORY_LABEL[category]}
                        </h2>
                        <p className="text-xs text-[#9A9F94]">
                          {RATIO_CATEGORY_DESCRIPTION[category]}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#A0A59B]">
                        {items.length} rasio
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {items.map((ratio) => (
                        <RatioCard
                          key={ratio.code}
                          ratio={ratio}
                          explanation={explanations[ratio.code]}
                          isExplaining={
                            explainMutation.isPending &&
                            explainMutation.variables === ratio.code
                          }
                          onExplain={handleExplain}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <aside className="space-y-4 lg:col-span-4">
              <BalanceSheetPanel
                data={balanceQuery.data}
                isLoading={balanceQuery.isLoading}
                error={
                  balanceQuery.error
                    ? getErrorMessage(balanceQuery.error)
                    : undefined
                }
              />

              <div className="rounded-2xl border border-[#EBE5DC]/70 bg-gradient-to-br from-[#273420] to-[#1B2417] p-5 text-white shadow-[0_2px_16px_rgba(39,52,32,0.12)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <h3 className="text-sm font-bold">Cara membaca</h3>
                </div>
                <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-gray-300">
                  <li>
                    Angka rasio berasal dari engine deterministik, bukan dari
                    model bahasa.
                  </li>
                  <li>
                    LLM hanya menulis narasi dari kode rasio, band, arah, dan
                    kualitas data. Tidak ada nominal atau identitas yang dikirim.
                  </li>
                  <li>
                    INV_TURN, TATO, ROA, dan ROE disetahunkan agar sebanding
                    dengan threshold tahunan. Nilai periode pendek bisa
                    fluktuatif.
                  </li>
                  <li>
                    Jika data tidak lengkap, nilai ditampilkan sebagai tidak
                    tersedia beserta alasannya.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-[#EBE5DC]/70 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-[#7E8379]" />
                  <h3 className="text-sm font-bold text-[#1F241D]">
                    Sumber data
                  </h3>
                </div>
                <dl className="mt-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#9A9F94]">Status snapshot</dt>
                    <dd className="font-semibold text-[#4C5348]">
                      {data.source.snapshot_status}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#9A9F94]">Transaksi periode</dt>
                    <dd className="font-semibold text-[#4C5348]">
                      {data.source.transaction_count}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#9A9F94]">Snapshot ID</dt>
                    <dd className="font-mono font-semibold text-[#4C5348]">
                      {data.source.snapshot_id ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[#9A9F94]">Formula</dt>
                    <dd className="font-mono font-semibold text-[#4C5348]">
                      v{data.formula_version}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
