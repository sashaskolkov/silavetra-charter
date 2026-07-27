/**
 * Работа с парой дат «заезд — выезд».
 *
 * Все даты — строки «ГГГГ-ММ-ДД». Арифметика идёт по локальному времени:
 * `new Date("2026-08-01")` разбирается как полночь UTC, и в часовых поясах
 * западнее Гринвича это уже 31 июля — календарь начинал бы врать на день.
 */

/** Какое из полей пары заполняется прямо сейчас. */
export type DateField = "from" | "to" | null;

/** «ГГГГ-ММ-ДД» из даты — по локальному времени, без ухода в UTC. */
export function toISO(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Дата из «ГГГГ-ММ-ДД» в локальной полуночи. Мусор превращается в null. */
export function fromISO(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(value: string, days: number): string {
  const date = fromISO(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function today(): string {
  return toISO(new Date());
}

/** Самая ранняя дата выезда с учётом минимального срока аренды. */
export function minReturn(from: string, minDays: number): string | undefined {
  if (!fromISO(from)) return undefined;
  return addDays(from, minDays);
}

/**
 * Подпись над сеткой календаря: что именно выбирают сейчас.
 *
 * Живёт внутри самого календаря. Системный календарь `input[type=date]`
 * рисует операционная система поверх страницы — подписать его нельзя
 * никак, поэтому календарь у нас свой.
 */
export function datePrompt(active: DateField): string {
  return active === "to" ? "Выберите дату выезда" : "Выберите дату заезда";
}

const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

export function monthTitle(year: number, month: number): string {
  return `${MONTHS[month]} ${year}`;
}

/** «1 авг» — короткая подпись выбранной даты. */
export function shortDate(value: string): string {
  const date = fromISO(value);
  if (!date) return value;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/**
 * Сетка месяца с понедельника: шесть недель по семь дней.
 *
 * Длина всегда одна, чтобы календарь не прыгал по высоте при листании.
 * Дни соседних месяцев возвращаются тоже — их рисуют приглушённо.
 */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  // getDay(): воскресенье — 0, а неделя у нас начинается с понедельника.
  const shift = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - shift);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return toISO(day);
  });
}
