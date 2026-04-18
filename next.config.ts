import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/khiemvuong/deception-assets/**",
      },
    ],
  },
};

export default nextConfig;

