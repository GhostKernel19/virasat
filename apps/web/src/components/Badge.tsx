import React from "react";

export type BadgeVariant =
  | "default"
  | "filter"
  | "filterActive"
  | "ocr"
  | "illustrative"
  | "terracotta"
  | "indigo"
  | "gold"
  | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2.5 py-1 gap-1"
      : "text-xs px-3.5 py-1.5 gap-1.5";

  let variantClasses = "";

  switch (variant) {
    case "filterActive":
      variantClasses =
        "bg-accent text-bg-0 border border-accent shadow-glow font-medium";
      break;
    case "filter":
      variantClasses =
        "bg-surface border border-border text-text/80 hover:text-text hover:border-accent/40 font-normal";
      break;
    case "ocr":
      variantClasses =
        "bg-surface border border-success/30 text-success font-medium";
      break;
    case "illustrative":
      variantClasses =
        "bg-accent-2/15 border border-accent-2/40 text-accent-2 font-medium tracking-wider uppercase text-[10px]";
      break;
    case "terracotta":
      variantClasses =
        "bg-accent/15 border border-accent/30 text-accent font-medium";
      break;
    case "indigo":
      variantClasses =
        "bg-accent/15 border border-accent/30 text-accent font-medium";
      break;
    case "gold":
      variantClasses =
        "bg-accent-2/15 border border-accent-2/30 text-accent-2 font-medium";
      break;
    case "outline":
      variantClasses =
        "border border-border text-text-muted bg-transparent";
      break;
    case "default":
    default:
      variantClasses =
        "bg-surface-solid border border-border text-text";
      break;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-pill transition-all duration-300 ease-soft select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
