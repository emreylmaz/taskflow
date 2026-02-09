/**
 * Skeleton Component
 * Loading placeholder with pulse animation
 */

import { type HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  lines = 1,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const baseClass = "animate-skeleton bg-surface-200 dark:bg-surface-700";

  const variantStyles = {
    text: "rounded-md h-4",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-lg",
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${variantStyles.text}`}
            style={{
              width: i === lines - 1 ? "80%" : width || "100%",
              height: height || undefined,
              ...style,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClass} ${variantStyles[variant]} ${className}`}
      style={{
        width: width || (variant === "circular" ? "40px" : "100%"),
        height:
          height ||
          (variant === "circular"
            ? width || "40px"
            : variant === "text"
              ? "16px"
              : "100px"),
        ...style,
      }}
      {...props}
    />
  );
}

// Pre-built skeleton compositions
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl p-5 border border-surface-200 dark:border-surface-700">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton width="60%" height={16} className="mb-2" />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton variant="circular" width={32} height={32} />
      <div className="flex-1">
        <Skeleton width="70%" height={14} className="mb-1.5" />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton variant="rounded" width={24} height={24} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-surface-200 dark:border-surface-700">
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={14} />
        <Skeleton width="25%" height={14} />
        <Skeleton width="15%" height={14} />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2">
          <Skeleton width="30%" height={16} />
          <Skeleton width="20%" height={16} />
          <Skeleton width="25%" height={16} />
          <Skeleton width="15%" height={16} />
        </div>
      ))}
    </div>
  );
}
