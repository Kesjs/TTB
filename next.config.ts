import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'lanation.bj',
      },
      {
        protocol: 'https',
        hostname: 'oukoikan.com',
      },
      {
        protocol: 'https',
        hostname: 'files.sbcdnsb.com',
      },
      {
        protocol: 'https',
        hostname: 'ietzgjbykkwkemakwfqf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'i.lepelerin.com',
      },
    ],
  },
};

export default nextConfig;
