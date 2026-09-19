/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.BACKEND_URL || 'https://api.toan6789.vn'}/uploads/:path*`, // Proxy to Backend
      },
    ]
  },
}

export default nextConfig
