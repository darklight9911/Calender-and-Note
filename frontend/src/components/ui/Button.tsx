import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-ember-500 text-white hover:bg-ember-600 active:scale-95 shadow-ember-glow hover:shadow-none":
              variant === "primary",
            "bg-canteen-card border border-canteen-border text-canteen-text hover:border-ember-500/60 hover:bg-canteen-border active:scale-95":
              variant === "secondary",
            "text-canteen-muted hover:text-canteen-text hover:bg-canteen-card active:scale-95":
              variant === "ghost",
            "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 active:scale-95":
              variant === "danger",
          },
          {
            "text-xs px-3 py-1.5": size === "sm",
            "text-sm px-4 py-2":   size === "md",
            "text-base px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
