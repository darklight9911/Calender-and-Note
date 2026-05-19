"use client";

import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg",
          "bg-canteen-card border border-canteen-border rounded-2xl shadow-2xl animate-bounce-in",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-canteen-border">
            <h2 className="font-display text-xl text-canteen-text">{title}</h2>
            <button
              onClick={onClose}
              className="text-canteen-muted hover:text-canteen-text transition-colors p-1 rounded-lg hover:bg-canteen-border"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </Fragment>
  );
}
