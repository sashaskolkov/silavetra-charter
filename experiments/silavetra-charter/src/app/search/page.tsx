import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { loadFleet } from "@/data/fleet";
import { SearchResults } from "./SearchResults";
import styles from "./search.module.css";

export const metadata: Metadata = {
  title: "Подбор яхты · Сила ветра",
};

/**
 * Оболочка страницы подбора.
 *
 * Каталог отдаётся из сборки, а разбор строки запроса живёт в браузере:
 * при статическом экспорте параметров на сервере ещё не существует.
 * useSearchParams обязан быть внутри Suspense — иначе сборка падает.
 */
export default function SearchPage() {
  const { yachts, regions, areas, cities } = loadFleet();

  return (
    <>
      <Header />

      <main className={`container ${styles.page}`}>
        <Suspense fallback={<p className={styles.count}>Загружаем каталог…</p>}>
          <SearchResults
            yachts={yachts}
            regions={regions}
            areas={areas}
            cities={cities}
          />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
