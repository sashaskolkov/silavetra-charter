"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "./ChatContext";
import styles from "./ChatWidget.module.css";

/**
 * Виджет связи с оператором — плавающая кнопка на всех страницах.
 *
 * Пока это витрина: работают мессенджеры, а собственная переписка ждёт
 * бэкенда. Сайт собирается статически для GitHub Pages, отправлять
 * сообщение некуда, и делать вид, что оператор их получает, нечестно —
 * поэтому «Написать» честно говорит, что канал ещё не подключён.
 *
 * Когда появится Telegram, меняется только ветка `mode === "compose"`.
 */

const TELEGRAM = "https://telegram.me/silavetrasila";
const WHATSAPP = "https://wa.me/78005553535";

type Mode = "menu" | "compose";

export function ChatWidget() {
  const { open, closeChat, toggleChat } = useChat();
  const [mode, setMode] = useState<Mode>("menu");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /*
   * Закрываем панель кликом вне её и по Escape. Полноэкранной подложки
   * нет намеренно: она перехватила бы тот же клик, которым панель открывают,
   * и перекрыла бы страницу — а чат не должен мешать читать сайт.
   */
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      /* Кнопки со страницы, которые сами зовут чат: иначе панель успела бы
         закрыться на pointerdown и тут же открыться на click. */
      if (target instanceof Element && target.closest("[data-chat-trigger]")) return;
      closeChat();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      closeChat();
      buttonRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeChat]);

  return (
    <div className={styles.root}>
      {open && (
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-label="Чат с «Силой ветра»"
        >
          <header className={styles.head}>
            <div className={styles.avatars} aria-hidden="true">
              <span className={styles.avatar}>
                <ChevronMark />
              </span>
              <span className={styles.avatar}>
                <ChevronMark />
              </span>
              <span className={styles.avatar}>
                <ChevronMark />
              </span>
            </div>

            <p className={styles.title}>Сила ветра</p>
            <p className={styles.subtitle}>Мы тут и готовы помочь</p>

            <button
              type="button"
              className={styles.collapse}
              onClick={closeChat}
              aria-label="Свернуть чат"
            >
              <ChevronDown />
            </button>
          </header>

          <div className={styles.body}>
            <div className={styles.channels}>
              <ChannelButton
                label="Написать"
                active={mode === "compose"}
                onClick={() =>
                  setMode((current) =>
                    current === "compose" ? "menu" : "compose",
                  )
                }
              >
                <PencilIcon />
              </ChannelButton>

              <ChannelLink label="Telegram" href={TELEGRAM}>
                <TelegramIcon />
              </ChannelLink>

              <ChannelLink label="WhatsApp" href={WHATSAPP}>
                <WhatsAppIcon />
              </ChannelLink>
            </div>

            {mode === "compose" ? (
              <div className={styles.notice}>
                <p className={styles.noticeTitle}>Переписка ещё не подключена</p>
                <p className={styles.noticeText}>
                  Оператор отвечает в мессенджерах — выберите Telegram или
                  WhatsApp. Можно и{" "}
                  <a href="mailto:allo@silavetra.com" className={styles.link}>
                    написать письмо
                  </a>
                  .
                </p>
              </div>
            ) : (
              <div className={styles.history}>
                <HistoryIcon />
                <p className={styles.historyTitle}>Мы с вами ещё не общались</p>
                <p className={styles.historyText}>
                  Здесь будет история ваших диалогов
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        className={styles.launcher}
        onClick={toggleChat}
        aria-expanded={open}
        aria-label={open ? "Свернуть чат" : "Открыть чат с оператором"}
      >
        {open ? <ChevronDown /> : <EnvelopeIcon />}
      </button>
    </div>
  );
}

/* --- Каналы связи --------------------------------------------------------- */

function ChannelButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={styles.channel}
      onClick={onClick}
      aria-pressed={active}
    >
      <span
        className={`${styles.channelIcon} ${
          active ? styles["channelIcon--active"] : styles["channelIcon--ink"]
        }`}
      >
        {children}
      </span>
      <span className={styles.channelLabel}>{label}</span>
    </button>
  );
}

function ChannelLink({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={styles.channel}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
    >
      <span className={styles.channelIcon}>{children}</span>
      <span className={styles.channelLabel}>{label}</span>
    </a>
  );
}

/* --- Иконки --------------------------------------------------------------- */

/** Знак «Силы ветра» — та же стрелка, что в логотипе шапки. */
function ChevronMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="m7 5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Конверт на кружке вызова: кнопка обещает переписку, а не переход. */
function EnvelopeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="2.75"
        y="5"
        width="18.5"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m4 7 8 5.5L20 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="m5 8 5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M13.4 3.6a1.9 1.9 0 0 1 2.7 2.7L7.5 15 4 16l1-3.5 8.4-8.9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 26 26" fill="currentColor" aria-hidden="true">
      <path d="M21.6 5.4 3.9 12.2c-.9.4-.9 1 0 1.3l4.4 1.4 1.7 5.2c.2.6.4.8 1 .3l2.5-2.2 4.4 3.3c.8.4 1.3.2 1.5-.7l2.8-13c.3-1.1-.4-1.6-1.1-1.4h-.5Zm-2.3 3-8.1 7.3-.3 3.4-1.6-5 10-5.7Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3.1 4c-.2 0-.5 0-.7.4-.2.4-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.8 4.3 3.8 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.2.1-1.3l-.6-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.2 0-.4.1-.5l.4-.5.3-.5v-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.1Z" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      className={styles.historyIcon}
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10.5A3.5 3.5 0 0 1 7.5 7h18a3.5 3.5 0 0 1 3.5 3.5v10a3.5 3.5 0 0 1-3.5 3.5H14l-6 5v-5h-.5A3.5 3.5 0 0 1 4 20.5v-10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M33 15h3.5A3.5 3.5 0 0 1 40 18.5v10a3.5 3.5 0 0 1-3.5 3.5H36v5l-6-5H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="15" r="1.4" fill="currentColor" />
      <circle cx="17" cy="15" r="1.4" fill="currentColor" />
      <circle cx="22" cy="15" r="1.4" fill="currentColor" />
    </svg>
  );
}
