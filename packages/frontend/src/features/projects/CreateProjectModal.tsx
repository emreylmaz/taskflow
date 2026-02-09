/**
 * CreateProjectModal Component
 * Modern animated modal for creating new projects with focus trap
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import type { CreateProjectRequest } from "@taskflow/shared";
import { Button, Input } from "@/components/ui";
import { FocusTrap } from "focus-trap-react";
import { cn } from "@/lib/utils";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectRequest) => Promise<void>;
}

const COLORS = [
  "#6366f1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#3B82F6", // Blue
  "#6B7280", // Gray
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setColor(COLORS[0]);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Proje adı gerekli");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Proje oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            allowOutsideClick: true,
            escapeDeactivates: false,
          }}
        >
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-surface-200 dark:border-surface-700"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-surface-900 dark:text-white"
                >
                  Yeni Proje
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  aria-label="Kapat"
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <X className="w-5 h-5 text-surface-400" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <Input
                    ref={inputRef}
                    label="Proje Adı *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Web Sitesi Yenileme"
                    maxLength={100}
                    error={error || undefined}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Açıklama
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Proje hakkında kısa bir açıklama..."
                    rows={3}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-lg border",
                      "border-surface-300 dark:border-surface-600",
                      "bg-white dark:bg-surface-800",
                      "text-surface-900 dark:text-surface-100",
                      "placeholder:text-surface-400",
                      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                      "resize-none transition-all",
                    )}
                    maxLength={500}
                  />
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Renk
                  </label>
                  <div
                    className="flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label="Proje rengi"
                  >
                    {COLORS.map((c) => (
                      <motion.button
                        key={c}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setColor(c)}
                        role="radio"
                        aria-checked={color === c}
                        aria-label={c}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                          color === c &&
                            "ring-2 ring-offset-2 ring-surface-400 dark:ring-surface-500 dark:ring-offset-surface-800",
                        )}
                        style={{ backgroundColor: c }}
                      >
                        {color === c && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Check
                              className="w-5 h-5 text-white"
                              aria-hidden="true"
                            />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    İptal
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
