/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 部署 - 不需要静态导出
  // output: 'export',  // 注释掉，Vercel支持SSR
  // trailingSlash: true,  // 注释掉
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    // Vercel支持图片优化，可以保持这个设置以减少复杂性
    unoptimized: true,
  },
  // 禁用SWC，使用Babel
  swcMinify: false,
  compiler: {
    // 禁用 SWC，使用 Babel
  },
  // 忽略构建错误
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
