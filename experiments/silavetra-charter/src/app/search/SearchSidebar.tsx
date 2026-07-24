"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOAT_TYPES,
  filterYachts,
  getBoatType,
  maxGuestsForType,
  pluralYachts,
  regionsForBoatType,
  type BoatTypeId,
  type SortId,
} from "@/data/catalog";
import type { Region, Yacht } from "@/data/fleet";
import styles from "./search.module.css";

/** Клиенту нужен не весь каталог, а срез для подсчёта совпадений. */
export type SidebarFleet = Pick<Yacht, "type" | "region" | "guests">;

type Props = {
  regions: Region[];
  fleet: SidebarFleet[];
  initial: {
    type: BoatTypeId;
    region: string | null;
    guests: number | null;
    from: string | null;
    to: string | null;
    sort: SortId;
  };
};

/**
 * Сайдбар подбора.
 *
 * Раньше это была серверная форма, и список направлений обновлялся только
 * после отправки: сменил тип на круизную — а акватории остались спортивные.
 * Теперь состояние живёт на клиенте, и всё пересчитывается сразу.
 */
export function SearchSidebar({ regions, fleet, initial }: Props) {
  const router = useRouter();

  const [type, setType] = useState<BoatTypeId>(initial.type);
  const [region, setRegion] = useState<string | null>(initial.region);
  const [guests, setGuests] = useState<number | null>(initial.guests);
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  const boatType = getBoatType(type);
  const isDaily = boatType?.minDays === 1;

  const availableRegions = useMemo(
    () => regionsForBoatType(regions, fleet, type),
    [regions, fleet, type],
  );

  const maxGuests = useMemo(() => maxGuestsForType(fleet, type), [fleet, type]);

  const matches = useMemo(
    () => filterYachts(fleet, { type, region, guests }),
    [fleet, type, region, guests],
  );

  /** Смена типа переписывает всё, что от него зависит. */
  function handleTypeChange(next: BoatTypeId) {
    setType(next);

    if (
      region &&
      !regionsForBoatType(regions, fleet, next).some((r) => r.slug === region)
    ) {
      setRegion(null);
    }

    const limit = maxGuestsForType(fleet, next);
    setGuests((current) => (current && current > limit ? limit : current));

    // Спортивную берут ровно на день — дата выезда теряет смысл.
    if (next === "sport") setTo("");
  }

  function changeGuests(delta: number) {
    setGuests((current) => {
      const next = (current ?? 0) + delta;
      if (next < 1) return null;
      return Math.min(next, maxGuests);
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({ type, sort: initial.sort });
    if (region) params.set("region", region);
    if (guests) params.set("guests", String(guests));
    if (from) params.set("from", from);
    if (to && !isDaily) params.set("to", to);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <aside className={styles.sidebar}>
      <p className={styles.sidebarHead}>Поиск</p>

      <form className={styles.sidebarBody} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Тип лодки</span>
          <select
            value={type}
            onChange={(event) =>
              handleTypeChange(event.target.value as BoatTypeId)
            }
            className={styles.select}
          >
            {BOAT_TYPES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.minDays > 1
                  ? `${option.name} — ${option.term}`
                  : option.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Направление</span>
          <select
            value={region ?? ""}
            onChange={(event) => setRegion(event.target.value || null)}
            className={styles.select}
          >
            <option value="">Любое — {availableRegions.length} акваторий</option>
            {availableRegions.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name} · {item.port}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Гости</span>
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
              {guests ? `${guests} чел.` : "не важно"}
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
          {guests !== null && guests >= maxGuests && (
            <span className={styles.hint}>
              Больше {maxGuests} не берёт ни одна {boatType?.name.toLowerCase()}
            </span>
          )}
        </div>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            {isDaily ? "Дата выхода" : "Заезд"}
          </span>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className={styles.date}
          />
        </label>

        {!isDaily && (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Выезд</span>
            <input
              type="date"
              value={to}
              min={minReturn(from, boatType?.minDays ?? 4)}
              onChange={(event) => setTo(event.target.value)}
              className={styles.date}
            />
          </label>
        )}

        <button type="submit" className={styles.submit}>
          Показать {pluralYachts(matches.length)}
        </button>

        <p className={styles.rule}>
          {boatType?.description} Капитан и команда входят в стоимость.
        </p>
      </form>
    </aside>
  );
}

/** Самая ранняя дата выезда с учётом минимального срока аренды. */
function minReturn(from: string, minDays: number): string | undefined {
  if (!from) return undefined;
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setDate(date.getDate() + minDays);
  return date.toISOString().slice(0, 10);
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
