import vinext from "vinext";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [vinext()],
  ssr: {
    external: ["pg", "pg-native", "cloudinary", "bcryptjs", "jose"],
  },
  optimizeDeps: {
    exclude: ["pg", "pg-native", "cloudinary", "bcryptjs", "jose"],
    include: ["qrcode.react", "nprogress"],
  },
  resolve: {
    alias: {
      "pg-native": "./src/lib/pg-native-shim.ts",
    },
  },
});
