import Image from "next/image";
import Link from "next/link";
import {
  FEATURED_META,
  FEATURED_REGION_SLUGS,
  formatPrice,
  pluralYachts,
} from "@/data/catalog";
import { loadFleet } from "@/data/fleet";
import { asset } from "@/lib/asset";
import styles from "./Destinations.module.css";

/** Широкие карточки открывают и закрывают композицию — как в оригинале. */
const WIDE_POSITIONS = new Set([0, 5]);

/** Блок 4. Популярные направления — самые зрелищные экспедиции. */
export function Destinations() {
  const { yachts, regions } = loadFleet();

  const cards = FEATURED_REGION_SLUGS.map((slug) => {
    const region = regions.find((item) => item.slug === slug);
    const meta = FEATURED_META[slug];
    const fleet = yachts.filter((yacht) => yacht.region === slug);
    const minPrice = fleet.length
      ? Math.min(...fleet.map((yacht) => yacht.pricePerDay))
      : null;
    return { region, meta, fleet, minPrice };
  }).filter((card) => card.region);

  return (
    <section className={styles.section} id="destinations">
      <div className="container">
        <header className={styles.head}>
          <h2 className={`headline ${styles.title}`}>Популярные направления</h2>
          <p className={styles.intro}>
            Самое интересное начинается там, где заканчиваются дороги. Ладожские
            шхеры, поморские острова, вулканы Камчатки — всё это доступно под
            парусом, с капитаном и командой на борту.
          </p>
        </header>

        <div className={styles.grid}>
          {cards.map((card, index) => {
            const region = card.region!;
            const wide = WIDE_POSITIONS.has(index);

            return (
              <Link
                key={region.slug}
                href={`/search?type=cruise&region=${region.slug}`}
                className={`${styles.card} ${wide ? styles["card--wide"] : ""}`}
              >
                <Image
                  src={asset(card.meta.photo)}
                  alt={`${region.name}: ${card.meta.tagline}`}
                  fill
                  sizes={wide ? "(max-width: 1000px) 100vw, 50vw" : "(max-width: 620px) 100vw, 25vw"}
                  className={styles.photo}
                />

                <div className={styles.body}>
                  <h3 className={styles.name}>{region.name}</h3>
                  <p className={styles.tagline}>{card.meta.tagline}</p>
                  <p className={styles.meta}>
                    <span>{pluralYachts(card.fleet.length)}</span>
                    {card.minPrice !== null && (
                      <>
                        <span className={styles.metaDot} />
                        <span>от {formatPrice(card.minPrice)} в сутки</span>
                      </>
                    )}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={styles.footer}>
          <Link href="/search?type=cruise" className={styles.footerLink}>
            Все направления
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
