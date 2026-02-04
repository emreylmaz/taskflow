import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  // ── Plugins ──────────────────────────────────────────────
  // Vite plugin sistemi ile React ve Tailwind'i entegre ediyoruz.
  // Her plugin, Vite'ın build pipeline'ına hook'lar ekler.
  plugins: [
    react(),         // JSX transform + React Fast Refresh (HMR)
    tailwindcss(),   // Tailwind CSS v4 — artık PostCSS değil, native Vite plugin
  ],

  // ── Path Aliases ─────────────────────────────────────────
  // import { Button } from '@/components/ui/Button' gibi kullanım sağlar.
  // Böylece '../../../components' yerine '@/components' yazarsın.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ── Dev Server ───────────────────────────────────────────
  server: {
    port: 3000,       // Frontend dev server portu
    open: true,       // Tarayıcıyı otomatik aç
    
    // Proxy: Frontend'den /api çağrıları backend'e yönlendirilir.
    // Bu sayede CORS sorunu olmaz ve production'daki yapıyı simüle ederiz.
    // Örnek: fetch('/api/auth/login') → http://localhost:4000/api/auth/login
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },

  // ── Build ────────────────────────────────────────────────
  // Vite production build'de Rollup kullanır.
  // Output dist/ klasörüne gider.
  build: {
    outDir: 'dist',
    sourcemap: true,   // Debug için source map oluştur
  },
})
