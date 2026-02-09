/**
 * Card Component
 * Modern card with hover effects and variants
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type CardVariant = "default" | "elevated" | "outlined" | "filled";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: CardVariant;
  hoverable?: boolean;
  clickable?: boolean;
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  colorBar?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm",
  elevated: "bg-white dark:bg-surface-800 shadow-md hover:shadow-lg",
  outlined:
    "bg-transparent border-2 border-surface-200 dark:border-surface-700",
  filled: "bg-surface-100 dark:bg-surface-800",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      hoverable = false,
      clickable = false,
      children,
      header,
      footer,
      colorBar,
      className = "",
      ...props
    },
    ref,
  ) => {
    const hoverAnimation = hoverable || clickable ? { y: -2 } : undefined;

    return (
      <motion.div
        ref={ref}
        whileHover={hoverAnimation}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`
          rounded-xl overflow-hidden
          transition-shadow duration-200
          ${variantStyles[variant]}
          ${hoverable ? "hover:shadow-lg" : ""}
          ${clickable ? "cursor-pointer" : ""}
          ${className}
        `}
        {...props}
      >
        {colorBar && (
          <div className="h-1.5" style={{ backgroundColor: colorBar }} />
        )}
        {header && (
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-700">
            {header}
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
            {footer}
          </div>
        )}
      </motion.div>
    );
  },
);

Card.displayName = "Card";

// Card Header Component
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = "",
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between ${className}`}
      {...props}
    >
      <div>
        <h3 className="font-semibold text-surface-900 dark:text-surface-100">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
