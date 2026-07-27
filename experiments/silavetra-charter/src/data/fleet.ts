import type { BoatTypeId } from "./catalog";
import { AREAS, CITIES, REGIONS, YACHTS } from "./fleet.data";

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

export type HullKind = "keel" | "dinghy";

/**
 * География трёхуровневая: регион → акватория → порт.
 *
 * Регион — то, что человек выбирает в поиске: Карелия, Дальний Восток.
 * Акватория — где лодка реально ходит: Ладожское озеро, Залив Анива.
 * Порт — откуда выходит: Сортавала, Корсаков.
 *
 * Разделение появилось потому, что искать по акваториям невозможно:
 * никто не выбирает Темрюкский залив, выбирают Азовское море.
 */
export type Region = {
  slug: string;
  name: string;
};

export type Area = {
  slug: string;
  name: string;
  /** Регион, которому принадлежит акватория; одна акватория — один регион. */
  region: string;
  regionName: string;
  /** Портов у акватории может быть несколько. */
  ports: string[];
};

/**
 * База «Силы ветра». Спортивные лодки привязаны к городу, а не к региону:
 * их берут на день с конкретной базы, и уходить с неё некуда.
 */
export type City = {
  slug: string;
  name: string;
  region: string;
  regionName: string;
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
  area: string;
  areaName: string;
  /** Город базы; у спортивных лодок по нему идёт поиск. */
  city: string;
  port: string;
  cabins: number;
  lengthM: number;
  /** Гостевых мест без экипажа. */
  guests: number;
  /** Санузлов на борту; 0 — гальюна нет. */
  heads: number;
  /**
   * Корпус: киль или подъёмный шверт. `null` у всех, кроме спортивных.
   *
   * Различие имеет смысл только в спортивном классе — там есть и то,
   * и другое. У круизных и моторных киль по определению, и писать его
   * значило бы сообщать пустое: поэтому там честный null, а не «Килевая».
   */
  hull: HullKind | null;
  /**
   * Сколько одинаковых корпусов стоит на базе.
   *
   * У круизной и моторной всегда 1: фрахтуют конкретное судно. У спортивной
   * это флот класса, и он ограничен — на компанию нельзя вывести больше
   * лодок, чем есть. Без этого числа сайт продаёт три лодки там,
   * где стоит одна.
   */
  fleetSize: number;
  pricePerDay: number;
  /** Состояние судна, 3–5. */
  condition: number;
  photo: string;
};

export type Fleet = {
  yachts: Yacht[];
  regions: Region[];
  areas: Area[];
  cities: City[];
};

export function loadFleet(): Fleet {
  return { yachts: YACHTS, regions: REGIONS, areas: AREAS, cities: CITIES };
}

export function getYacht(id: string): Yacht | undefined {
  return YACHTS.find((yacht) => yacht.id === id);
}
