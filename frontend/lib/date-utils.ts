/**
 * Date utility functions for financial periods
 */

export type PeriodType = "MTD" | "QTD" | "YTD";
export type RatioPeriodType = "last_month" | "MTD" | "QTD" | "YTD";

export interface RatioDateRange {
  from: string;
  to: string;
  as_of: string;
  label: string;
}

/**
 * Get date range for a given period type
 */
export function getDateRangeForPeriod(periodType: PeriodType): {
  from: string;
  to: string;
} {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  let from: Date;
  const to = today;

  switch (periodType) {
    case "MTD": // Month to Date
      from = new Date(year, month, 1);
      break;

    case "QTD": // Quarter to Date
      const quarterMonth = Math.floor(month / 3) * 3;
      from = new Date(year, quarterMonth, 1);
      break;

    case "YTD": // Year to Date
      from = new Date(year, 0, 1);
      break;

    default:
      from = new Date(year, month, 1);
  }

  return {
    from: formatDateForAPI(from),
    to: formatDateForAPI(to),
  };
}

/**
 * Format date to YYYY-MM-DD for API
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD to Date object
 */
export function parseDateFromAPI(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date | string): string {
  const d = typeof date === "string" ? parseDateFromAPI(date) : date;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get previous period for comparison
 */
export function getPreviousPeriod(periodType: PeriodType): {
  from: string;
  to: string;
} {
  const current = getDateRangeForPeriod(periodType);
  const currentFrom = parseDateFromAPI(current.from);
  const currentTo = parseDateFromAPI(current.to);

  const daysDiff =
    Math.floor((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const previousTo = new Date(currentFrom);
  previousTo.setDate(previousTo.getDate() - 1);

  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - daysDiff + 1);

  return {
    from: formatDateForAPI(previousFrom),
    to: formatDateForAPI(previousTo),
  };
}

/**
 * Rentang tanggal untuk halaman rasio.
 *
 * `as_of` adalah tanggal snapshot neraca yang dipakai. Untuk bulan lalu,
 * snapshot diambil pada akhir bulan agar seluruh transaksi bulan itu masuk.
 */
export function getDateRangeForRatioPeriod(
  periodType: RatioPeriodType,
): RatioDateRange {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  if (periodType === "last_month") {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    return {
      from: formatDateForAPI(from),
      to: formatDateForAPI(to),
      as_of: formatDateForAPI(to),
      label: from.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    };
  }

  const base = getDateRangeForPeriod(periodType);
  return {
    ...base,
    as_of: formatDateForAPI(today),
    label:
      periodType === "MTD"
        ? "Bulan ini (MTD)"
        : periodType === "QTD"
          ? "Kuartal ini (QTD)"
          : "Tahun ini (YTD)",
  };
}
