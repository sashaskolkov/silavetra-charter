import type { Area, City, CrewKind, HullKind, Region, Yacht } from "./fleet";

/**
 * Правила предметной области. Модуль чистый: никакого чтения диска,
 * поэтому его можно импортировать и в клиентские компоненты.
 *
 *  - Аренда всегда crewed charter: капитан и команда входят в стоимость.
 *  - Спортивная берётся с базы «Силы ветра» от одного дня; вмещает
 *    четверых, на компанию крупнее выходят несколько лодок.
 *  - Круизная и моторная — по календарю от четырёх дней.
 */

export type BoatTypeId = "sport" | "cruise" | "motor";

/**
 * Чем человек отвечает на вопрос «куда».
 *
 * Круизная и моторная яхта уходят в переход, и выбирают их по большому
 * направлению — Карелия, Дальний Восток. Спортивная стоит на базе
 * «Силы ветра» и никуда с неё не уходит, поэтому выбирают её по городу.
 */
export type PlaceKind = "region" | "city";

export type BoatType = {
  id: BoatTypeId;
  name: string;
  /** Формулировка срока для карточек и фильтров. */
  term: string;
  /** Минимальное число дней аренды. Верхней границы нет ни у одного типа. */
  minDays: number;
  /** По чему выбирается место — см. PlaceKind. */
  placeBy: PlaceKind;
  /**
   * Можно ли взять несколько лодок на одну компанию.
   *
   * Спортивная вмещает четверых, и компанию крупнее не пересаживают
   * на лодку побольше — таких в классе просто нет. Берут вторую лодку
   * и идут вместе; на каждой свой инструктор, поэтому и цена кратна.
   */
  multiBoat: boolean;
  /** Кто на борту от команды: на спортивной это инструктор, а не капитан. */
  crewNoun: string;
  description: string;
};

export const BOAT_TYPES: BoatType[] = [
  {
    id: "sport",
    name: "Спортивная яхта",
    term: "от 1 дня",
    minDays: 1,
    placeBy: "city",
    multiBoat: true,
    crewNoun: "Инструктор",
    description:
      "Гоночный корпус, азарт и работа в команде. Берётся с базы «Силы ветра» — от одного дня.",
  },
  {
    id: "cruise",
    name: "Круизная яхта",
    term: "от 4 дней",
    minDays: 4,
    placeBy: "region",
    multiBoat: false,
    crewNoun: "Капитан",
    description:
      "Каюты, камбуз и большой переход. Путешествие по календарю — от четырёх дней.",
  },
  {
    id: "motor",
    name: "Моторная яхта",
    term: "от 4 дней",
    minDays: 4,
    placeBy: "region",
    multiBoat: false,
    crewNoun: "Капитан",
    description:
      "Скорость и комфорт без зависимости от ветра. Маршрут по календарю от четырёх дней.",
  },
];

/**
 * Сколько лодок нужно на компанию.
 *
 * Для всех типов, кроме спортивного, ответ всегда «одна»: если гостей
 * больше вместимости, лодка просто не подходит и до карточки не доходит.
 */
export function boatsNeeded(capacity: number, guests: number | null): number {
  if (!guests || capacity < 1) return 1;
  return Math.max(1, Math.ceil(guests / capacity));
}

/**
 * Сколько человек примет эта позиция каталога.
 *
 * Раньше потолок был константой «три лодки», и это было допущением:
 * сайт считал цену за три корпуса там, где стоял один. Теперь предел
 * задают данные — сколько лодок реально стоит на базе.
 */
export function companyLimit(
  yacht: Pick<Yacht, "guests" | "fleetSize">,
): number {
  return yacht.guests * yacht.fleetSize;
}

/**
 * Две подписи про вместимость, и каждая стоит на своём месте.
 *
 * Правило класса — серым в сайдбаре: оно не зависит от запроса и просто
 * объясняет, чего ждать. Последствие выбора — жёлтым на карточке, рядом
 * с ценой: там оно объясняет, почему сумма кратна.
 */
export function capacityRule(capacity: number): string {
  return `Лодка рассчитана на ${pluralPeople(capacity)}`;
}

export function boatsNote(boats: number, capacity: number): string {
  return `Вам нужны ${pluralBoats(boats)} — в одну лодку помещается ${pluralPeople(
    capacity,
  )}`;
}

export function getBoatType(id: BoatTypeId): BoatType | undefined {
  return BOAT_TYPES.find((type) => type.id === id);
}

