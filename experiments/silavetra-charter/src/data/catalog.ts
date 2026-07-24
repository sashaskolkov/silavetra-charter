import type { CrewKind, Region, Yacht } from "./fleet";

/**
 * Правила предметной области. Модуль чистый: никакого чтения диска,
 * поэтому его можно импортировать и в клиентские компоненты.
 *
 *  - Аренда всегда crewed charter: капитан и команда входят в стоимость.
 *  - Спортивная яхта берётся только на день и только с базы «Силы ветра».
 *  - Круизная и моторная — по календарю от четырёх дней.
 */

export type BoatTypeId = "sport" | "cruise" | "motor";

export type BoatType = {
  id: BoatTypeId;
  name: string;
  /** Формулировка срока для карточек и фильтров. */
  term: string;
  /** Минимальное число дней аренды. */
  minDays: number;
  description: string;
};

export const BOAT_TYPES: BoatType[] = [
  {
    id: "sport",
    name: "Спортивная яхта",
    term: "на день",
    minDays: 1,
    description:
      "Гоночный корпус, азарт и работа в команде. Выход на один день с базы «Силы ветра».",
  },
  {
    id: "cruise",
    name: "Круизная яхта",
    term: "от 4 дней",
    minDays: 4,
    description:
      "Каюты, камбуз и большой переход. Путешествие по календарю — от четырёх дней.",
  },
  {
    id: "motor",
    name: "Моторная яхта",
    term: "от 4 дней",
    minDays: 4,
    description:
      "Скорость и комфорт без зависимости от ветра. Маршрут по календарю от четырёх дней.",
  },
];

export function getBoatType(id: BoatTypeId): BoatType | undefined {
  return BOAT_TYPES.find((type) => type.id === id);
}

export function isBoatTypeId(value: unknown): value is BoatTypeId {
  return BOAT_TYPES.some((type) => type.id === value);
}

/* --- Витрина -------------------------------------------------------------- */

export const FEATURED_REGION_SLUGS = [
  "ladoga",
  "white-sea",
  "kamchatka",
  "yakutia",
  "sakhalin",
  "onega",
] as const;

/** Подписи и кадры нужны только витрине, остальным регионам — нет. */
export const FEATURED_META: Record<string, { tagline: string; photo: string }> = {
  ladoga: {
    tagline: "Шхеры, гранитные острова и вода цвета крепкого чая",
    photo: "/photos/ladoga.jpg",
  },
  "white-sea": {
    tagline: "Полярный день, киты-белухи и деревянные поморские церкви",
    photo: "/photos/white-sea-pier.jpg",
  },
  kamchatka: {
    tagline: "Вулканы прямо из воды, косатки и горячие источники",
    photo: "/photos/kamchatka.jpg",
  },
  yakutia: {
    tagline: "Ленские столбы и река шириной с море",
    photo: "/photos/yakutia.jpg",
  },
  sakhalin: {
    tagline: "Тихий океан, лежбища сивучей и туманные мысы",
    photo: "/photos/sakhalin.jpg",
  },
  onega: {
    tagline: "Кижи, петроглифы и закат, который не заканчивается",
    photo: "/photos/onega.jpg",
  },
};

/* --- Поиск ---------------------------------------------------------------- */

export type SearchFilters = {
  type: BoatTypeId;
  region: string | null;
  guests: number | null;
};

export function filterYachts<
  T extends Pick<Yacht, "type" | "region" | "guests">,
>(yachts: T[], filters: SearchFilters): T[] {
  return yachts.filter((yacht) => {
    if (yacht.type !== filters.type) return false;
    if (filters.region && yacht.region !== filters.region) return false;
    if (filters.guests && yacht.guests < filters.guests) return false;
    return true;
  });
}

/** Направления, где реально стоят лодки выбранного типа. */
export function regionsForBoatType(
  regions: Region[],
  yachts: Pick<Yacht, "type" | "region">[],
  id: BoatTypeId,
): Region[] {
  const slugs = new Set(
    yachts.filter((yacht) => yacht.type === id).map((yacht) => yacht.region),
  );
  return regions.filter((region) => slugs.has(region.slug));
}

/** Максимум гостей среди лодок выбранного типа. */
export function maxGuestsForType(
  yachts: Pick<Yacht, "type" | "guests">[],
  id: BoatTypeId,
): number {
  return yachts
    .filter((yacht) => yacht.type === id)
    .reduce((max, yacht) => Math.max(max, yacht.guests), 1);
}

export const SORT_OPTIONS = [
  { id: "recommended", label: "Рекомендуем" },
  { id: "price-asc", label: "Сначала дешёвые" },
  { id: "price-desc", label: "Сначала дорогие" },
  { id: "guests", label: "Больше гостей" },
  { id: "length", label: "Длиннее" },
] as const;

export type SortId = (typeof SORT_OPTIONS)[number]["id"];

export function isSortId(value: unknown): value is SortId {
  return SORT_OPTIONS.some((option) => option.id === value);
}

export function sortYachts(yachts: Yacht[], sort: SortId): Yacht[] {
  const sorted = [...yachts];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.pricePerDay - b.pricePerDay);
    case "price-desc":
      return sorted.sort((a, b) => b.pricePerDay - a.pricePerDay);
    case "guests":
      return sorted.sort((a, b) => b.guests - a.guests);
    case "length":
      return sorted.sort((a, b) => b.lengthM - a.lengthM);
    default:
      // «Рекомендуем» — сначала лодки в лучшем состоянии, затем просторные.
      return sorted.sort(
        (a, b) => b.condition - a.condition || b.guests - a.guests,
      );
  }
}

/* --- Форматирование ------------------------------------------------------- */

export function formatPrice(rubles: number): string {
  return `${rubles.toLocaleString("ru-RU")} ₽`;
}

export function crewLabel(crew: CrewKind): string {
  return crew === "captain-mate"
    ? "Капитан и помощник включены в стоимость"
    : "Капитан включен в стоимость";
}

/** Повар — доплата к суточной ставке, доступен на лодках от 12 метров. */
export const COOK_PRICE_PER_DAY = 8000;

/** «1 яхта / 2 яхты / 5 яхт» — именительный падеж. */
export function pluralYachts(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} яхта`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} яхты`;
  return `${count} яхт`;
}

/** «1 день / 2 дня / 5 дней». */
export function pluralDays(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} дня`;
  return `${count} дней`;
}

/**
 * Сколько суток считать по выбранным датам.
 *
 * Если даты не заданы или не проходят по правилам типа лодки, берём
 * минимальный срок аренды и помечаем его как предположение — чтобы
 * подпись под ценой не выдавала догадку за выбор пользователя.
 */
export function resolveDays(
  from: string | null,
  to: string | null,
  minDays: number,
): { days: number; assumed: boolean } {
  if (minDays === 1) {
    // Спортивную берут ровно на день, диапазон здесь не нужен.
    return { days: 1, assumed: from === null };
  }

  if (!from || !to) return { days: minDays, assumed: true };

  const start = Date.parse(from);
  const end = Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { days: minDays, assumed: true };
  }

  const days = Math.round((end - start) / 86_400_000);
  if (days < minDays) return { days: minDays, assumed: true };
  return { days, assumed: false };
}

/** «1 каюта / 2 каюты / 5 кают». */
export function pluralCabins(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} каюта`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} каюты`;
  return `${count} кают`;
}

/** «нашли 1 яхту / 2 яхты / 5 яхт» — винительный падеж. */
export function pluralYachtsAccusative(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} яхту`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} яхты`;
  return `${count} яхт`;
}
