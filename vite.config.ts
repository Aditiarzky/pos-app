import vinext from "vinext";
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ command }) => ({
  plugins: [
    vinext(),
    command === "build" &&
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      }),
  ].filter(Boolean),
  ssr: {
    external: ["cloudinary", "bcryptjs", "jose"],
  },
  optimizeDeps: {
    exclude: ["cloudinary", "bcryptjs", "jose"],
    include: ["qrcode.react", "nprogress", "@neondatabase/serverless"],
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
}));
