/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ejffrphknvtsmntlqwtp.supabase.co'],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
