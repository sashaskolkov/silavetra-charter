import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getYacht, loadFleet } from "@/data/fleet";
import {
  crewLabel,
  getBoatType,
  hullLabel,
  pluralCabins,
} from "@/data/catalog";
import { PriceWithCook } from "@/components/PriceWithCook";
import { asset } from "@/lib/asset";
import { RequestForm } from "./RequestForm";
import styles from "./yacht.module.css";

type PageProps = {
  // В Next 16 params — промис, его обязательно нужно дождаться.
  params: Promise<{ id: string }>;
};

/** Все 170 лодок известны на сборке — страницы можно отрендерить заранее. */
export function generateStaticParams() {
  return loadFleet().yachts.map((yacht) => ({ id: yacht.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const yacht = getYacht(id);
  if (!yacht) return { title: "Яхта не найдена · Сила ветра" };
  return {
    title: `${yacht.name} · ${yacht.areaName} · Сила ветра`,
    description: `${yacht.model}, ${yacht.lengthM} м, до ${yacht.guests} гостей. ${yacht.areaName}, ${yacht.port} — ${yacht.regionName}.`,
  };
}

export default async function YachtPage({ params }: PageProps) {
  const { id } = await params;
  const yacht = getYacht(id);
  if (!yacht) notFound();

  const boatType = getBoatType(yacht.type);
  const minDays = boatType?.minDays ?? 4;
  const hull = hullLabel(yacht.hull);

  return (
    <>
      <Header />

      <main className={`container ${styles.page}`}>
        <nav className={styles.crumbs}>
          <Link href="/" className={styles.crumbLink}>
            Главная
          </Link>
          <span>—</span>
          <Link
            href={`/search?type=${yacht.type}`}
            className={styles.crumbLink}
          >
            {boatType?.name}
          </Link>
          <span>—</span>
          {/* Спортивную лодку ищут по базе, остальные — по региону:
              крошка должна вести туда же, откуда человек пришёл. */}
          {yacht.type === "sport" ? (
            <Link
              href={`/search?type=${yacht.type}&city=${yacht.city}`}
              className={styles.crumbLink}
            >
              {yacht.port}
            </Link>
          ) : (
            <>
              <Link
                href={`/search?type=${yacht.type}&region=${yacht.region}`}
                className={styles.crumbLink}
              >
                {yacht.regionName}
              </Link>
              <span>—</span>
              <Link
                href={`/search?type=${yacht.type}&region=${yacht.region}&area=${yacht.area}`}
                className={styles.crumbLink}
              >
                {yacht.areaName}
              </Link>
            </>
          )}
          <span>—</span>
          <span>{yacht.name}</span>
        </nav>

        <div className={styles.notice} role="note">
          <InfoIcon />
          <p className={styles.noticeText}>
            Сейчас мы не располагаем всей информацией об этой яхте. Оставьте
            ваши контакты — мы всё узнаем и сразу вам расскажем.
          </p>
        </div>

        <div className={styles.layout}>
          <div>
            <figure className={styles.media}>
              <span className={styles.condition}>
                <StarIcon />
                Состояние {yacht.condition} из 5
              </span>
              <Image
                src={asset(yacht.photo)}
                alt={`${yacht.name} — ${yacht.model}`}
                fill
                priority
                sizes="(max-width: 1000px) 100vw, 60vw"
                className={styles.photo}
              />
            </figure>

            <header className={styles.head}>
              <h1 className="headline">{yacht.name}</h1>
              <p className={styles.model}>{yacht.model}</p>

              <p className={styles.place}>
                <PinIcon />
                {yacht.areaName}, {yacht.port}
                <span className={styles.placeRegion}>{yacht.regionName}</span>
              </p>

              <div className={styles.tags}>
                <span className={styles.tag}>
                  <AnchorIcon />
                  {crewLabel(yacht.crew, yacht.type)}
                </span>
                <span className={`${styles.tag} ${styles["tag--muted"]}`}>
                  Аренда {boatType?.term}
                </span>
              </div>
            </header>

            <div className={styles.specs}>
              <Spec label="Длина" value={`${yacht.lengthM} м`} />
              <Spec label="Гостей" value={`до ${yacht.guests}`} />
              <Spec
                label="Каюты"
                value={yacht.cabins > 0 ? pluralCabins(yacht.cabins) : "нет"}
              />
              {/* Корпус есть только у спортивных, санузел — только там,
                  где он вообще предусмотрен. Проверяем сами значения,
                  а не тип лодки: так строка не соврёт ни при каких данных. */}
              {hull ? (
                <Spec label="Корпус" value={hull} />
              ) : (
                yacht.heads > 0 && (
                  <Spec label="Санузлы" value={String(yacht.heads)} />
                )
              )}
            </div>
          </div>

          <aside className={styles.aside}>
            <div className={styles.priceBox}>
              <PriceWithCook
                pricePerDay={yacht.pricePerDay}
                days={minDays}
                assumed
                cookAvailable={yacht.cookAvailable}
                size="large"
              />
            </div>

            <RequestForm yachtId={yacht.id} />
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.spec}>
      <p className={styles.specLabel}>{label}</p>
      <p className={styles.specValue}>{value}</p>
    </div>
  );
}

/* --- Иконки --------------------------------------------------------------- */

function InfoIcon() {
  return (
    <svg
      className={styles.noticeIcon}
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="9.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11 10v5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="11" cy="6.9" r="1.15" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="m6.5 1.5 1.5 3.1 3.4.5-2.5 2.4.6 3.4-3-1.6-3 1.6.6-3.4L1.6 5.1l3.4-.5L6.5 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      className={styles.placeIcon}
      width="17"
      height="17"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 14.5s5-4.4 5-8.3A5 5 0 0 0 3 6.2c0 3.9 5 8.3 5 8.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="6.2" r="1.9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function AnchorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="2.6" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M7 4.2v8M3.4 6.2h7.2M2 9.4a5 5 0 0 0 10 0"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
