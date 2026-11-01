import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

// Çıktı yine tek bir çevrimdışı HTML dosyası: spor-defteri.html (CSS ve JS içine gömülü).
// public/ altındakiler (sw.js, manifest, ikonlar, index.html yönlendirmesi) olduğu gibi kopyalanır.
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: "spor-defteri.html" },
  },
  server: { port: 8765, open: "/spor-defteri.html" },
  preview: { port: 8766 },
  test: { include: ["tests/**/*.test.ts"] },
});
