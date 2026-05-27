/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backendApiUrl = process.env.BACKEND_API_URL ?? 'http://localhost:4000';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendApiUrl}/api/v1/:path*`
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendApiUrl}/socket.io/:path*`
      }
    ];
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;