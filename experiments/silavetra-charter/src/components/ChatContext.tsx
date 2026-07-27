"use client";

import { createContext, useContext, useMemo, useState } from "react";

/**
 * Общее состояние чата: сам виджет висит в углу страницы, а открывать его
 * могут кнопки из любого блока — например «Связаться с нами» в первом экране.
 *
 * Кнопки-открывашки помечены атрибутом data-chat-trigger: по нему виджет
 * отличает «свой» клик от клика вне панели, который её закрывает.
 */

type ChatContextValue = {
  open: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<ChatContextValue>(
    () => ({
      open,
      openChat: () => setOpen(true),
      closeChat: () => setOpen(false),
      toggleChat: () => setOpen((current) => !current),
    }),
    [open],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat доступен только внутри <ChatProvider>");
  }
  return context;
}

/** Кнопка, открывающая плавающий чат. Оформление задаёт вызывающий блок. */
export function ChatTrigger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { openChat } = useChat();

  return (
    <button type="button" className={className} data-chat-trigger onClick={openChat}>
      {children}
    </button>
  );
}
