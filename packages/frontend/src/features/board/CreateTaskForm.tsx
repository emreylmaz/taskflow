/**
 * CreateTaskForm Component
 * Liste altında hızlı task ekleme formu
 */

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface CreateTaskFormProps {
  listId: string;
  onCancel: () => void;
  onSubmit: (title: string) => Promise<void>;
}

export function CreateTaskForm({ onCancel, onSubmit }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(title.trim());
      setTitle("");
      // Keep focus for rapid entry
      inputRef.current?.focus();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="p-2">
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Görev başlığı girin..."
        className="w-full p-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        rows={2}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => handleSubmit()}
          disabled={isSubmitting || !title.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Ekleniyor..." : "Ekle"}
        </button>
        <button
          onClick={onCancel}
          className="p-1 text-gray-500 hover:bg-gray-100 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
