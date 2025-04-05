/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [ {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',        
      },],
  },
  allowedDevOrigins: ["codeshastra.pradyutdas.in"]
};

module.exports = nextConfig;
