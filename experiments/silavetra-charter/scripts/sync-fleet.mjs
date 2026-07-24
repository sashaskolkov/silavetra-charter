/**
 * Переносит базу лодок в сайт.
 *
 * Источник — CSV вне проекта (по умолчанию ../../data/fleet.csv).
 * Результат — src/data/fleet.data.ts: обычный модуль, который попадает
 * в сборку. Благодаря этому опубликованный сайт не зависит ни от какого
 * внешнего файла и работает, даже когда компьютер с базой выключен.
 *
 *   npm run sync-fleet              # взять базу по умолчанию
 *   FLEET_DB=/path/to.csv npm run sync-fleet
 *
 * Скрипт вызывается автоматически перед `npm run build` и `npm run dev`.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, "..");
const SOURCE = process.env.FLEET_DB ?? path.join(APP, "..", "..", "data", "fleet.csv");
const TARGET = path.join(APP, "src", "data", "fleet.data.ts");
const MANIFEST = path.join(APP, "src", "data", "photo-manifest.json");

const TYPE_BY_LABEL = {
  Спортивная: "sport",
  Круизная: "cruise",
  Моторная: "motor",
};

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", " ": "-", "-": "-",
};

/** Регионы, у которых на сайте уже есть свой адрес и витринный кадр. */
const SLUG_OVERRIDES = {
  Ладога: "ladoga",
  "Белое море": "white-sea",
  Камчатка: "kamchatka",
  Сахалин: "sakhalin",
  "Онежское озеро": "onega",
  Якутия: "yakutia",
};

function slugify(name) {
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name];
  return [...name.toLowerCase()]
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Разбор CSV с кавычками — чтобы запятая внутри поля не ломала базу. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

const digits = (value) => {
  const only = String(value).replace(/[^\d]/g, "");
  return only === "" ? 0 : Number(only);
};

function main() {
  if (!existsSync(SOURCE)) {
    console.error(
      `\n  Не нашёл базу лодок: ${SOURCE}\n` +
        `  Укажите путь через FLEET_DB или положите файл на место.\n` +
        `  Сайт собирается из src/data/fleet.data.ts — если он уже есть,\n` +
        `  сборка не сломается, но данные останутся прежними.\n`,
    );
    // Уже синхронизированная база позволяет собрать сайт где угодно.
    process.exit(existsSync(TARGET) ? 0 : 1);
  }

  // Внешние ссылки заменяем на скачанные копии: см. fetch-photos.mjs.
  const manifest = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, "utf8"))
    : {};

  const rows = parseCsv(readFileSync(SOURCE, "utf8"));
  const header = rows[0].map((cell) => cell.trim());
  const at = (cells, name) => {
    const index = header.indexOf(name);
    return index === -1 ? "" : (cells[index] ?? "").trim();
  };

  const regions = new Map();
  const used = new Set();

  const yachts = rows.slice(1).map((cells, index) => {
    const regionName = at(cells, "Регион");
    const port = at(cells, "Порт");
    const slug = slugify(regionName);
    if (!regions.has(slug)) regions.set(slug, { slug, name: regionName, port });

    const name = at(cells, "Название");
    let id = slugify(name) || "yacht";
    if (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);

    const headsRaw = at(cells, "Туалет");
    const lengthM = digits(at(cells, "Длина"));
    const type = TYPE_BY_LABEL[at(cells, "Тип лодки")] ?? "cruise";
    const cookAvailable = at(cells, "Добавить повара") === "Да";

    if (cookAvailable && lengthM < 12) {
      throw new Error(`Повар на лодке короче 12 м: ${name}`);
    }
    if (type === "sport" && digits(at(cells, "Каюты")) > 0) {
      throw new Error(`Каюты на спортивной лодке: ${name}`);
    }

    return {
      id,
      name,
      model: at(cells, "Тип Яхты"),
      type,
      crew: at(cells, "Команда") === "Капитан и помощник" ? "captain-mate" : "captain",
      cookAvailable,
      region: slug,
      regionName,
      port,
      cabins: digits(at(cells, "Каюты")),
      lengthM,
      guests: digits(at(cells, "Места для гостей")),
      heads: headsRaw === "Нет" ? 0 : digits(headsRaw),
      pricePerDay: digits(at(cells, "Стоимость за день")),
      condition: digits(at(cells, "Состояние")),
      photo: manifest[at(cells, "Фото")] ?? at(cells, "Фото"),
    };
  });

  const stillRemote = new Set(
    yachts.filter((y) => y.photo.startsWith("http")).map((y) => y.photo),
  );
  if (stillRemote.size > 0) {
    console.warn(
      `\n  Внимание: ${stillRemote.size} кадров остались внешними ссылками.\n` +
        `  Опубликованный сайт будет зависеть от чужих серверов.\n` +
        `  Запустите: npm run fetch-photos\n`,
    );
  }

  const sortedRegions = [...regions.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );

  const body =
    `// Сгенерировано scripts/sync-fleet.mjs — не править руками.\n` +
    `// База: ${path.relative(APP, SOURCE)} · лодок: ${yachts.length} · регионов: ${sortedRegions.length}\n` +
    `// Данные лежат в модуле, а не читаются с диска: опубликованный сайт\n` +
    `// работает автономно, без доступа к исходному CSV.\n\n` +
    `import type { Region, Yacht } from "./fleet";\n\n` +
    `export const REGIONS: Region[] = ${JSON.stringify(sortedRegions, null, 2)};\n\n` +
    `export const YACHTS: Yacht[] = ${JSON.stringify(yachts, null, 2)};\n`;

  writeFileSync(TARGET, body, "utf8");

  const byType = yachts.reduce((acc, yacht) => {
    acc[yacht.type] = (acc[yacht.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log(
    `fleet.data.ts: ${yachts.length} лодок, ${sortedRegions.length} регионов,`,
    byType,
  );
}

main();
