import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    const id = props.id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[#1F241D] mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-[#EBE5DC] bg-white px-3 py-2 text-sm",
            "text-[#1F241D] placeholder:text-[#7E8379]/60",
            "focus:outline-none focus:ring-2 focus:ring-[#314028] focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#FAF7F2]",
            "transition-all shadow-xs",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          id={id}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-[#7E8379]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
