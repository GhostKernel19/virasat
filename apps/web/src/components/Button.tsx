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
  let sizeClasses = "text-sm px-5 py-2.5 rounded-control gap-2";
  if (size === "sm") {
    sizeClasses = "text-xs px-3.5 py-2 rounded-control gap-1.5";
  } else if (size === "lg") {
    sizeClasses = "text-base px-7 py-3 rounded-control gap-2.5";
  }

  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses =
        "bg-accent hover:bg-accent-strong text-bg-0 shadow-soft hover:shadow-glow active:scale-[0.98] font-medium";
      break;
    case "secondary":
      variantClasses =
        "bg-surface-solid hover:bg-surface text-text border border-border hover:border-accent shadow-soft active:scale-[0.98] font-medium";
      break;
    case "outline":
      variantClasses =
        "border border-border hover:border-accent hover:text-accent text-text bg-surface hover:bg-surface-solid shadow-soft font-medium";
      break;
    case "ghost":
      variantClasses =
        "text-text/80 hover:text-text hover:bg-surface font-medium";
      break;
    case "link":
      variantClasses =
        "text-accent hover:text-accent-strong underline-offset-4 hover:underline p-0 font-medium transition-all duration-300 ease-soft";
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
