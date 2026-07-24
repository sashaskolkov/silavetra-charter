import type { NextConfig } from "next";

/**
 * GitHub Pages отдаёт сайт из подпапки вида /имя-репозитория,
 * поэтому базовый путь приходит из окружения при сборке.
 * Локально переменная пустая, и сайт живёт в корне.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Статический экспорт: сервера у GitHub Pages нет.
  output: "export",
  basePath,
  // Каждый маршрут становится папкой с index.html — иначе Pages отдаст 404.
  trailingSlash: true,
  images: {
    // Оптимизатор картинок требует сервер, а его в статике не будет.
    unoptimized: true,
  },
};

export default nextConfig;
