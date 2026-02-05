import { Loader2 } from "lucide-react";

interface LoadingFallbackProps {
  message?: string;
}

export function LoadingFallback({
  message = "Yükleniyor...",
}: LoadingFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
}
