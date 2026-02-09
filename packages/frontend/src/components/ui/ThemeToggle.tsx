/**
 * ThemeToggle Component
 * Dark/Light mode toggle with smooth animation
 */

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { button: "w-8 h-8", icon: "w-4 h-4" },
  md: { button: "w-10 h-10", icon: "w-5 h-5" },
  lg: { button: "w-12 h-12", icon: "w-6 h-6" },
};

export function ThemeToggle({ size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { button, icon } = sizes[size];

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        ${button} rounded-full flex items-center justify-center
        bg-surface-100 dark:bg-surface-800
        hover:bg-surface-200 dark:hover:bg-surface-700
        text-surface-600 dark:text-surface-300
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-surface-900
      `}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {isDark ? <Moon className={icon} /> : <Sun className={icon} />}
      </motion.div>
    </motion.button>
  );
}

// Switch variant for settings pages
export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-14 h-8 rounded-full transition-colors duration-300
        ${isDark ? "bg-primary-600" : "bg-surface-300"}
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-surface-900
      `}
      role="switch"
      aria-checked={isDark}
      aria-label="Koyu tema"
    >
      {/* Track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5">
        <Sun className="w-4 h-4 text-amber-400" />
        <Moon className="w-4 h-4 text-surface-200" />
      </div>

      {/* Thumb */}
      <motion.div
        layout
        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
        animate={{ left: isDark ? "calc(100% - 28px)" : "4px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
