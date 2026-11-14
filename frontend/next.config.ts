import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable component caching and partial prefetching for faster navigation
  cacheComponents: true,
  partialPrefetching: true,
  
  // Optimize images for better performance
  images: {
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
  },

  // Turbopack optimization for faster builds
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*", "lucide-react"],
  },
};

export default nextConfig;
