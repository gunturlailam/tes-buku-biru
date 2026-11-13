import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 flex items-start gap-3",
  {
    variants: {
      variant: {
        info: "bg-blue-50 border-blue-200 text-blue-900",
        success: "bg-emerald-50 border-emerald-200 text-emerald-900",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
        error: "bg-red-50 border-red-200 text-red-900",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    const Icon = iconMap[variant || "info"];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          {title && (
            <h5 className="font-semibold text-sm leading-none tracking-tight">
              {title}
            </h5>
          )}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert, alertVariants };
