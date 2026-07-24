"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PriceWithCook } from "@/components/PriceWithCook";
import type { Region, Yacht } from "@/data/fleet";
import {
  SORT_OPTIONS,
  crewLabel,
  filterYachts,
  getBoatType,
  isBoatTypeId,
  isSortId,
  pluralCabins,
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
}: {
  yachts: Yacht[];
  regions: Region[];
}) {
  const params = useSearchParams();

  const type = readType(params.get("type"));
  const region = readRegion(params.get("region"), regions);
  const guests = readGuests(params.get("guests"));
  const sort = readSort(params.get("sort"));
  const from = readDate(params.get("from"));
  const to = readDate(params.get("to"));

  const boatType = getBoatType(type);
  const { days, assumed } = resolveDays(from, to, boatType?.minDays ?? 4);
  const found = sortYachts(filterYachts(yachts, { type, region, guests }), sort);
  const regionName = region
    ? regions.find((item) => item.slug === region)?.name
    : null;
  const totalOfType = yachts.filter((yacht) => yacht.type === type).length;

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
        {regionName && (
          <>
            <span>—</span>
            <span>{regionName}</span>
          </>
        )}
      </nav>

      <div className={styles.layout}>
        <SearchSidebar
          regions={regions}
          fleet={yachts.map(({ type, region, guests }) => ({
            type,
            region,
            guests,
          }))}
          initial={{ type, region, guests, from, to, sort }}
        />

        <div>
          <div className={styles.head}>
            <h1 className="headline">
              {regionName ? `${boatType?.name}: ${regionName}` : boatType?.name}
            </h1>
            <p className={styles.count}>
              <span className={styles.countValue}>
                {pluralYachts(found.length)}
              </span>{" "}
              из {totalOfType} подходят под запрос
            </p>
          </div>

          <div className={styles.sorts}>
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.id}
                href={buildHref({
                  type,
                  region,
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
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>Под эти параметры лодок нет</p>
              <p className={styles.emptyText}>
                {regionName
                  ? `На направлении «${regionName}» нет лодок типа «${boatType?.name.toLowerCase()}»${
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
}: {
  yacht: Yacht;
  days: number;
  /** Срок не выбран пользователем, а взят как минимальный для типа. */
  assumed: boolean;
}) {
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

        <p className={styles.place}>
          <PinIcon />
          {yacht.regionName}, {yacht.port}
        </p>

        <div className={styles.tags}>
          <span className={styles.tag}>
            <AnchorIcon />
            {crewLabel(yacht.crew)}
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
          <span className={styles.specDot} />
          <span>
            {yacht.heads > 0 ? `санузлов: ${yacht.heads}` : "без гальюна"}
          </span>
        </p>
      </div>

      <div className={styles.aside}>
        <PriceWithCook
          pricePerDay={yacht.pricePerDay}
          days={days}
          assumed={assumed}
          cookAvailable={yacht.cookAvailable}
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

function readRegion(value: string | null, regions: Region[]): string | null {
  return value && regions.some((region) => region.slug === value) ? value : null;
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
  region: string | null;
  guests: number | null;
  from: string | null;
  to: string | null;
  sort: SortId;
}): string {
  const params = new URLSearchParams({ type: state.type, sort: state.sort });
  if (state.region) params.set("region", state.region);
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
