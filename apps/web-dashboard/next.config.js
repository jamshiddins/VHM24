/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  async rewrites() {
  try {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}/api/:path*`,
      },
    ];
  },
  // Отключаем строгий режим для совместимости с некоторыми библиотеками
  reactStrictMode: false,
  
  // Настройки для production
  swcMinify: true,
  
  // Настройки изображений
  images: {
    domains: ['localhost'],
  },
  
  // Экспериментальные функции
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
