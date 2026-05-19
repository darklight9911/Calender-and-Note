import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-canteen-card border border-canteen-border bg-card-shine",
        hover && "transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-ember-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = "Card";
export default Card;
