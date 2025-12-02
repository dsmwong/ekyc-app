/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'serverless-functions/assets',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
