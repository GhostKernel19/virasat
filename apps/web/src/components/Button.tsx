import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "link";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  isLoading,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  let sizeClasses = "text-sm px-4 py-2 rounded-lg gap-2";
  if (size === "sm") {
    sizeClasses = "text-xs px-3 py-1.5 rounded-lg gap-1.5";
  } else if (size === "lg") {
    sizeClasses = "text-base px-6 py-2.5 rounded-lg gap-2.5";
  }

  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses =
        "bg-terracotta hover:bg-terracotta-dark text-sand shadow-sm hover:shadow transition-all active:scale-[0.98] font-medium";
      break;
    case "secondary":
      variantClasses =
        "bg-indigo hover:bg-indigo-light text-sand shadow-sm hover:shadow transition-all active:scale-[0.98] font-medium";
      break;
    case "outline":
      variantClasses =
        "border border-line hover:border-terracotta hover:text-terracotta text-ink bg-white/80 hover:bg-white shadow-2xs transition-all font-medium";
      break;
    case "ghost":
      variantClasses =
        "text-ink/80 hover:text-ink hover:bg-sand-200/70 transition-colors font-medium";
      break;
    case "link":
      variantClasses =
        "text-terracotta hover:text-terracotta-dark underline-offset-4 hover:underline p-0 font-medium";
      sizeClasses = "text-sm gap-1";
      break;
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="inline-flex shrink-0 items-center">{icon}</span>
      )}
      <span>{children}</span>
      {!isLoading && iconRight && (
        <span className="inline-flex shrink-0 items-center">{iconRight}</span>
      )}
    </button>
  );
}
