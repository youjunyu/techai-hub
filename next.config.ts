/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xaobhjcwfytmbjjkqips.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
