"use client";

import { useState } from "react";
import styles from "./yacht.module.css";

/**
 * Заявка на конкретную яхту.
 *
 * ВАЖНО: заявка никуда не уходит и нигде не сохраняется — это макет.
 * Проверка полей идёт на клиенте, потому что сайт собирается статически
 * и серверных обработчиков у него нет. Когда появится настоящий приёмник
 * (CRM, почта, телеграм-бот), запрос встаёт на место комментария ниже.
 */

const PHONE = /^\+?[\d\s()-]{10,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = Partial<Record<"name" | "contact", string>>;

export function RequestForm({ yachtId }: { yachtId: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const contact = String(data.get("contact") ?? "").trim();

    const next: Errors = {};

    if (name.length < 2) {
      next.name = "Как к вам обращаться?";
    }

    if (contact === "") {
      next.contact = "Оставьте телефон или почту — иначе мы не ответим";
    } else if (!PHONE.test(contact) && !EMAIL.test(contact)) {
      next.contact = "Похоже на опечатку: нужен телефон или адрес почты";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    // Здесь будет отправка заявки. Пока данные не покидают браузер.
    void yachtId;

    setErrors({});
    setDone(`${name}, спасибо. Соберём всё по этой яхте и вернёмся к вам.`);
  }

  if (done) {
    return (
      <div className={styles.done} role="status">
        <CheckIcon />
        <p className={styles.doneTitle}>Заявка принята</p>
        <p className={styles.doneText}>{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>Как вас зовут</span>
        <input
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Александр"
          className={styles.input}
          aria-invalid={errors.name ? true : undefined}
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Телефон или почта</span>
        <input
          name="contact"
          type="text"
          autoComplete="tel"
          placeholder="+7 900 000-00-00"
          className={styles.input}
          aria-invalid={errors.contact ? true : undefined}
        />
        {errors.contact && (
          <span className={styles.error}>{errors.contact}</span>
        )}
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>
          Что важно узнать <span className={styles.optional}>— по желанию</span>
        </span>
        <textarea
          name="comment"
          rows={3}
          placeholder="Даты, маршрут, сколько нас"
          className={styles.textarea}
        />
      </label>

      <button type="submit" className={styles.submit}>
        Оставить заявку
      </button>

      <p className={styles.consent}>
        Нажимая кнопку, вы соглашаетесь с политикой по обработке персональных
        данных.
      </p>
    </form>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m8.5 14.5 3.5 3.5 7.5-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
