// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  // BUILD OPTIMIZATION
  build: {
    target: "es2018",
    minify: "esbuild",
    cssMinify: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunks untuk vendor besar
        manualChunks: {
          // Core React & Router (load priority tertinggi)
          "react-core": [
            "react",
            "react-dom",
            "react-router-dom"
          ],
          
          // React Query (data fetching)
          "react-query": [
            "@tanstack/react-query"
          ],
          
          // Radix UI - Dialog & Form Components (sering dipakai di POS)
          "radix-dialogs": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-popover",
            "@radix-ui/react-dropdown-menu"
          ],
          
          // Radix UI - Form Components
          "radix-forms": [
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-switch",
            "@radix-ui/react-slider"
          ],
          
          // Radix UI - Utility Components (jarang dipakai)
          "radix-utils": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-progress",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group"
          ],
          
          // UI Components (Toast, Tooltip)
          "ui-feedback": [
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "sonner"
          ],
          
          // Heavy libraries (lazy load kalau perlu)
          "charts": ["recharts"],
          "animations": ["lottie-react"],
          "db": ["dexie"],
          
          // Utilities
          "utils": [
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
            "date-fns",
            "zod",
            "@hookform/resolvers",
            "react-hook-form"
          ]
        },
        
        // Naming pattern untuk cache busting
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    
    // Source map hanya untuk production debugging
    sourcemap: false,
  },
  
  server: {
    host: true,
    port: 5173,
  },
  
  // Preview server untuk test production build
  preview: {
    host: true,
    port: 4173,
  },
});
