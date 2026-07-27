"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOAT_TYPES,
  areasForRegion,
  filterYachts,
  getBoatType,
  maxGuestsForType,
  seatsForType,
  capacityRule,
  placesForBoatType,
  pluralAreas,
  pluralPlaces,
  pluralYachtsAccusative,
  type BoatTypeId,
  type FleetSlice,
  type SortId,
} from "@/data/catalog";
import type { Area, City, Region } from "@/data/fleet";
import { DateRangePicker } from "@/components/DateRangePicker";
import styles from "./search.module.css";

/** Клиенту нужен не весь каталог, а срез для подсчёта совпадений. */
export type SidebarFleet = FleetSlice;

type Props = {
  regions: Region[];
  areas: Area[];
  cities: City[];
  fleet: SidebarFleet[];
  initial: {
    type: BoatTypeId;
    region: string | null;
    city: string | null;
    area: string | null;
    guests: number | null;
    from: string | null;
    to: string | null;
    sort: SortId;
  };
};

/**
 * Сайдбар подбора.
 *
 * Раньше это была серверная форма, и список мест обновлялся только после
 * отправки: сменил тип на круизную — а в списке остались спортивные базы.
 * Теперь состояние живёт на клиенте, и всё пересчитывается сразу.
 *
 * Поле «куда» одно на все типы лодок, но означает разное: у круизной
 * и моторной это регион, у спортивной — база. Что именно, решает
 * placesForBoatType, а не компонент.
 */
export function SearchSidebar({ regions, areas, cities, fleet, initial }: Props) {
  const router = useRouter();

  const [type, setType] = useState<BoatTypeId>(initial.type);
  const [place, setPlace] = useState<string | null>(
    initial.region ?? initial.city,
  );
  const [area, setArea] = useState<string | null>(initial.area);
  const [guests, setGuests] = useState<number | null>(initial.guests);
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  const boatType = getBoatType(type);

  const places = useMemo(
    () => placesForBoatType(type, fleet, { regions, cities }),
    [type, fleet, regions, cities],
  );

  /* Акватория уточняет регион, поэтому появляется только вместе с ним. */
  const availableAreas = useMemo(
    () =>
      places.kind === "region" && place
        ? areasForRegion(areas, fleet, type, place)
        : [],
    [places.kind, place, areas, fleet, type],
  );

  const maxGuests = useMemo(() => maxGuestsForType(fleet, type), [fleet, type]);

  /**
   * Подсказка под счётчиком гостей.
   *
   * У спортивной это правило класса и ничего больше: сколько лодок
   * выйдет на компанию, пишет карточка рядом с ценой — там это объясняет
   * сумму, а здесь было бы повтором.
   */
  const guestsNote = (() => {
    if (boatType?.multiBoat) {
      return capacityRule(seatsForType(fleet, type));
    }
    return guests !== null && guests >= maxGuests
      ? `Больше ${maxGuests} не берёт ни одна ${boatType?.name.toLowerCase()}`
      : null;
  })();

  const matches = useMemo(
    () =>
      filterYachts(fleet, {
        type,
        region: places.kind === "region" ? place : null,
        city: places.kind === "city" ? place : null,
        area,
        guests,
      }),
    [fleet, type, places.kind, place, area, guests],
  );

  /** Смена типа переписывает всё, что от него зависит. */
  function handleTypeChange(next: BoatTypeId) {
    setType(next);

    const nextPlaces = placesForBoatType(next, fleet, { regions, cities });
    if (place && !nextPlaces.options.some((item) => item.slug === place)) {
      setPlace(null);
    }
    // Акватория привязана к региону и к типу лодки — при смене типа сбрасываем.
    setArea(null);

    const limit = maxGuestsForType(fleet, next);
    setGuests((current) => (current && current > limit ? limit : current));

  }

  /** Смена региона обнуляет акваторию: она принадлежит прежнему. */
  function handlePlaceChange(next: string | null) {
    setPlace(next);
    setArea(null);
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
    if (place) params.set(places.kind, place);
    if (area) params.set("area", area);
    if (guests) params.set("guests", String(guests));
    if (from) params.set("from", from);
    if (to) params.set("to", to);
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
                {option.name} — {option.term}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>
            {places.kind === "city" ? "База" : "Направление"}
          </span>
          <select
            value={place ?? ""}
            onChange={(event) => handlePlaceChange(event.target.value || null)}
            className={styles.select}
          >
            <option value="">
              {places.kind === "city" ? "Любая" : "Любое"} —{" "}
              {pluralPlaces(places.options.length, places.kind)}
            </option>
            {places.options.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        {/* Акватория сужает выбранный регион; без региона выбирать не из чего. */}
        {availableAreas.length > 1 && (
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Акватория</span>
            <select
              value={area ?? ""}
              onChange={(event) => setArea(event.target.value || null)}
              className={styles.select}
            >
              {/* Без согласования с названием региона: род у них разный,
                  и «вся Байкал» с «весь Карелия» тут неизбежны. */}
              <option value="">Любая — {pluralAreas(availableAreas.length)}</option>
              {availableAreas.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} · {item.ports.join(", ")}
                </option>
              ))}
            </select>
          </label>
        )}

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
          {guestsNote && <span className={styles.hint}>{guestsNote}</span>}
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Даты</span>
          <DateRangePicker
            tone="dark"
            from={from}
            to={to}
            minDays={boatType?.minDays ?? 4}
            onChange={(next) => {
              setFrom(next.from);
              setTo(next.to);
            }}
          />
        </div>

        <button type="submit" className={styles.submit}>
          Показать {pluralYachtsAccusative(matches.length)}
        </button>

        <p className={styles.rule}>
          {boatType?.description} {boatType?.crewNoun} и команда входят
          в стоимость.
        </p>
      </form>
    </aside>
  );
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
