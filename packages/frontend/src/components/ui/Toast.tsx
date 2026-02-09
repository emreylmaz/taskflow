/**
 * Toast Configuration
 * Enhanced toast styling for sonner
 */

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/hooks/useTheme";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: `
            group
            bg-white dark:bg-surface-800
            text-surface-900 dark:text-surface-100
            border border-surface-200 dark:border-surface-700
            shadow-lg rounded-xl
            px-4 py-3
          `,
          title: "font-semibold text-sm",
          description: "text-sm text-surface-500 dark:text-surface-400 mt-1",
          actionButton: `
            bg-primary-600 text-white
            hover:bg-primary-700
            px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors
          `,
          cancelButton: `
            bg-surface-100 dark:bg-surface-700
            text-surface-600 dark:text-surface-300
            hover:bg-surface-200 dark:hover:bg-surface-600
            px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors
          `,
          success: `
            !bg-success-50 dark:!bg-success-500/10
            !border-success-200 dark:!border-success-500/30
            [&>[data-icon]]:text-success-500
          `,
          error: `
            !bg-error-50 dark:!bg-error-500/10
            !border-error-200 dark:!border-error-500/30
            [&>[data-icon]]:text-error-500
          `,
          warning: `
            !bg-warning-50 dark:!bg-warning-500/10
            !border-warning-200 dark:!border-warning-500/30
            [&>[data-icon]]:text-warning-500
          `,
          info: `
            !bg-primary-50 dark:!bg-primary-500/10
            !border-primary-200 dark:!border-primary-500/30
            [&>[data-icon]]:text-primary-500
          `,
        },
      }}
      closeButton
      richColors
      expand
    />
  );
}

// Re-export toast function for convenience
export { toast } from "sonner";
