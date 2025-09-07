/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    // Remove problematic package optimizations
    optimizePackageImports: [],
  },
  webpack: (config, { isServer }) => {
    // Workaround for React Server Components bundler issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'logos.stockanalysis.com',
        port: '',
        pathname: '/symbols/**',
      },
    ],
  },
};

module.exports = nextConfig;