export function isBoatTypeId(value: unknown): value is BoatTypeId {
  return BOAT_TYPES.some((type) => type.id === value);
}

/* --- Витрина -------------------------------------------------------------- */

/**
 * Витрина смешивает два масштаба намеренно.
 *
 * Регион обещает размах — «Дальний Восток» это четырнадцать акваторий
 * от Владивостока до Чукотки. Акватория обещает конкретный кадр:
 * «Белое море» и «Камчатка» узнаются с одного взгляда, и разменивать их
 * на общее слово незачем. Поэтому карточка бывает и той, и другой,
 * а ведут обе в один и тот же подбор — просто с разной глубиной.
 */
export type FeaturedKind = "region" | "area";

export type Featured = {
  kind: FeaturedKind;
  slug: string;
  tagline: string;
  photo: string;
};

export const FEATURED: Featured[] = [
  {
    kind: "region",
    slug: "chernoe-more",
    tagline: "Тёплая вода от Анапы до Сочи, вечерние переходы вдоль гор",
    photo: "/photos/dest-black-sea.jpg",
  },
  {
    kind: "region",
    slug: "arktika",
    tagline: "Баренцево море, китовые тропы и берег, где кончается суша",
    photo: "/photos/dest-arctic.jpg",
  },
  {
    kind: "region",
    slug: "dalniy-vostok",
    tagline: "От Владивостока до Чукотки: острова, косатки и туман",
    photo: "/photos/dest-far-east.jpg",
  },
  {
    kind: "region",
    slug: "yakutiya",
    tagline: "Ленские столбы и река шириной с море",
    photo: "/photos/dest-yakutia.jpg",
  },
  {
    kind: "area",
    slug: "white-sea",
    tagline: "Полярный день, киты-белухи и деревянные поморские церкви",
    photo: "/photos/dest-white-sea.jpg",
  },
  {
    kind: "area",
    slug: "kamchatka",
    tagline: "Вулканы прямо из воды, косатки и горячие источники",
    photo: "/photos/dest-kamchatka.jpg",
  },
];

/* --- Поиск ---------------------------------------------------------------- */

/** Срез каталога, которого хватает для фильтрации и счётчиков. */
export type FleetSlice = Pick<
  Yacht,
  "type" | "region" | "area" | "city" | "guests" | "fleetSize"
>;

export type SearchFilters = {
  type: BoatTypeId;
  /** Регион — для круизных и моторных. */
  region: string | null;
  /** Город базы — для спортивных. */
  city: string | null;
  /** Акватория внутри региона: приходит с витрины, сужает выдачу. */
  area: string | null;
  guests: number | null;
};

export function filterYachts<T extends FleetSlice>(
  yachts: T[],
  filters: SearchFilters,
): T[] {
  const type = getBoatType(filters.type);
  const placeBy = type?.placeBy ?? "region";

  return yachts.filter((yacht) => {
    if (yacht.type !== filters.type) return false;
    // Лишний параметр игнорируем: у спортивной лодки регион в базе есть,
    // но поиском по нему она не ищется, и наоборот.
    if (placeBy === "region") {
      if (filters.region && yacht.region !== filters.region) return false;
    } else if (filters.city && yacht.city !== filters.city) return false;
    if (filters.area && yacht.area !== filters.area) return false;
    /*
     * Компания больше вместимости отсекает лодку. У спортивной вместимость
     * считается по всему флоту класса: четыре места на корпус, корпусов
     * на базе может быть шесть — тогда двадцать четыре человека поместятся,
     * а двадцать пять уже нет, и обещать их нельзя.
     */
    if (filters.guests) {
      const limit = type?.multiBoat ? companyLimit(yacht) : yacht.guests;
      if (limit < filters.guests) return false;
    }
    return true;
  });
}

/* --- Поле «Куда» ---------------------------------------------------------- */

/** Один вариант ответа на «куда» — регион или город, смотря по типу лодки. */
export type Place = { slug: string; name: string };

export type Places = {
  kind: PlaceKind;
  /** Только те места, где реально стоят лодки выбранного типа. */
  options: Place[];
  /** Подписи для пустого выбора и заголовка списка. */
  anyLabel: string;
  fieldLabel: string;
};

/**
 * Что показать в поле «Куда» для выбранного типа лодки.
 *
 * Компоненты не должны знать про правило «спорт ищется по городам» —
 * им достаточно списка вариантов и имени параметра, куда его положить.
 */
