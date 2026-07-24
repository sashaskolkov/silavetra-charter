import styles from "./Footer.module.css";

const NAV_LINKS = [
  { label: "Правовая информация", href: "#legal" },
  { label: "Безопасность", href: "#safety" },
  { label: "Корпоративные регаты", href: "#corporate" },
  { label: "Магазин", href: "#shop" },
  { label: "Контакты", href: "#contacts" },
];

/** Блок 5. Подвал — повторяет структуру футера «Силы ветра». */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <nav className={styles.nav}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.social}>
          <a
            href="https://vk.com/silavetra"
            className={styles.socialLink}
            aria-label="ВКонтакте"
          >
            <VkIcon />
          </a>
          <a
            href="https://telegram.me/silavetrasila"
            className={styles.socialLink}
            aria-label="Telegram"
          >
            <TelegramIcon />
          </a>
        </div>

        <div className={styles.residency}>
          <QuantumValleyLogo />
          <p className={styles.residencyNote}>
            Резидент проекта ИНТЦ «Квантовая долина»
          </p>
        </div>

        <div className={styles.legal}>
          <p>© 2026 SilaVetra. All Rights Reserved.</p>
          <a href="#personal-data" className={styles.policy}>
            Политика по обработке персональных данных
          </a>
        </div>
      </div>
    </footer>
  );
}

/* --- Иконки --------------------------------------------------------------- */

function VkIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor" aria-hidden="true">
      <path d="M13.9 18.6c-6 0-9.7-4.2-9.8-11.1h3c.1 5.1 2.4 7.3 4.2 7.7V7.5h2.9v4.3c1.7-.2 3.5-2.2 4.1-4.3h2.8a8.3 8.3 0 0 1-3.7 5.4 8.6 8.6 0 0 1 4.3 5.7h-3.1c-.6-1.9-2.2-3.4-4.4-3.6v3.6h-.3Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="currentColor" aria-hidden="true">
      <path d="M21.6 5.4 3.9 12.2c-.9.4-.9 1 0 1.3l4.4 1.4 1.7 5.2c.2.6.4.8 1 .3l2.5-2.2 4.4 3.3c.8.4 1.3.2 1.5-.7l2.8-13c.3-1.1-.4-1.6-1.1-1.4h-.5Zm-2.3 3-8.1 7.3-.3 3.4-1.6-5 10-5.7Z" />
    </svg>
  );
}

/**
 * Знак «Квантовой долины» — упрощённая перерисовка:
 * градиентные пятна и подпись в белой плашке.
 */
function QuantumValleyLogo() {
  return (
    <svg width="132" height="76" viewBox="0 0 132 76" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="qv-a" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#6b6b6b" />
        </radialGradient>
        <radialGradient id="qv-b" cx="0.6" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#d9d9d9" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </radialGradient>
      </defs>

      <ellipse cx="52" cy="34" rx="26" ry="24" fill="url(#qv-b)" opacity="0.85" />
      <ellipse cx="76" cy="30" rx="30" ry="26" fill="url(#qv-a)" opacity="0.9" />
      <ellipse cx="66" cy="50" rx="22" ry="16" fill="url(#qv-b)" opacity="0.7" />

      <rect x="34" y="30" width="82" height="15" fill="#ffffff" />
      <text
        x="75"
        y="41"
        textAnchor="middle"
        fill="#0a0a0a"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1.2"
        fontFamily="var(--font-onest), sans-serif"
      >
        КВАНТОВАЯ
      </text>

      <rect x="46" y="46" width="58" height="15" fill="#ffffff" />
      <text
        x="75"
        y="57"
        textAnchor="middle"
        fill="#0a0a0a"
        fontSize="10"
        fontWeight="700"
        letterSpacing="1.2"
        fontFamily="var(--font-onest), sans-serif"
      >
        ДОЛИНА
      </text>
    </svg>
  );
}
