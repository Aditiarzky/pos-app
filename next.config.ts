import type { NextConfig } from "next";
import os from "os";

const localIPs = Object.values(os.networkInterfaces())
  .flatMap((net) => net || [])
  .filter((net) => net.family === "IPv4" && !net.internal)
  .map((net) => `http://${net.address}:3000`);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: ["192.168.0.104"],
};

export default nextConfig;
