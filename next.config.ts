import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // React Compiler aktif hanya di production.
  // Di dev mode (npm run dev), React Compiler menyebabkan semua dynamic
  // routes ([roomCode]) gagal dikompilasi dan mengembalikan 404.
  reactCompiler: process.env.NODE_ENV === 'production',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
