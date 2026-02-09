/**
 * UI Components Index
 * Central export for all design system components
 */

// Core Components
export { Button } from "./Button";
export { Input } from "./Input";
export { Card, CardHeader } from "./Card";
export {
  Skeleton,
  SkeletonCard,
  SkeletonListItem,
  SkeletonTable,
} from "./Skeleton";
export {
  EmptyState,
  NoProjectsEmpty,
  NoTasksEmpty,
  NoSearchResults,
} from "./EmptyState";
export { ThemeToggle, ThemeSwitch } from "./ThemeToggle";
export { Toaster, toast } from "./Toast";

// Motion Components & Utilities
export {
  // Variants
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  staggerContainer,
  staggerItem,
  // Components
  PageTransition,
  ModalTransition,
  DrawerTransition,
  StaggerList,
  StaggerItem,
  AnimatedListItem,
} from "./motion";
