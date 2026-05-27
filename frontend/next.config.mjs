/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const backendApiUrl = (process.env.BACKEND_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

    return {
      beforeFiles: [
        {
          source: '/api/v1/:path*',
          destination: `${backendApiUrl}/api/v1/:path*`
        },
        {
          source: '/socket.io',
          destination: `${backendApiUrl}/socket.io/`
        },
        {
          source: '/socket.io/',
          destination: `${backendApiUrl}/socket.io/`
        },
        {
          source: '/socket.io/:path*',
          destination: `${backendApiUrl}/socket.io/:path*`
        }
      ]
    };
  },
  images: {
    remotePatterns: []
  }
};

export default nextConfig;