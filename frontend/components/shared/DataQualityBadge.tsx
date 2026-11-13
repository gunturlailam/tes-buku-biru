import type { DataQualityStatus } from "@/types/financial";
import { cn } from "@/lib/utils";

interface DataQualityBadgeProps {
  status: DataQualityStatus;
  className?: string;
}

const statusConfig: Record<
  DataQualityStatus,
  { label: string; color: string }
> = {
  insufficient: {
    label: "Data Tidak Cukup",
    color: "bg-gray-50 text-gray-600 border-gray-200",
  },
  partial: {
    label: "Data Sebagian",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  usable: {
    label: "Data Dapat Digunakan",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  verified: {
    label: "Data Terverifikasi",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function DataQualityBadge({ status, className }: DataQualityBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold border",
        config.color,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
