/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 新特性: 部分预渲染 (PPR)
  experimental: {
    ppr: 'incremental',
  },
  // 允许后端 API 图片
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3003' },
    ],
  },
}

module.exports = nextConfig
