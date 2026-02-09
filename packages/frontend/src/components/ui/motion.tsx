/**
 * Motion Components & Utilities
 * Reusable animation presets and animated containers
 */

import { type ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

// ===== Animation Variants =====

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// ===== Animated Components =====

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeInUp}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface ModalTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
}

export function ModalTransition({ children, isOpen }: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface DrawerTransitionProps {
  children: ReactNode;
  isOpen: boolean;
  side?: "left" | "right";
}

export function DrawerTransition({
  children,
  isOpen,
  side = "right",
}: DrawerTransitionProps) {
  const slideVariants = {
    initial: { x: side === "right" ? "100%" : "-100%" },
    animate: { x: 0 },
    exit: { x: side === "right" ? "100%" : "-100%" },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          {/* Drawer */}
          <motion.div
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 ${side}-0 h-full z-50`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
}

export function StaggerList({ children, className = "" }: StaggerListProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated List Item with drag
interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
  layoutId?: string;
}

export function AnimatedListItem({
  children,
  className = "",
  layoutId,
}: AnimatedListItemProps) {
  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
