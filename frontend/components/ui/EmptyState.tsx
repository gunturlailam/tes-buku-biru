import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#7E8379]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#1F241D] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#7E8379] max-w-md mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
