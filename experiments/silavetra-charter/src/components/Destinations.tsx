import Image from "next/image";
import Link from "next/link";
import {
  FEATURED,
  formatPrice,
  pluralYachts,
  type Featured,
} from "@/data/catalog";
import { loadFleet } from "@/data/fleet";
import { asset } from "@/lib/asset";
import styles from "./Destinations.module.css";

/** Широкие карточки открывают и закрывают композицию — как в оригинале. */
const WIDE_POSITIONS = new Set([0, 5]);

type Card = {
  featured: Featured;
  name: string;
  /**
   * Надпись над названием — только у акватории: она называет её регион
   * и объясняет, где искать «Камчатку». Региону такая строка не нужна,
   * он и есть верхний уровень.
   */
  note: string | null;
  href: string;
  yachts: number;
  minPrice: number | null;
};

/** Блок 4. Популярные направления — самые зрелищные экспедиции. */
export function Destinations() {
  const { yachts, regions, areas } = loadFleet();

  /*
   * Считаем только круизные: карточка ведёт в подбор круизных яхт,
   * и число на ней должно совпасть с тем, что человек там увидит.
   */
  const cruise = yachts.filter((yacht) => yacht.type === "cruise");

  const cards = FEATURED.map((featured): Card | null => {
    if (featured.kind === "region") {
      const region = regions.find((item) => item.slug === featured.slug);
      if (!region) return null;

      const fleet = cruise.filter((yacht) => yacht.region === region.slug);
      return {
        featured,
        name: region.name,
        note: null,
        href: `/search?type=cruise&region=${region.slug}`,
        yachts: fleet.length,
        minPrice: cheapest(fleet),
      };
    }

    const area = areas.find((item) => item.slug === featured.slug);
    if (!area) return null;

    const fleet = cruise.filter((yacht) => yacht.area === area.slug);
    return {
      featured,
      name: area.name,
      note: area.regionName,
      // Регион ведёт в подбор, акватория его сразу сужает: человек
      // попадает ровно туда, что видел на карточке.
      href: `/search?type=cruise&region=${area.region}&area=${area.slug}`,
      yachts: fleet.length,
      minPrice: cheapest(fleet),
    };
  }).filter((card): card is Card => card !== null);

  return (
    <section className={styles.section} id="destinations">
      <div className="container">
        <header className={styles.head}>
          <h2 className={`headline ${styles.title}`}>Популярные направления</h2>
          <p className={styles.intro}>
            Самое интересное начинается там, где заканчиваются дороги. Поморские
            острова, вулканы Камчатки, Ленские столбы — всё это доступно под
            парусом, с капитаном и командой на борту.
          </p>
        </header>

        <div className={styles.grid}>
          {cards.map((card, index) => {
            const wide = WIDE_POSITIONS.has(index);

            return (
              <Link
                key={`${card.featured.kind}-${card.featured.slug}`}
                href={card.href}
                className={`${styles.card} ${wide ? styles["card--wide"] : ""}`}
              >
                <Image
                  src={asset(card.featured.photo)}
                  alt={`${card.name}: ${card.featured.tagline}`}
                  fill
                  sizes={
                    wide
                      ? "(max-width: 1000px) 100vw, 50vw"
                      : "(max-width: 620px) 100vw, 25vw"
                  }
                  className={styles.photo}
                />

                <div className={styles.body}>
                  {card.note && <p className={styles.note}>{card.note}</p>}
                  <h3 className={styles.name}>{card.name}</h3>
                  <p className={styles.tagline}>{card.featured.tagline}</p>
                  <p className={styles.meta}>
                    <span>{pluralYachts(card.yachts)}</span>
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

function cheapest(fleet: { pricePerDay: number }[]): number | null {
  if (fleet.length === 0) return null;
  return Math.min(...fleet.map((yacht) => yacht.pricePerDay));
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
