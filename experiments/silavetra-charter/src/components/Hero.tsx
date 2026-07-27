import Image from "next/image";
import { ChatTrigger } from "./ChatContext";
import { asset } from "@/lib/asset";
import styles from "./Hero.module.css";

/* Переносы расставлены вручную: строки должны ломаться по смыслу,
   а не по ширине колонки. */
const STATS = [
  {
    value: "675",
    label: "парусных яхт\nи моторных лодок\nпо всей России",
  },
  {
    value: "45",
    label: "водных регионов\nнашей страны:\nот Балтики до Сахалина",
  },
  {
    value: "20",
    label: "городов России\nсо спортивным флотом\nи 8 баз «Силы ветра»",
  },
];

/**
 * Блок 2. Вступительный экран.
 * Смысловое ядро: в России чартер всегда с экипажем — и это преимущество.
 */
export function Hero() {
  return (
    <section className={styles.hero}>
      <WaveBackdrop />

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.badge}>
            <span className={styles.badgeDot} />
            Аренда яхты с капитаном
          </p>

          <h1 className={`display ${styles.title}`}>
            Приключения
            <br />
            под парусом
            <br />
            <span className="accent">по всей России</span>
          </h1>

          <p className={`lead ${styles.text}`}>
            Мы создали первый в России сервис бронирования яхт для того, чтобы вы
            смогли изучать наши города и природу под парусом. Все яхты и капитаны
            проверены командой «Силы Ветра».
          </p>

          <div className={styles.actions}>
            <a href="#navigator" className="btn btn--accent">
              Выбрать яхту
            </a>
            <ChatTrigger className="btn btn--ghost">Связаться с нами</ChatTrigger>
          </div>

        </div>

        <figure className={styles.visual}>
          <Image
            src={asset("/photos/hero-deck.jpg")}
            alt="Вид с палубы идущей под парусом яхты на лесистый остров"
            fill
            priority
            sizes="(max-width: 960px) 100vw, 45vw"
            className={styles.visualArt}
          />
          <figcaption className={styles.caption}>
            <span>На борту круизной яхты</span>
            <span className={styles.captionMuted}>экспедиция от 4 дней</span>
          </figcaption>
        </figure>

        <dl className={styles.stats}>
          {STATS.map((stat) => (
            <div key={stat.value}>
              <dt className="visually-hidden">{stat.label}</dt>
              <dd style={{ margin: 0 }}>
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel} aria-hidden="true">
                  {stat.label.split("\n").map((line, i) => (
                    <span key={i} style={{ display: "block" }}>
                      {line}
                    </span>
                  ))}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* --- Фоновый паттерн ------------------------------------------------------ */

function WaveBackdrop() {
  return (
    <svg
      className={styles.waves}
      viewBox="0 0 1440 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <path d="M0 0h1440v90c-240 0-240 60-480 60S720 90 480 90 240 0 0 0Z" />
        <path
          d="M0 200h1440v90c-240 0-240 60-480 60s-240-60-480-60-240-60-480-90Z"
          opacity="0.7"
        />
        <path
          d="M0 420h1440v90c-240 0-240 60-480 60s-240-60-480-60-240-60-480-90Z"
          opacity="0.45"
        />
      </g>
    </svg>
  );
}
