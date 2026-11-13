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
    color: "bg-gray-100 text-gray-700 border-gray-300",
  },
  partial: {
    label: "Data Sebagian",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  usable: {
    label: "Data Dapat Digunakan",
    color: "bg-blue-100 text-blue-700 border-blue-300",
  },
  verified: {
    label: "Data Terverifikasi",
    color: "bg-green-100 text-green-700 border-green-300",
  },
};

export function DataQualityBadge({ status, className }: DataQualityBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.color,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
