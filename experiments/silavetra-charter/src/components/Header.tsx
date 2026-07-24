import Link from "next/link";
import styles from "./Header.module.css";

/** Блок 1. Шапка: логотип, вход в поиск, связь, кабинет, валюта и язык. */
export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo} aria-label="Сила ветра — на главную">
          <LogoMark />
          <span className={styles.logoText}>Сила ветра</span>
        </Link>

        <div className={styles.actions}>
          <a href="#navigator" className={styles.search}>
            <SearchIcon />
            <span className={styles.searchLabel}>Поиск яхт</span>
          </a>

          <a
            href="tel:+78005553535"
            className={`${styles.iconBtn} ${styles["iconBtn--accent"]}`}
            aria-label="Позвонить"
          >
            <PhoneIcon />
          </a>

          <a
            href="mailto:allo@silavetra.com"
            className={`${styles.iconBtn} ${styles.mail}`}
            aria-label="Написать письмо"
          >
            <MailIcon />
          </a>

          <a href="#account" className={styles.account}>
            <AccountIcon />
            <span className={styles.accountLabel}>Личный кабинет</span>
          </a>

          <button type="button" className={styles.meta}>
            <span className={styles.metaSymbol}>₽</span> RUB
          </button>

          <button type="button" className={styles.meta}>
            <span className={styles.metaSymbol}>🇷🇺</span> RU
          </button>
        </div>
      </div>
    </header>
  );
}

/* --- Иконки --------------------------------------------------------------- */

function LogoMark() {
  return (
    <svg
      className={styles.logoMark}
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="12" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m10.5 8 5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12.5 12.5 16 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M6.2 2.6 7.6 5.5 6.1 7c.8 1.7 2.2 3.1 3.9 3.9l1.5-1.5 2.9 1.4v2.6c0 .6-.5 1.1-1.1 1.1A11.7 11.7 0 0 1 2.5 3.7c0-.6.5-1.1 1.1-1.1h2.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="4.5"
        width="15"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m3.5 6 6.5 4.5L16.5 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="9" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.6 17.8a6 6 0 0 1 10.8 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
