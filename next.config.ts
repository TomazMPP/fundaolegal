import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Os JSONs em src/data são lidos via fs no servidor; garante que entrem no bundle de deploy.
  outputFileTracingIncludes: {
    "/**": ["./src/data/**/*.json"],
  },
};

export default nextConfig;
