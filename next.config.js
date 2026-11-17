/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    imageSizes: [64, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
