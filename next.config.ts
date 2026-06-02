import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io', '*.ngrok.app'],
  serverExternalPackages: ['better-auth', '@better-auth/kysely-adapter', 'kysely', '@react-email/render', 'prettier'],
};

export default nextConfig;
