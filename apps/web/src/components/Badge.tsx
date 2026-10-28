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
      ? "text-[11px] px-2 py-0.5 gap-1"
      : "text-xs px-3 py-1 gap-1.5";

  let variantClasses = "";

  switch (variant) {
    case "filterActive":
      variantClasses =
        "bg-ink text-sand border border-ink shadow-sm font-medium";
      break;
    case "filter":
      variantClasses =
        "bg-sand border border-line text-ink/80 hover:text-ink hover:border-ink/30 transition-all font-normal";
      break;
    case "ocr":
      variantClasses =
        "bg-white/80 border border-green/30 text-green font-medium shadow-2xs";
      break;
    case "illustrative":
      variantClasses =
        "bg-gold/15 border border-gold/40 text-gold-dark font-medium tracking-wider uppercase text-[10px]";
      break;
    case "terracotta":
      variantClasses =
        "bg-terracotta/10 border border-terracotta/20 text-terracotta font-medium";
      break;
    case "indigo":
      variantClasses =
        "bg-indigo/10 border border-indigo/20 text-indigo font-medium";
      break;
    case "gold":
      variantClasses =
        "bg-gold/15 border border-gold/30 text-gold-dark font-medium";
      break;
    case "outline":
      variantClasses =
        "border border-line text-ink/70 bg-transparent";
      break;
    case "default":
    default:
      variantClasses =
        "bg-sand-200/80 border border-line text-ink";
      break;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full transition-colors select-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
