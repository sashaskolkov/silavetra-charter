"use client";

import { useMemo, useState } from "react";
import { pluralDays } from "@/data/catalog";
import {
  addDays,
  datePrompt,
  fromISO,
  monthGrid,
  monthTitle,
  shortDate,
  toISO,
  today,
  type DateField,
} from "@/lib/dates";
import styles from "./DateRangePicker.module.css";

/**
 * Календарь выбора дат аренды.
 *
 * Почему свой, а не `input[type=date]`. Системный календарь рисует
 * операционная система поверх страницы: он перекрывает подписи полей,
 * и человек, особенно когда календарь выезда открылся сам, не понимает,
 * какую дату у него спрашивают. Вставить надпись в системный календарь
 * нельзя — он вне нашего документа. Поэтому сетка своя, а подпись
 * «Выберите дату заезда» стоит прямо над ней и меняется по ходу выбора.
 *
 * Верхней границы срока нет ни у одного типа лодки — разница только
 * в минимуме: у спортивной сутки, у остальных четверо.
 */

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** Насколько далеко вперёд можно листать: год — с запасом на любой сезон. */
const MONTHS_AHEAD = 12;

type Props = {
  from: string;
  to: string;
  /** Минимальный срок аренды: у спортивной 1, у остальных 4. */
  minDays: number;
  onChange: (next: { from: string; to: string }) => void;
  /** Светлый попап навигатора или тёмный сайдбар поиска. */
  tone?: "light" | "dark";
};

export function DateRangePicker({
  from,
  to,
  minDays,
  onChange,
  tone = "light",
}: Props) {
  const now = today();

  /* Что выбираем следующим кликом. Заезд уже есть, выезда нет — значит,
     ждём выезд; это же состояние показывает подпись над сеткой. */
  const active: DateField = from && !to ? "to" : "from";

  const [cursor, setCursor] = useState(() => {
    const start = fromISO(from) ?? new Date();
    return { year: start.getFullYear(), month: start.getMonth() };
  });

  const days = useMemo(
    () => monthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );

  const limit = useMemo(() => {
    const edge = new Date();
    edge.setMonth(edge.getMonth() + MONTHS_AHEAD);
    return toISO(edge);
  }, []);

  /** Раньше сегодня не бронируют, а выезд — не раньше минимального срока. */
  const earliest = active === "to" && from ? addDays(from, minDays) : now;

  function shift(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function pick(day: string) {
    // Клик по дате раньше минимального выезда читаем как новый заезд:
    // человек передумал, а не ошибся.
    if (active === "to" && from && day >= addDays(from, minDays)) {
      onChange({ from, to: day });
      return;
    }
    onChange({ from: day, to: "" });
  }

  const canGoBack =
    new Date(cursor.year, cursor.month, 1) > new Date(new Date().setDate(1));

  return (
    <div className={`${styles.root} ${styles[`root--${tone}`]}`}>
      {/* Подпись внутри календаря: системный оверлей её больше не закрывает. */}
      <p className={styles.prompt} aria-live="polite">
        <span className={styles.promptDot} />
        {datePrompt(active)}
      </p>

      <div className={styles.head}>
        <button
          type="button"
          className={styles.nav}
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label="Предыдущий месяц"
        >
          <Arrow direction="left" />
        </button>
        <span className={styles.month}>
          {monthTitle(cursor.year, cursor.month)}
        </span>
        <button
          type="button"
          className={styles.nav}
          onClick={() => shift(1)}
          aria-label="Следующий месяц"
        >
          <Arrow direction="right" />
        </button>
      </div>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.grid} role="grid">
        {days.map((day) => {
          const date = fromISO(day)!;
          const outside = date.getMonth() !== cursor.month;
          const disabled = day < earliest || day > limit;
          const isFrom = day === from;
          const isTo = day === to;
          const between = Boolean(from && to && day > from && day < to);

          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              className={[
                styles.day,
                outside ? styles["day--outside"] : "",
                between ? styles["day--between"] : "",
                isFrom || isTo ? styles["day--edge"] : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={disabled}
              aria-current={day === now ? "date" : undefined}
              onClick={() => pick(day)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className={styles.summary}>
        {from ? (
          <>
            <span className={styles.summaryValue}>{shortDate(from)}</span>
            <span className={styles.summaryDash}>—</span>
            <span
              className={to ? styles.summaryValue : styles["summaryValue--empty"]}
            >
              {to ? shortDate(to) : "выберите выезд"}
            </span>
          </>
        ) : (
          <span className={styles["summaryValue--empty"]}>
            Аренда от {pluralDays(minDays)} — выберите заезд
          </span>
        )}

        {from && (
          <button
            type="button"
            className={styles.reset}
            onClick={() => onChange({ from: "", to: "" })}
          >
            Сбросить
          </button>
        )}
      </p>
    </div>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
