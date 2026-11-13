"use client";

import { Card } from "@/components/ui/Card";
import { DataQualityBadge } from "@/components/shared/DataQualityBadge";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { ProfitLossReport } from "@/types/financial";
import { AlertCircle } from "lucide-react";

interface ProfitLossReportProps {
  data: ProfitLossReport;
}

export function ProfitLossReport({ data }: ProfitLossReportProps) {
  const { period, currency, data_quality, items, ratios } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1F241D]">
            Laporan Laba Rugi
          </h2>
          <p className="text-sm text-[#7E8379] mt-1">
            Periode: {period.from} s/d {period.to} • {currency}
          </p>
        </div>
        <DataQualityBadge status={data_quality.status} />
      </div>

      {data_quality.warnings && data_quality.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">
                Peringatan Data:
              </h4>
              <ul className="mt-1 text-xs text-yellow-700 space-y-0.5">
                {data_quality.warnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EBE5DC]/70 shadow-[0_2px_16px_rgba(39,52,32,0.03)] divide-y divide-[#EBE5DC]/50">
        <div className="p-5">
          <h3 className="text-xs font-semibold text-[#7E8379] uppercase tracking-wider mb-4">
            Pendapatan
          </h3>
          
          {items.gross_sales && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[#666A61]">Penjualan Kotor</span>
              <span className="text-sm font-medium text-[#1F241D]">
                {items.gross_sales.status === "available"
                  ? formatCurrency(items.gross_sales.value, currency)
                  : items.gross_sales.reason || "-"}
              </span>
            </div>
          )}

          {items.sales_returns && items.sales_returns.status === "available" && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[#666A61]">Retur Penjualan</span>
              <span className="text-sm font-medium text-red-600">
                ({formatCurrency(items.sales_returns.value, currency)})
              </span>
            </div>
          )}

          {items.sales_discounts && items.sales_discounts.status === "available" && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[#666A61]">Diskon Penjualan</span>
              <span className="text-sm font-medium text-red-600">
                ({formatCurrency(items.sales_discounts.value, currency)})
              </span>
            </div>
          )}

          <div className="border-t border-[#EBE5DC] my-3"></div>

          <div className="flex justify-between items-center py-2">
            <span className="text-base font-semibold text-[#1F241D]">
              Pendapatan Bersih
            </span>
            <span className="text-lg font-serif font-bold text-[#273420]">
              {items.net_revenue.status === "available"
                ? formatCurrency(items.net_revenue.value, currency)
                : items.net_revenue.reason || "-"}
            </span>
          </div>
        </div>

        {items.cogs && (
          <div className="p-5">
            <h3 className="text-xs font-semibold text-[#7E8379] uppercase tracking-wider mb-4">
              Harga Pokok Penjualan
            </h3>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[#666A61]">COGS</span>
              <span className="text-sm font-medium text-red-600">
                {items.cogs.status === "available"
                  ? `(${formatCurrency(items.cogs.value, currency)})`
                  : items.cogs.reason || "-"}
              </span>
            </div>

            {items.gross_profit && (
              <>
                <div className="border-t border-[#EBE5DC] my-3"></div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-semibold text-[#1F241D]">
                    Laba Kotor
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-serif font-bold text-[#273420] block">
                      {items.gross_profit.status === "available"
                        ? formatCurrency(items.gross_profit.value, currency)
                        : items.gross_profit.reason || "-"}
                    </span>
                    {ratios?.gross_margin && ratios.gross_margin.status === "available" && (
                      <span className="text-xs text-[#7E8379]">
                        Margin: {formatPercentage(ratios.gross_margin.value)}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-5">
          <h3 className="text-xs font-semibold text-[#7E8379] uppercase tracking-wider mb-4">
            Beban Operasional
          </h3>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-[#666A61]">Total Beban Operasional</span>
            <span className="text-sm font-medium text-red-600">
              {items.operating_expenses.status === "available"
                ? `(${formatCurrency(items.operating_expenses.value, currency)})`
                : items.operating_expenses.reason || "-"}
            </span>
          </div>

          {items.operating_profit && (
            <>
              <div className="border-t border-[#EBE5DC] my-3"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base font-semibold text-[#1F241D]">
                  Laba Operasional
                </span>
                <div className="text-right">
                  <span className="text-lg font-serif font-bold text-[#273420] block">
                    {items.operating_profit.status === "available"
                      ? formatCurrency(items.operating_profit.value, currency)
                      : items.operating_profit.reason || "-"}
                  </span>
                  {ratios?.operating_margin && ratios.operating_margin.status === "available" && (
                    <span className="text-xs text-[#7E8379]">
                      Margin: {formatPercentage(ratios.operating_margin.value)}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {(items.other_income || items.finance_cost || items.tax_expense) && (
          <div className="p-5">
            <h3 className="text-xs font-semibold text-[#7E8379] uppercase tracking-wider mb-4">
              Pendapatan & Beban Lainnya
            </h3>

            {items.other_income && items.other_income.status === "available" && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#666A61]">Pendapatan Lain-lain</span>
                <span className="text-sm font-medium text-emerald-600">
                  {formatCurrency(items.other_income.value, currency)}
                </span>
              </div>
            )}

            {items.finance_cost && items.finance_cost.status === "available" && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#666A61]">Beban Keuangan</span>
                <span className="text-sm font-medium text-red-600">
                  ({formatCurrency(items.finance_cost.value, currency)})
                </span>
              </div>
            )}

            {items.tax_expense && items.tax_expense.status === "available" && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#666A61]">Beban Pajak</span>
                <span className="text-sm font-medium text-red-600">
                  ({formatCurrency(items.tax_expense.value, currency)})
                </span>
              </div>
            )}
          </div>
        )}

        <div className="p-5 bg-[#FAF7F2]">
          <div className="flex justify-between items-center py-2">
            <span className="text-lg font-serif font-bold text-[#1F241D]">
              Laba Bersih
            </span>
            <div className="text-right">
              <span className="text-2xl font-serif font-bold text-[#273420] block">
                {items.net_profit.status === "available"
                  ? formatCurrency(items.net_profit.value, currency)
                  : items.net_profit.reason || "-"}
              </span>
              {ratios?.net_margin && ratios.net_margin.status === "available" && (
                <span className="text-sm text-[#7E8379] font-medium">
                  Net Margin: {formatPercentage(ratios.net_margin.value)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-[#7E8379] flex items-center justify-between">
        <span>Formula v{data.formula_version}</span>
        <span>Generated: {new Date(data.generated_at).toLocaleString("id-ID")}</span>
      </div>
    </div>
  );
}
