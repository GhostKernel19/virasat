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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      icon,
      iconRight,
      isLoading,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    let sizeClasses = "text-sm px-5 py-2.5 rounded-pill gap-2";
    if (size === "sm") {
      sizeClasses = "text-xs px-3.5 py-1.5 rounded-pill gap-1.5";
    } else if (size === "lg") {
      sizeClasses = "text-[15px] sm:text-base px-7 py-3 rounded-pill gap-2.5 font-medium";
    }

    let variantClasses = "";
    switch (variant) {
      case "primary":
        variantClasses =
          "bg-gradient-to-r from-accent to-accent-strong text-bg-0 shadow-glow hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] font-medium transition-all duration-300 ease-soft";
        break;
      case "secondary":
        variantClasses =
          "bg-[rgba(21,9,4,0.45)] backdrop-blur-[10px] text-text border border-[rgba(245,230,211,0.28)] hover:border-text/60 hover:text-text hover:bg-[rgba(21,9,4,0.65)] active:scale-[0.98] font-medium transition-all duration-300 ease-soft";
        break;
      case "outline":
        variantClasses =
          "bg-transparent border border-border hover:border-accent hover:text-accent text-text active:scale-[0.98] font-medium transition-all duration-300 ease-soft";
        break;
      case "ghost":
        variantClasses =
          "bg-transparent text-text-muted hover:text-text hover:bg-surface active:scale-[0.98] font-medium transition-all duration-300 ease-soft";
        break;
      case "link":
        variantClasses =
          "text-accent hover:text-accent-strong underline-offset-4 hover:underline p-0 font-medium transition-all duration-300 ease-soft";
        sizeClasses = "text-sm gap-1";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
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
);
