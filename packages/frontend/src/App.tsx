import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "@/components/ui/Toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingFallback } from "./components/LoadingFallback";

// Code splitting with React.lazy
const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const RegisterPage = lazy(() => import("./features/auth/RegisterPage"));
const ProjectsPage = lazy(() => import("./features/projects/ProjectsPage"));
const BoardPage = lazy(() => import("./features/board/BoardPage"));

// Initialize theme on app load
function ThemeInitializer() {
  useEffect(() => {
    const stored = localStorage.getItem("taskflow-theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    document.documentElement.classList.add(theme);
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeInitializer />
        <Toaster />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <BoardPage />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route
              path="/dashboard"
              element={<Navigate to="/projects" replace />}
            />
            <Route path="/" element={<Navigate to="/projects" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
