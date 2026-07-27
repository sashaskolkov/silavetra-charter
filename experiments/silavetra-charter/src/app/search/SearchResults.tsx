"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PriceWithCook } from "@/components/PriceWithCook";
import type { Area, City, Region, Yacht } from "@/data/fleet";
import {
  SORT_OPTIONS,
  boatsNeeded,
  companyLimit,
  crewLabel,
  hullLabel,
  filterYachts,
  fitVerb,
  getBoatType,
  isBoatTypeId,
  isSortId,
  placesForBoatType,
  pluralCabins,
  pluralPeople,
  pluralYachts,
  resolveDays,
  sortYachts,
  type BoatTypeId,
  type SortId,
} from "@/data/catalog";
import { SearchSidebar } from "./SearchSidebar";
import { asset } from "@/lib/asset";
import styles from "./search.module.css";

/**
 * Выдача подбора.
 *
 * Сайт собирается статически, поэтому разбор параметров и фильтрация
 * происходят в браузере: на сервере во время сборки строки запроса ещё нет.
 */
export function SearchResults({
  yachts,
  regions,
  areas,
  cities,
}: {
  yachts: Yacht[];
  regions: Region[];
  areas: Area[];
  cities: City[];
}) {
  const params = useSearchParams();

  const type = readType(params.get("type"));
  const guests = readGuests(params.get("guests"));
  const sort = readSort(params.get("sort"));
  const from = readDate(params.get("from"));
  const to = readDate(params.get("to"));

  const boatType = getBoatType(type);
  const slice = yachts.map(
    ({ type, region, area, city, guests, fleetSize }) => ({
      type,
      region,
      area,
      city,
      guests,
      fleetSize,
    }),
  );
  const places = placesForBoatType(type, slice, { regions, cities });

  /* Что в адресе значит «куда», решает тип лодки: у спортивной это
     город базы, у остальных — регион. Чужой параметр молча игнорируем. */
  const place = readSlug(params.get(places.kind), places.options);
  const region = places.kind === "region" ? place : null;
  const city = places.kind === "city" ? place : null;
  const area = readSlug(params.get("area"), areas);

  const { days, assumed } = resolveDays(from, to, boatType?.minDays ?? 4);
  const found = sortYachts(
    filterYachts(yachts, { type, region, city, area, guests }),
    sort,
  );
  const placeName = place
    ? (places.options.find((item) => item.slug === place)?.name ?? null)
    : null;
  const areaName = area
    ? (areas.find((item) => item.slug === area)?.name ?? null)
    : null;
  const totalOfType = yachts.filter((yacht) => yacht.type === type).length;

  /*
   * Сколько человек примет самая вместительная позиция в этом месте.
   * Считаем только когда выдача пуста из-за компании: это отличает
   * «флота не хватает» от «здесь вообще нет таких лодок».
   */
  const overflow = (() => {
    if (found.length > 0 || !guests) return 0;
    const here = filterYachts(yachts, {
      type,
      region,
      city,
      area,
      guests: null,
    });
    if (here.length === 0) return 0;
    const best = Math.max(
      ...here.map((yacht) =>
        boatType?.multiBoat ? companyLimit(yacht) : yacht.guests,
      ),
    );
    return best < guests ? best : 0;
  })();

  return (
    <>
      <nav className={styles.crumbs}>
        <Link href="/" className={styles.crumbLink}>
          Главная
        </Link>
        <span>—</span>
        <Link href={`/search?type=${type}`} className={styles.crumbLink}>
          {boatType?.name}
        </Link>
        {placeName && (
          <>
            <span>—</span>
            {areaName ? (
              <Link
                href={`/search?type=${type}&${places.kind}=${place}`}
                className={styles.crumbLink}
              >
                {placeName}
              </Link>
            ) : (
              <span>{placeName}</span>
            )}
          </>
        )}
        {areaName && (
          <>
            <span>—</span>
            <span>{areaName}</span>
          </>
        )}
      </nav>

      <div className={styles.layout}>
        <SearchSidebar
          regions={regions}
          areas={areas}
          cities={cities}
          fleet={slice}
          initial={{ type, region, city, area, guests, from, to, sort }}
        />

        <div>
          <div className={styles.head}>
            <div>
              <h1 className="headline">
                {placeName ? `${boatType?.name}: ${placeName}` : boatType?.name}
              </h1>
              {areaName && <p className={styles.areaNote}>{areaName}</p>}
            </div>
            <p className={styles.count}>
              <span className={styles.countValue}>
                {pluralYachts(found.length)}
              </span>{" "}
              из {totalOfType} {fitVerb(found.length)} под запрос
            </p>
          </div>

          <div className={styles.sorts}>
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.id}
                href={buildHref({
                  type,
                  placeKind: places.kind,
                  place,
                  area,
                  guests,
                  from,
                  to,
                  sort: option.id,
                })}
                className={`${styles.sort} ${
                  option.id === sort ? styles["sort--active"] : ""
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>

          {found.length > 0 ? (
            <div className={styles.list}>
              {found.map((yacht) => (
                <YachtCard
                  key={yacht.id}
                  yacht={yacht}
                  days={days}
                  assumed={assumed}
                  guests={guests}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Под эти параметры лодок нет</p>
              <p className={styles.emptyText}>
                {overflow
                  ? /* Флот кончился, а не «ничего не нашлось»: у спортивных
                       это самая частая причина пустой выдачи, и человек
                       должен видеть предел, а не гадать. */
                    `${placeName ? `На базе «${placeName}»` : "На базах"} лодок хватает на ${pluralPeople(
                      overflow,
                    )} — вас ${guests}. Уменьшите компанию или выберите базу побольше.`
                  : areaName
                    ? `В акватории «${areaName}» нет лодок типа «${boatType?.name.toLowerCase()}»${
                        guests ? ` на ${guests} и больше гостей` : ""
                      }.`
                    : placeName
                      ? `${places.kind === "city" ? "На базе" : "В регионе"} «${placeName}» нет лодок типа «${boatType?.name.toLowerCase()}»${
                          guests ? ` на ${guests} и больше гостей` : ""
                        }.`
                      : `Ни одна ${boatType?.name.toLowerCase()} не берёт ${guests} и больше гостей.`}{" "}
                Попробуйте изменить параметры слева.
              </p>
              <Link href={`/search?type=${type}`} className={styles.cta}>
                Показать все
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* --- Карточка яхты -------------------------------------------------------- */

function YachtCard({
  yacht,
  days,
  assumed,
  guests,
}: {
  yacht: Yacht;
  days: number;
  /** Срок не выбран пользователем, а взят как минимальный для типа. */
  assumed: boolean;
  /** Размер компании: у спортивных от него зависит число лодок. */
  guests: number | null;
}) {
  const boats = getBoatType(yacht.type)?.multiBoat
    ? boatsNeeded(yacht.guests, guests)
    : 1;
  // Корпус есть только у спортивных — у остальных на его месте санузел.
  const hull = hullLabel(yacht.hull);

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        <span className={styles.condition}>
          <StarIcon />
          Состояние {yacht.condition} из 5
        </span>
        <Image
          src={asset(yacht.photo)}
          alt={`${yacht.name} — ${yacht.model}`}
          fill
          sizes="(max-width: 680px) 100vw, 300px"
          className={styles.photo}
        />
      </div>

      <div className={styles.body}>
        <div>
          <h2 className={styles.name}>{yacht.name}</h2>
          <p className={styles.model}>{yacht.model}</p>
        </div>

        {/* Акватория и порт: «Ладожское озеро, Сортавала». Регион здесь
            не нужен — он стоит в заголовке выдачи. */}
        <p className={styles.place}>
          <PinIcon />
          {yacht.areaName}, {yacht.port}
        </p>

        <div className={styles.tags}>
          <span className={styles.tag}>
            <AnchorIcon />
            {crewLabel(yacht.crew, yacht.type)}
          </span>
        </div>

        <p className={styles.specs}>
          <span>{yacht.lengthM} м</span>
          <span className={styles.specDot} />
          <span>до {yacht.guests} гостей</span>
          {yacht.cabins > 0 && (
            <>
              <span className={styles.specDot} />
              <span>{pluralCabins(yacht.cabins)}</span>
            </>
          )}
          {/* У спортивной на месте гальюна стоит корпус: гальюна там
              не бывает по устройству, а киль или шверт — важное отличие. */}
          {hull ? (
            <>
              <span className={styles.specDot} />
              <span>{hull}</span>
            </>
          ) : (
            yacht.heads > 0 && (
              <>
                <span className={styles.specDot} />
                <span>санузлов: {yacht.heads}</span>
              </>
            )
          )}
        </p>
      </div>

      <div className={styles.aside}>
        <PriceWithCook
          pricePerDay={yacht.pricePerDay}
          days={days}
          assumed={assumed}
          cookAvailable={yacht.cookAvailable}
          boats={boats}
          capacity={yacht.guests}
        />
        <Link href={`/yachts/${yacht.id}`} className={styles.cta}>
          Подробнее
        </Link>
      </div>
    </article>
  );
}

/* --- Разбор параметров ---------------------------------------------------- */

function readType(value: string | null): BoatTypeId {
  return isBoatTypeId(value) ? value : "cruise";
}

/** Принимаем slug, только если он есть в справочнике: чужой — как будто не задан. */
function readSlug(
  value: string | null,
  known: { slug: string }[],
): string | null {
  return value && known.some((item) => item.slug === value) ? value : null;
}

function readGuests(value: string | null): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readSort(value: string | null): SortId {
  return isSortId(value) ? value : "recommended";
}

/** Принимаем только формат «ГГГГ-ММ-ДД» — тот, что отдаёт input[type=date]. */
function readDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function buildHref(state: {
  type: BoatTypeId;
  placeKind: "region" | "city";
  place: string | null;
  area: string | null;
  guests: number | null;
  from: string | null;
  to: string | null;
  sort: SortId;
}): string {
  const params = new URLSearchParams({ type: state.type, sort: state.sort });
  if (state.place) params.set(state.placeKind, state.place);
  if (state.area) params.set("area", state.area);
  if (state.guests) params.set("guests", String(state.guests));
  if (state.from) params.set("from", state.from);
  if (state.to) params.set("to", state.to);
  return `/search?${params.toString()}`;
}

/* --- Иконки --------------------------------------------------------------- */

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="m6.5 1.5 1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4L1.6 5.1l3.4-.5L6.5 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      className={styles.placeIcon}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 14.5s5-4.4 5-8.3A5 5 0 0 0 3 6.2c0 3.9 5 8.3 5 8.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="6.2" r="1.9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AnchorIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="2.6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M7 4.2v8M3.4 6.2h7.2M2 9.4a5 5 0 0 0 10 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
