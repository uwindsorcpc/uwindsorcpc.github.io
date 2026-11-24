import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build the whole site as static HTML. There is no server or backend:
  // `npm run build` writes plain files to /out, and Vercel serves them.
  output: "export",
  images: { unoptimized: true },
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
