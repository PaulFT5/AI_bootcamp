import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components left off: app pages read Postgres per request (requireUser() calls connection()).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
