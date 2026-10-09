import type { NextConfig } from "next";

// total.<domínio> serve as páginas de src/app/total na raiz do subdomínio.
const SUBDOMINIO_TOTAL = [{ type: "host" as const, value: "total\\..*" }];

const nextConfig: NextConfig = {
  // Os JSONs em src/data são lidos via fs no servidor; garante que entrem no bundle de deploy.
  outputFileTracingIncludes: {
    "/**": ["./src/data/*.json"],
    "/total/**": ["./src/data/total/*.json"],
  },
  async redirects() {
    // no subdomínio, /total/x vira /x (links antigos ou digitados com o prefixo)
    return [
      { source: "/total", has: SUBDOMINIO_TOTAL, destination: "/", permanent: false },
      { source: "/total/:path*", has: SUBDOMINIO_TOTAL, destination: "/:path*", permanent: false },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", has: SUBDOMINIO_TOTAL, destination: "/total" },
        { source: "/:path((?!_next|total|favicon\\.ico).*)", has: SUBDOMINIO_TOTAL, destination: "/total/:path" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
