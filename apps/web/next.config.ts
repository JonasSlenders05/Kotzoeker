import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@kotzoeker/db", "@kotzoeker/ui", "@kotzoeker/shared"],
  images: {
    // De browser maakt al webp op de juiste maat, dus Next hoeft niets meer te optimaliseren.
    // Zo is er ook geen remotePatterns nodig en werkt de lokale Supabase op 127.0.0.1.
    unoptimized: true,
  },
};

export default config;
