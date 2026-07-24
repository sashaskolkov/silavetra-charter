/**
 * Забирает фотографии каталога к себе, в public/fleet/.
 *
 * Зачем: в базе стоят ссылки на Викисклад и Тильду. Пока сайт живёт
 * локально, это терпимо, но опубликованный сайт от них зависит —
 * Викисклад уже отвечает 429 Too Many Requests, а чужой файл может
 * просто исчезнуть. Скачанные кадры делают сайт по-настоящему автономным.
 *
 *   npm run fetch-photos
 *
 * Скрипт идемпотентный: уже скачанное не трогает. Запускать вручную
 * после обновления базы — в сборку он не встроен, чтобы деплой
 * не зависел от сети.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, "..");
const SOURCE = process.env.FLEET_DB ?? path.join(APP, "..", "..", "data", "fleet.csv");
const OUT_DIR = path.join(APP, "public", "fleet");
const MANIFEST = path.join(APP, "src", "data", "photo-manifest.json");

// Только латиница: HTTP-заголовок не принимает символы вне ByteString.
const UA =
  "SilaVetraCharterTraining/1.0 (training project; contact: allo@silavetra.com)";

function photoColumn(text) {
  const [head, ...lines] = text.split("\n").filter((line) => line.trim() !== "");
  const index = head.split(",").findIndex((cell) => cell.trim() === "Фото");
  if (index === -1) throw new Error("В базе нет колонки «Фото»");
  return lines.map((line) => (line.split(",")[index] ?? "").trim());
}

/** Имя файла — от ссылки: та же ссылка всегда даёт тот же файл. */
function localName(url) {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 12);
  const ext = (path.extname(new URL(url).pathname) || ".jpg").toLowerCase();
  return `${hash}${ext === ".jpeg" ? ".jpg" : ext}`;
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Не нашёл базу: ${SOURCE}`);
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const urls = [...new Set(photoColumn(readFileSync(SOURCE, "utf8")))].filter(
    (url) => url.startsWith("http"),
  );

  const manifest = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, "utf8"))
    : {};

  let downloaded = 0;
  let skipped = 0;
  const failed = [];

  for (const url of urls) {
    const name = localName(url);
    const file = path.join(OUT_DIR, name);

    if (existsSync(file)) {
      manifest[url] = `/fleet/${name}`;
      skipped += 1;
      continue;
    }

    try {
      const response = await fetch(url, { headers: { "User-Agent": UA } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1024) throw new Error(`подозрительно мало: ${bytes.length} Б`);

      writeFileSync(file, bytes);
      manifest[url] = `/fleet/${name}`;
      downloaded += 1;
      console.log(`  + ${name}  ${(bytes.length / 1024).toFixed(0)} КБ`);

      // Викисклад режет частые запросы — идём неспешно.
      await new Promise((resolve) => setTimeout(resolve, 400));
    } catch (error) {
      failed.push(`${url} — ${error.message}`);
    }
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `\nскачано: ${downloaded}, уже было: ${skipped}, всего в манифесте: ${Object.keys(manifest).length}`,
  );

  if (failed.length > 0) {
    console.warn(`\nне получилось (${failed.length}) — останутся внешними ссылками:`);
    for (const line of failed) console.warn(`  ${line}`);
  }
}

await main();
