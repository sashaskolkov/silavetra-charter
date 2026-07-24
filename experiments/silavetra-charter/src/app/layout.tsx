import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Сила ветра · Аренда яхт с капитаном и командой",
  description:
    "Crewed charter по России: спортивные яхты на день на базах «Силы ветра», круизные и моторные — от четырёх дней. Ладога, Белое море, Камчатка, Якутия, Сахалин, Онего.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={onest.variable}>
      <body>{children}</body>
    </html>
  );
}
