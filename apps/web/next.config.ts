import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@kotzoeker/db", "@kotzoeker/ui", "@kotzoeker/shared"],
};

export default config;
