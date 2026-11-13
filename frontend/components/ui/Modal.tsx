"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
}: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1F241D]/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-[0_8px_30px_-4px_rgba(44,56,37,0.2)] overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="px-6 py-5 border-b border-[#EBE5DC]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {title && (
                  <h2 className="text-xl font-serif font-semibold text-[#1F241D]">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-[#7E8379]">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-4 text-[#7E8379] hover:text-[#1F241D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
