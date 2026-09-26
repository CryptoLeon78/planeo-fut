// Build de la app para Capacitor/Android: SPA 100% estática, sin servidor.
// A diferencia de vite.config.ts (que despliega con SSR en Cloudflare Workers),
// aquí se activa el modo "spa" de TanStack Start para que TODA la app —incluida
// la landing, que el APK no necesita— se sirva desde un shell HTML pre-renderizado
// una sola vez en build. El resultado no depende de ningún servidor en runtime,
// igual que el portable de Windows: solo habla con Supabase.
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      spa: { enabled: true, maskPath: "/" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "vendor-radix";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
});
