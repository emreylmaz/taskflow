import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { LogIn, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, PageTransition, ThemeToggle } from "@/components/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    "/dashboard";

  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Giriş başarısız";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-surface-900 dark:via-surface-900 dark:to-surface-800 flex items-center justify-center p-4 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <PageTransition className="w-full max-w-md">
        {/* Logo & Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/30"
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            TaskFlow
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-2">
            Hesabına giriş yap
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl dark:shadow-2xl shadow-surface-200/50 p-8 space-y-6 border border-surface-100 dark:border-surface-700"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-error-50 dark:bg-error-500/10 text-error-600 dark:text-error-400 px-4 py-3 rounded-lg text-sm border border-error-200 dark:border-error-500/20"
            >
              {error}
            </motion.div>
          )}

          <Input
            label="E-posta"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
            placeholder="ornek@email.com"
            autoComplete="email"
          />

          <Input
            label="Şifre"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <Button
            type="submit"
            isLoading={loading}
            fullWidth
            size="lg"
            className="mt-2"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>

          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            Hesabın yok mu?{" "}
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Kayıt ol
            </Link>
          </p>
        </motion.form>
      </PageTransition>
    </div>
  );
}
