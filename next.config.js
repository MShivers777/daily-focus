/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export',
    images: { unoptimized: true },
    basePath: '/daily-focus',
    assetPrefix: '/daily-focus/',
  } : {
    // Development config
    images: { unoptimized: true },
  })
}

module.exports = nextConfig
