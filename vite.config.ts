import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { serwist } from "@serwist/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    vinext(),
     serwist({
      swSrc: "src/sw.ts",
      swDest: "sw.js",
      globDirectory: "dist/client",
      injectionPoint: "self.__SW_MANIFEST",
      rollupFormat: "iife",
      globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"],
    }),
    command === "build" &&
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      }),
  ].filter(Boolean),
  ssr: {
    external: ["cloudinary", "bcryptjs", "jose", "pg"],
  },
  optimizeDeps: {
    exclude: ["cloudinary", "bcryptjs", "jose", "pg-native"],
    include: ["qrcode.react", "nprogress", "@neondatabase/serverless"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
}));
