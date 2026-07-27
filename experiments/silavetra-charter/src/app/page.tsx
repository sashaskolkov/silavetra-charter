import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Navigator } from "@/components/Navigator";
import { Destinations } from "@/components/Destinations";
import { Footer } from "@/components/Footer";
import { loadFleet } from "@/data/fleet";

export default function Home() {
  const { yachts, regions, cities } = loadFleet();

  // Клиенту отдаём только срез для счётчика — не весь каталог.
  const fleet = yachts.map(
    ({ type, region, area, city, guests, fleetSize }) => ({
      type,
      region,
      area,
      city,
      guests,
      fleetSize,
    }),
  );

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Navigator regions={regions} cities={cities} fleet={fleet} />
        <Destinations />
      </main>
      <Footer />
    </>
  );
}
