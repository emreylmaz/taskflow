/**
 * CreateListButton Component
 * Board'a yeni liste ekleme butonu ve formu
 */

import { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface CreateListButtonProps {
  onCreate: (name: string) => Promise<void>;
}

export function CreateListButton({ onCreate }: CreateListButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreate(name.trim());
      setName("");
      setIsAdding(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsAdding(false);
      setName("");
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 w-72 h-12 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 font-medium transition shrink-0"
      >
        <Plus className="w-5 h-5" />
        Başka liste ekle
      </button>
    );
  }

  return (
    <div className="w-72 bg-gray-100 rounded-xl p-2 shrink-0">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Liste adı girin..."
          className="w-full px-3 py-2 text-sm border border-transparent focus:border-indigo-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "Ekleniyor..." : "Liste Ekle"}
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
