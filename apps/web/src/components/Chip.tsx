"use client";

import React from "react";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Chip({
  active = false,
  icon,
  className = "",
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-pill text-xs font-medium px-3.5 py-1.5 gap-2 border transition-all duration-300 ease-soft cursor-pointer select-none ${
        active
          ? "bg-accent text-bg-0 border-accent shadow-glow font-semibold"
          : "bg-transparent text-text-muted border-border hover:text-text hover:border-text/40 hover:bg-surface/30"
      } ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

