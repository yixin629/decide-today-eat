/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // 如果 SWC 加载失败，使用 Babel 作为后备
  swcMinify: false,
  compiler: {
    // 禁用 SWC，使用 Babel
  },
}

module.exports = nextConfig
