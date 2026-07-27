"use client";

import { useState } from "react";
import {
  COOK_PRICE_PER_DAY,
  boatsNote,
  formatPrice,
  pluralDays,
} from "@/data/catalog";
import styles from "./PriceWithCook.module.css";

type Props = {
  pricePerDay: number;
  days: number;
  /** Срок не выбран пользователем, а взят как минимальный для типа. */
  assumed: boolean;
  /** Есть ли на лодке камбуз и место для повара. */
  cookAvailable: boolean;
  /**
   * Сколько лодок нужно компании. Больше одной бывает только у спортивных:
   * в четырёхместный корпус компания не влезает, и берут вторую.
   */
  boats?: number;
  /** Вместимость одной лодки — для подписи о числе лодок. */
  capacity?: number;
  size?: "normal" | "large";
};

/**
 * Цена за срок с необязательным поваром.
 *
 * Повар — не услуга в стоимости, а галка при бронировании: она доступна
 * только на лодках от 12 метров и добавляет фиксированную сумму к суткам.
 */
export function PriceWithCook({
  pricePerDay,
  days,
  assumed,
  cookAvailable,
  boats = 1,
  capacity = 0,
  size = "normal",
}: Props) {
  const [withCook, setWithCook] = useState(false);

  const perDay = pricePerDay + (withCook ? COOK_PRICE_PER_DAY : 0);

  return (
    <div>
      <p className={styles.label}>
        {assumed ? `Минимум ${pluralDays(days)}` : `За ${pluralDays(days)}`}
      </p>

      <p
        className={`${styles.price} ${
          size === "large" ? styles["price--large"] : ""
        }`}
      >
        {formatPrice(perDay * days * boats)}
      </p>

      <p className={styles.term}>
        {pluralDays(days)} · {formatPrice(perDay)} в сутки
        {withCook ? " с поваром" : ""}
        {/* «за лодку» уводим на свою строку: иначе оно липнет к сумме
            и читается как часть цены, а это уточнение к ней. */}
        {boats > 1 && <span className={styles.termLine}>за лодку</span>}
      </p>

      {/* Одна строка, без подробностей: карточка и так плотная. */}
      {boats > 1 && capacity > 0 && (
        <p className={styles.boats}>{boatsNote(boats, capacity)}</p>
      )}

      {cookAvailable && (
        <label
          className={`${styles.cook} ${withCook ? styles["cook--on"] : ""}`}
        >
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={withCook}
            onChange={(event) => setWithCook(event.target.checked)}
          />
          <span className={styles.box} aria-hidden="true">
            <CheckIcon />
          </span>
          <span className={styles.cookText}>
            <span className={styles.cookTitle}>Добавить повара</span>
            <span className={styles.cookPrice}>
              +{formatPrice(COOK_PRICE_PER_DAY)} в сутки
            </span>
          </span>
        </label>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="m2.5 6.2 2.4 2.4L9.6 3.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
