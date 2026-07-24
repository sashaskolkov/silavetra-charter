import type { BoatTypeId } from "./catalog";
import { REGIONS, YACHTS } from "./fleet.data";

/**
 * Флот сайта.
 *
 * База лежит вне проекта — в data/fleet.csv. Скрипт `npm run sync-fleet`
 * переносит её в src/data/fleet.data.ts, и дальше данные живут внутри сборки.
 * Поэтому опубликованный сайт ни от чего не зависит: исходный CSV нужен
 * только тому, кто обновляет каталог.
 *
 * Модуль чистый — никакого чтения диска, его можно импортировать и в
 * клиентские компоненты.
 */

export type CrewKind = "captain" | "captain-mate";

export type Region = {
  slug: string;
  name: string;
  /** Порт приписки: в базе у региона он всегда один. */
  port: string;
};

export type Yacht = {
  id: string;
  name: string;
  /** Модель корпуса: «Конрад 25RT», «Bavaria Cruiser 46». */
  model: string;
  type: BoatTypeId;
  crew: CrewKind;
  /**
   * Можно ли добавить повара при бронировании этой лодки.
   * Признак судна, а не услуга в стоимости: ниже 12 метров нет
   * ни камбуза, ни места для человека, и галка не появляется.
   */
  cookAvailable: boolean;
  region: string;
  regionName: string;
  port: string;
  cabins: number;
  lengthM: number;
  /** Гостевых мест без экипажа. */
  guests: number;
  /** Санузлов на борту; 0 — гальюна нет. */
  heads: number;
  pricePerDay: number;
  /** Состояние судна, 3–5. */
  condition: number;
  photo: string;
};

export type Fleet = {
  yachts: Yacht[];
  regions: Region[];
};

export function loadFleet(): Fleet {
  return { yachts: YACHTS, regions: REGIONS };
}

export function getYacht(id: string): Yacht | undefined {
  return YACHTS.find((yacht) => yacht.id === id);
}
