/**
 * Input Component
 * Modern input with floating label and validation states
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const hasError = !!error;
    const hasSuccess = !!success && !hasError;

    const borderColor = hasError
      ? "border-error-500 focus:border-error-500 focus:ring-error-500"
      : hasSuccess
        ? "border-success-500 focus:border-success-500 focus:ring-success-500"
        : "border-surface-300 focus:border-primary-500 focus:ring-primary-500 dark:border-surface-600";

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2.5 rounded-lg border
              bg-white dark:bg-surface-800
              text-surface-900 dark:text-surface-100
              placeholder:text-surface-400 dark:placeholder:text-surface-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-surface-100 disabled:cursor-not-allowed
              dark:disabled:bg-surface-700
              ${borderColor}
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon || hasError || hasSuccess ? "pr-10" : ""}
            `}
            {...props}
          />
          {(rightIcon || hasError || hasSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError ? (
                <AlertCircle className="w-5 h-5 text-error-500" />
              ) : hasSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-success-500" />
              ) : (
                <span className="text-surface-400">{rightIcon}</span>
              )}
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          {(error || success || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`mt-1.5 text-sm ${
                hasError
                  ? "text-error-500"
                  : hasSuccess
                    ? "text-success-500"
                    : "text-surface-500"
              }`}
            >
              {error || success || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

Input.displayName = "Input";
