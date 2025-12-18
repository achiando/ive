import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdie.co.ke',
        port: '',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        
      },
    ],
  },
};

export default nextConfig;
