import type { RiskLevel } from "@/types/financial";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface RiskLevelBadgeProps {
  level: RiskLevel;
  className?: string;
  showIcon?: boolean;
}

const levelConfig: Record<
  RiskLevel,
  { label: string; color: string; icon: typeof AlertCircle }
> = {
  normal: {
    label: "Normal",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  attention: {
    label: "Perhatian",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: AlertCircle,
  },
  critical: {
    label: "Kritis",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertTriangle,
  },
  insufficient: {
    label: "Data Tidak Cukup",
    color: "bg-gray-50 text-gray-600 border-gray-200",
    icon: HelpCircle,
  },
};

export function RiskLevelBadge({
  level,
  className,
  showIcon = false,
}: RiskLevelBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border",
        config.color,
        className,
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
