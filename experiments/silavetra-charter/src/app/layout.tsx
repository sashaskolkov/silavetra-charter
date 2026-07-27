import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { ChatProvider } from "@/components/ChatContext";
import { ChatWidget } from "@/components/ChatWidget";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["cyrillic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Сила ветра · Аренда яхт с капитаном и командой",
  description:
    "Crewed charter по России: спортивные яхты на день на базах «Силы ветра», круизные и моторные — от четырёх дней. Карелия, Арктика, Байкал, Дальний Восток, Чёрное море, Балтика.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={onest.variable}>
      <body>
        {/* Чат живёт в разметке страницы, а не в каждом шаблоне: так он
            есть и на главной, и в подборе, и на карточке лодки. Провайдер
            обнимает и контент: кнопки со страницы тоже открывают панель. */}
        <ChatProvider>
          {children}
          <ChatWidget />
        </ChatProvider>
      </body>
    </html>
  );
}
