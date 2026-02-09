import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus, User, Mail, Lock, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Input, PageTransition, ThemeToggle } from "@/components/ui";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kayıt başarısız";
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
            whileHover={{ scale: 1.05, rotate: -3 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-700 rounded-2xl mb-4 shadow-lg shadow-accent-500/30"
          >
            <UserPlus className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            TaskFlow
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-2">
            Yeni hesap oluştur
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl dark:shadow-2xl shadow-surface-200/50 p-8 space-y-5 border border-surface-100 dark:border-surface-700"
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
            label="Ad Soyad"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-5 h-5" />}
            placeholder="Emre Yılmaz"
            autoComplete="name"
          />

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
            placeholder="En az 8 karakter"
            hint="En az 8 karakter olmalı"
            autoComplete="new-password"
          />

          <Input
            label="Şifre Tekrar"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<KeyRound className="w-5 h-5" />}
            placeholder="Şifreyi tekrar gir"
            error={
              confirmPassword && password !== confirmPassword
                ? "Şifreler eşleşmiyor"
                : undefined
            }
            autoComplete="new-password"
          />

          <Button
            type="submit"
            isLoading={loading}
            fullWidth
            size="lg"
            className="mt-2"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </Button>

          <p className="text-center text-sm text-surface-500 dark:text-surface-400">
            Zaten hesabın var mı?{" "}
            <Link
              to="/login"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Giriş yap
            </Link>
          </p>
        </motion.form>
      </PageTransition>
    </div>
  );
}
