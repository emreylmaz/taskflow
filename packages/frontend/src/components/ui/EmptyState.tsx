/**
 * EmptyState Component
 * Beautiful empty states with illustrations and CTAs
 */

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  FolderOpen,
  Search,
  FileQuestion,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./Button";

type EmptyStateVariant =
  | "empty"
  | "no-results"
  | "error"
  | "no-access"
  | "coming-soon";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

const variantIcons: Record<EmptyStateVariant, LucideIcon> = {
  empty: Inbox,
  "no-results": Search,
  error: AlertCircle,
  "no-access": FolderOpen,
  "coming-soon": FileQuestion,
};

const variantColors: Record<EmptyStateVariant, string> = {
  empty: "text-primary-500",
  "no-results": "text-surface-400",
  error: "text-error-500",
  "no-access": "text-warning-500",
  "coming-soon": "text-accent-500",
};

export function EmptyState({
  variant = "empty",
  icon,
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant];
  const iconColor = variantColors[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center py-12 px-6"
    >
      {/* Illustration Circle */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={`
          w-20 h-20 rounded-full flex items-center justify-center mb-6
          bg-surface-100 dark:bg-surface-800
        `}
      >
        <Icon className={`w-10 h-10 ${iconColor}`} strokeWidth={1.5} />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-surface-500 dark:text-surface-400 max-w-sm mb-6"
        >
          {description}
        </motion.p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {action && (
            <Button variant="primary" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}

      {/* Custom Children */}
      {children && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

// Preset Empty States
export function NoProjectsEmpty({
  onCreateClick,
}: {
  onCreateClick: () => void;
}) {
  return (
    <EmptyState
      variant="empty"
      title="Henüz proje yok"
      description="İlk projenizi oluşturarak başlayın. Projeler, görevlerinizi organize etmenize yardımcı olur."
      action={{
        label: "Proje Oluştur",
        onClick: onCreateClick,
      }}
    />
  );
}

export function NoTasksEmpty({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <EmptyState
      variant="empty"
      title="Liste boş"
      description="Bu listeye henüz görev eklenmemiş. İlk görevi ekleyerek başlayın."
      action={{
        label: "Görev Ekle",
        onClick: onCreateClick,
      }}
    />
  );
}

export function NoSearchResults({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      variant="no-results"
      title="Sonuç bulunamadı"
      description={`"${query}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.`}
      action={{
        label: "Aramayı Temizle",
        onClick: onClear,
      }}
    />
  );
}
