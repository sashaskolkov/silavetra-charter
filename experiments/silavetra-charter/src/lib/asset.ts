/** Базовый путь сайта: на GitHub Pages это /имя-репозитория. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Дописывает базовый путь к ссылке на файл из public/.
 *
 * Нужен потому, что next/image, в отличие от next/link, basePath к src
 * сам не подставляет: без этого на GitHub Pages отвалятся все фотографии.
 */
export function asset(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}
