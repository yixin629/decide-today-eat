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
}

module.exports = nextConfig
