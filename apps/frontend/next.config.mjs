/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@lift-saas/shared-types'],
  eslint: {
    dirs: ['src']
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com'
      }
    ]
  }
};

export default nextConfig;
