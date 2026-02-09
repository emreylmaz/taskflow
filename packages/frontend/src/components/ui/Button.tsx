/**
 * Button Component
 * Modern, animated button with multiple variants
 */

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow-md",
  secondary:
    "bg-surface-100 text-surface-900 hover:bg-surface-200 active:bg-surface-300 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700",
  ghost:
    "bg-transparent text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800",
  danger:
    "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 shadow-sm",
  success:
    "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-sm",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      className = "",
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-surface-900
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children as ReactNode}
        {!isLoading && rightIcon}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
