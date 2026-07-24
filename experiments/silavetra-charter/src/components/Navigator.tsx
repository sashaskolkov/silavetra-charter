"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BOAT_TYPES,
  filterYachts,
  getBoatType,
  maxGuestsForType,
  regionsForBoatType,
  type BoatTypeId,
} from "@/data/catalog";
import type { Region, Yacht } from "@/data/fleet";
import { asset } from "@/lib/asset";
import styles from "./Navigator.module.css";

type PopoverId = "type" | "region" | "dates" | "guests" | null;

/**
 * Клиенту нужен не весь каталог, а срез для подсчёта совпадений.
 * Так в браузер уезжает несколько килобайт вместо всей базы.
 */
export type NavigatorFleet = Pick<Yacht, "type" | "region" | "guests">;

type NavigatorProps = {
  regions: Region[];
  fleet: NavigatorFleet[];
};

const FLEET_THUMBS = [
  { src: "/photos/fleet-1.jpg", alt: "Спортивные яхты на гонке" },
  { src: "/photos/fleet-2.jpg", alt: "Круизная яхта у скалы" },
  { src: "/photos/fleet-3.jpg", alt: "Яхта в шхерах Ладоги" },
];

/**
 * Блок 3. Сервис навигации по выбору лодок.
 *
 * Тип лодки стоит первым осознанно: он сужает и список направлений,
 * и режим календаря, поэтому собрать невалидный запрос невозможно.
 */
