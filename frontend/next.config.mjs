/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/uploads/:path*`, // Proxy to Backend
      },
    ]
  },
}

export default nextConfig
