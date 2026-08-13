"use client";

/* 새 채팅을 시작하면 이전 대화가 "최근 항목"으로 저장되는 대화 기록 (기존 AI 사이트의 히스토리 사이드바처럼).
   localStorage에 세션 목록으로 저장하고, 사이드바에서 눌러 다시 불러올 수 있다. */

export interface ChatMessage {
  id: number;
  role: "user" | "ai";
  text: string;
  usedMl?: number;
  savedMl?: number;
  deckNames?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface ChatHistoryStore {
  sessions: ChatSession[];
}

const KEY = "aqu-chat-history-v1";
const EMPTY: ChatHistoryStore = { sessions: [] };

export function loadChatHistory(): ChatHistoryStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as ChatHistoryStore;
    return { sessions: parsed.sessions ?? [] };
  } catch {
    return EMPTY;
  }
}

export function saveChatHistory(store: ChatHistoryStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

/** 첫 사용자 메시지를 짧게 잘라 세션 제목으로 쓴다 */
export function titleFromMessages(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user")?.text.trim();
  if (!first) return "새 대화";
  return first.length > 24 ? `${first.slice(0, 24)}…` : first;
}

/** id가 있으면 갱신, 없으면 새로 추가 — 목록 맨 앞으로 올라온다 */
export function upsertChatSession(
  store: ChatHistoryStore,
  session: { id: string; messages: ChatMessage[] },
): ChatHistoryStore {
  const entry: ChatSession = {
    id: session.id,
    title: titleFromMessages(session.messages),
    messages: session.messages,
    updatedAt: Date.now(),
  };
  const rest = store.sessions.filter((s) => s.id !== session.id);
  return { sessions: [entry, ...rest] };
}

export function removeChatSession(store: ChatHistoryStore, id: string): ChatHistoryStore {
  return { sessions: store.sessions.filter((s) => s.id !== id) };
}