export function placesForBoatType(
  type: BoatTypeId,
  yachts: FleetSlice[],
  book: { regions: Region[]; cities: City[] },
): Places {
  const kind = getBoatType(type)?.placeBy ?? "region";
  const present = new Set(
    yachts
      .filter((yacht) => yacht.type === type)
      .map((yacht) => (kind === "city" ? yacht.city : yacht.region)),
  );
  const source = kind === "city" ? book.cities : book.regions;

  return {
    kind,
    options: source
      .filter((item) => present.has(item.slug))
      .map(({ slug, name }) => ({ slug, name })),
    anyLabel: kind === "city" ? "Любая база" : "Любое направление",
    fieldLabel: kind === "city" ? "База" : "Куда",
  };
}

/** Акватории выбранного региона, где стоят лодки этого типа. */
export function areasForRegion(
  areas: Area[],
  yachts: FleetSlice[],
  type: BoatTypeId,
  region: string,
): Area[] {
  const present = new Set(
    yachts
      .filter((yacht) => yacht.type === type && yacht.region === region)
      .map((yacht) => yacht.area),
  );
  return areas.filter((area) => present.has(area.slug));
}

/** Максимум гостей среди лодок выбранного типа. */
export function maxGuestsForType(
  yachts: Pick<Yacht, "type" | "guests" | "fleetSize">[],
  id: BoatTypeId,
): number {
  const multi = getBoatType(id)?.multiBoat;
  return yachts
    .filter((yacht) => yacht.type === id)
    .reduce(
      (max, yacht) =>
        Math.max(max, multi ? companyLimit(yacht) : yacht.guests),
      1,
    );
}

/** Мест на одном корпусе — для подписи про вместимость лодки. */
export function seatsForType(
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

/**
 * Кто на борту от команды и что это стоит.
 *
 * На спортивной лодке это не капитан, а инструктор: он не везёт гостей,
 * а учит их работать с парусом, и слово «капитан» сбивает ожидание.
 */
/**
 * Подпись корпуса: «Килевая яхта» или «Швертбот».
 *
 * Показываем только у спортивных: там класс бывает и тем, и другим,
 * и от этого зависит характер выхода. У круизных и моторных киль
 * по определению, и строка была бы шумом.
 */
export function hullLabel(hull: HullKind | null): string | null {
  if (!hull) return null;
  return hull === "dinghy" ? "Швертбот" : "Килевая яхта";
}

export function crewLabel(crew: CrewKind, type: BoatTypeId): string {
  if (crew === "captain-mate") return "Капитан и помощник включены в стоимость";
  const noun = getBoatType(type)?.crewNoun ?? "Капитан";
  return `${noun} включён в стоимость`;
}

/** Повар — доплата к суточной ставке, доступен на лодках от 12 метров. */
export const COOK_PRICE_PER_DAY = 8000;

/**
 * Русское склонение по числу. Формы идут как в CLDR: one, few, many —
 * «1 яхта», «2 яхты», «5 яхт».
 */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} ${few}`;
  return `${count} ${many}`;
}

export const pluralYachts = (count: number) =>
  plural(count, "яхта", "яхты", "яхт");

/** Винительный падеж: «нашли 1 яхту / 2 яхты / 5 яхт». */
export const pluralYachtsAccusative = (count: number) =>
  plural(count, "яхту", "яхты", "яхт");

export const pluralDays = (count: number) =>
  plural(count, "день", "дня", "дней");

export const pluralCabins = (count: number) =>
  plural(count, "каюта", "каюты", "кают");

export const pluralAreas = (count: number) =>
  plural(count, "акватория", "акватории", "акваторий");

export const pluralBoats = (count: number) =>
  plural(count, "лодка", "лодки", "лодок");

export const pluralPeople = (count: number) =>
  plural(count, "человек", "человека", "человек");

/** «1 яхта подходит», «2 яхты подходят» — согласование сказуемого. */
export const fitVerb = (count: number) =>
  count % 10 === 1 && count % 100 !== 11 ? "подходит" : "подходят";

/** «5 направлений» или «8 баз» — смотря что стоит в поле «Куда». */
export const pluralPlaces = (count: number, kind: PlaceKind) =>
  kind === "city"
    ? plural(count, "база", "базы", "баз")
    : plural(count, "направление", "направления", "направлений");

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
  // Верхней границы нет ни у одного типа: спортивную тоже берут
  // на сколько угодно, просто её минимум — сутки, а не четверо.
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

