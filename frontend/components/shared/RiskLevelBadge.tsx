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
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle,
  },
  attention: {
    label: "Perhatian",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: AlertCircle,
  },
  critical: {
    label: "Kritis",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: AlertTriangle,
  },
  insufficient: {
    label: "Data Tidak Cukup",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: HelpCircle,
  },
};

export function RiskLevelBadge({
  level,
  className,
  showIcon = true,
}: RiskLevelBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.color,
        className,
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