export function Navigator({ regions, fleet }: NavigatorProps) {
  const router = useRouter();

  const [type, setType] = useState<BoatTypeId>("cruise");
  const [region, setRegion] = useState<string | null>(null);
  const [guests, setGuests] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [open, setOpen] = useState<PopoverId>(null);
  const barRef = useRef<HTMLFormElement>(null);

  /*
   * Закрываем список кликом вне строки поиска и по Escape.
   * Полноэкранная подложка для этого не годится: она перекрывает страницу
   * и гасит тот же клик, которым список открывают.
   */
  useEffect(() => {
    if (open === null) return;

    function handlePointerDown(event: PointerEvent) {
      if (!barRef.current?.contains(event.target as Node)) setOpen(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const boatType = getBoatType(type);
  const isDaily = boatType?.minDays === 1;
  const availableRegions = useMemo(
    () => regionsForBoatType(regions, fleet, type),
    [regions, fleet, type],
  );

  /* Потолок берём из флота: у спортивных лодок это 6, просить 12 бессмысленно. */
  const maxGuests = useMemo(() => maxGuestsForType(fleet, type), [fleet, type]);

  function changeGuests(delta: number) {
    setGuests((current) => {
      const next = (current ?? 0) + delta;
      if (next < 1) return null;
      return Math.min(next, maxGuests);
    });
  }

  const matches = useMemo(
    () => filterYachts(fleet, { type, region, guests }),
    [fleet, type, region, guests],
  );

  /** Смена типа может обнулить направление, которого у него нет. */
  function handleTypeChange(next: BoatTypeId) {
    setType(next);
    if (
      region &&
      !regionsForBoatType(regions, fleet, next).some((r) => r.slug === region)
    ) {
      setRegion(null);
    }
    if (next === "sport") setDateTo("");

    // На новый тип может не найтись лодки такой вместимости — подрезаем.
    const limit = maxGuestsForType(fleet, next);
    setGuests((current) => (current && current > limit ? limit : current));

    setOpen(null);
  }

  function toggle(id: Exclude<PopoverId, null>) {
    setOpen(open === id ? null : id);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ type });
    if (region) params.set("region", region);
    if (guests) params.set("guests", String(guests));
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo && !isDaily) params.set("to", dateTo);
    router.push(`/search?${params.toString()}`);
  }

  const datesValue = dateFrom
    ? isDaily
      ? formatDate(dateFrom)
      : `${formatDate(dateFrom)}${dateTo ? ` — ${formatDate(dateTo)}` : ""}`
    : null;

  return (
    <section className={styles.section} id="navigator">
      <div className="container">
        <h2 className={`headline ${styles.title}`}>
          Хотите найти яхту самостоятельно?
        </h2>
        <p className={`lead ${styles.subtitle}`}>
          Определитесь с выбором типа лодки — от него зависит, каким будет ваше
          приключение.
        </p>

        <form ref={barRef} className={styles.bar} onSubmit={handleSubmit}>
          {/* --- Тип лодки --- */}
          <div className={styles.segment}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => toggle("type")}
              aria-expanded={open === "type"}
            >
              <BoatIcon />
              <span className={styles.triggerBody}>
                <span className={styles.triggerLabel}>Тип лодки</span>
                <span className={styles.triggerValue}>{boatType?.name}</span>
              </span>
              <Chevron open={open === "type"} />
            </button>

            {open === "type" && (
              <div className={styles.popover}>
                <p className={styles.popoverTitle}>Выберите один тип</p>
                <div className={styles.options}>
                  {BOAT_TYPES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`${styles.option} ${
                        option.id === type ? styles["option--active"] : ""
                      }`}
                      onClick={() => handleTypeChange(option.id)}
                    >
                      {option.name}
                      {/* «на день» и так очевидно из подписи к календарю. */}
                      {option.minDays > 1 && (
                        <span className={styles.optionNote}>{option.term}</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className={styles.popoverNote}>{boatType?.description}</p>
              </div>
            )}
          </div>

          {/* --- Направление --- */}
          <div className={styles.segment}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => toggle("region")}
              aria-expanded={open === "region"}
            >
              <PinIcon />
              <span className={styles.triggerBody}>
                <span className={styles.triggerLabel}>Куда</span>
                <span
                  className={`${styles.triggerValue} ${
                    region ? "" : styles["triggerValue--empty"]
                  }`}
                >
                  {region
                    ? regions.find((item) => item.slug === region)?.name
                    : "Любое направление"}
                </span>
              </span>
              <Chevron open={open === "region"} />
            </button>

            {open === "region" && (
              <div className={styles.popover}>
                <p className={styles.popoverTitle}>
                  Доступно для типа «{boatType?.name.toLowerCase()}» —{" "}
                  {availableRegions.length} из {regions.length}
                </p>
                <div className={styles.options}>
                  <button
                    type="button"
                    className={`${styles.option} ${
                      region === null ? styles["option--active"] : ""
                    }`}
                    onClick={() => {
                      setRegion(null);
                      setOpen(null);
                    }}
                  >
                    Любое
                  </button>
                  {availableRegions.map((option) => (
                    <button
                      key={option.slug}
                      type="button"
                      className={`${styles.option} ${
                        option.slug === region ? styles["option--active"] : ""
                      }`}
                      onClick={() => {
                        setRegion(option.slug);
                        setOpen(null);
                      }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* --- Даты --- */}
          <div className={styles.segment}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => toggle("dates")}
              aria-expanded={open === "dates"}
            >
              <CalendarIcon />
              <span className={styles.triggerBody}>
                <span className={styles.triggerLabel}>
                  {isDaily ? "Дата выхода" : "Даты"}
                </span>
                <span
                  className={`${styles.triggerValue} ${
                    datesValue ? "" : styles["triggerValue--empty"]
                  }`}
                >
                  {datesValue ?? (isDaily ? "Один день" : "От 4 дней")}
                </span>
              </span>
              <Chevron open={open === "dates"} />
            </button>

            {open === "dates" && (
              <div className={styles.popover}>
                <div className={styles.dateGrid}>
                  <label className={styles.dateField}>
                    {isDaily ? "Дата" : "Заезд"}
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                    />
                  </label>

                  {!isDaily && (
                    <label className={styles.dateField}>
                      Выезд
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={dateTo}
                        min={minReturnDate(dateFrom, boatType?.minDays ?? 4)}
                        onChange={(event) => setDateTo(event.target.value)}
                      />
                    </label>
                  )}
                </div>
                <p className={styles.popoverNote}>
                  {isDaily
                    ? "Спортивную яхту берут на один день — с утреннего инструктажа до вечернего возвращения на базу."
                    : "Круизные и моторные яхты бронируются по календарю от четырёх дней."}
                </p>
              </div>
            )}
          </div>

          {/* --- Гости --- */}
          <div className={styles.segment}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => toggle("guests")}
              aria-expanded={open === "guests"}
            >
              <GuestsIcon />
              <span className={styles.triggerBody}>
                <span className={styles.triggerLabel}>Гости</span>
                <span
                  className={`${styles.triggerValue} ${
                    guests ? "" : styles["triggerValue--empty"]
                  }`}
                >
                  {guests ? `${guests} чел.` : "Не важно"}
                </span>
              </span>
              <Chevron open={open === "guests"} />
            </button>

            {open === "guests" && (
              <div className={`${styles.popover} ${styles["popover--right"]}`}>
                <p className={styles.popoverTitle}>Сколько вас, без экипажа</p>

                <div className={styles.stepper}>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => changeGuests(-1)}
                    disabled={guests === null}
                    aria-label="Меньше гостей"
                  >
                    <MinusIcon />
                  </button>

                  <output className={styles.stepperValue}>
                    {guests ?? "—"}
                  </output>

                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => changeGuests(1)}
                    disabled={guests !== null && guests >= maxGuests}
                    aria-label="Больше гостей"
                  >
                    <PlusIcon />
                  </button>
                </div>

                <button
                  type="button"
                  className={`${styles.option} ${
                    guests === null ? styles["option--active"] : ""
                  }`}
                  onClick={() => setGuests(null)}
                >
                  Не важно
                </button>

                <p className={styles.popoverNote}>
                  {guests !== null && guests >= maxGuests
                    ? `Больше ${maxGuests} гостей ни одна ${boatType?.name.toLowerCase()} не берёт.`
                    : "Капитан и матросы на борту не занимают гостевые места."}
                </p>
              </div>
            )}
          </div>

          <button type="submit" className={styles.submit}>
            Найти
          </button>
        </form>

        <p className={styles.footer}>
          <span>Нашли</span>
          <span className={styles.count}>{formatMatches(matches.length)}</span>
          <span>под ваш запрос</span>
        </p>

        <div className={styles.proof}>
          <span className={styles.proofValue}>40k+</span>
          <span className={styles.proofLabel}>
            клиентов
            <br />
            под парусом
            <br />
            каждый год
          </span>
          <div className={styles.avatars}>
            {FLEET_THUMBS.map((thumb) => (
              <div key={thumb.src} className={styles.avatar}>
                <Image
                  src={asset(thumb.src)}
                  alt={thumb.alt}
                  fill
                  sizes="120px"
                  className={styles.avatarImg}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Вспомогательное ------------------------------------------------------ */

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

/** Самая ранняя дата выезда с учётом минимального срока аренды. */
function minReturnDate(from: string, minDays: number): string | undefined {
  if (!from) return undefined;
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setDate(date.getDate() + minDays);
  return date.toISOString().slice(0, 10);
}

/** Винительный падеж: «нашли 1 яхту / 2 яхты / 5 яхт». */
function formatMatches(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} яхту`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return `${count} яхты`;
  return `${count} яхт`;
}

/* --- Иконки --------------------------------------------------------------- */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles["chevron--open"] : ""}`}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 5 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoatIcon() {
  return (
    <svg
      className={styles.triggerIcon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 2v11M10 4c-4 4-5.5 7-5.5 9H10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 15h14l-1.6 2.4a2 2 0 0 1-1.7.9H6.3a2 2 0 0 1-1.7-.9L3 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      className={styles.triggerIcon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 18s6-5.3 6-10a6 6 0 1 0-12 0c0 4.7 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className={styles.triggerIcon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.75"
        y="4.25"
        width="14.5"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2.75 8h14.5M6.5 2.5v3M13.5 2.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GuestsIcon() {
  return (
    <svg
      className={styles.triggerIcon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2.5 17a5.5 5.5 0 0 1 11 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 4.4a3.25 3.25 0 0 1 0 5.2M15.5 12.4a5.5 5.5 0 0 1 2 4.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
