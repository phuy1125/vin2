import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['scontent.fsgn2-3.fna.fbcdn.net'], // Thêm domain vào danh sách
  },
  eslint: {
    ignoreDuringBuilds: true, // Tắt kiểm tra ESLint trong quá trình build
  },
};

export default nextConfig;
