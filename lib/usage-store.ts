/** 사용 기록 저장소 — 플로우차트 [기본 세팅]의 하루치 냉각수 사용량 추적 (localStorage) */

import { DAILY_LIMIT } from "./water";

export interface DayRecord {
  used: number; // 그날 사용한 냉각수 (mL)
  chats: number; // 보낸 질문 수
  helperUses: number; // 프롬프트 도우미 사용 횟수
}

export interface UsageStore {
  history: Record<string, DayRecord>; // key: YYYY-MM-DD
}

const KEY = "aqu-usage-v1";

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadStore(): UsageStore {
  if (typeof window === "undefined") return { history: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as UsageStore;
  } catch {
    /* 손상된 데이터는 초기화 */
  }
  // 첫 방문: 지난 6일을 데모 데이터로 시드 (기획서 그래프 수치)
  // 하루 한도 대비 비율로 적어둬서 DAILY_LIMIT을 바꿔도 그래프 모양이 그대로 유지된다
  const seed: UsageStore = { history: {} };
  const demo = [0.2, 0.41, 0.215, 0.35, 0.25, 0.59];
  demo.forEach((ratio, i) => {
    const used = Math.round(ratio * DAILY_LIMIT);
    const d = new Date();
    d.setDate(d.getDate() - (demo.length - i));
    seed.history[dateKey(d)] = {
      used,
      chats: Math.max(1, Math.round(used / (DAILY_LIMIT / 36))),
      helperUses: Math.max(1, Math.round(used / (DAILY_LIMIT / 25))),
    };
  });
  saveStore(seed);
  return seed;
}

export function saveStore(store: UsageStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function getDay(store: UsageStore, key: string): DayRecord {
  return store.history[key] ?? { used: 0, chats: 0, helperUses: 0 };
}

/** 전송 1회 기록 */
export function recordSend(store: UsageStore, usedMl: number, usedHelper: boolean): UsageStore {
  const key = dateKey();
  const day = getDay(store, key);
  const next: UsageStore = {
    history: {
      ...store.history,
      [key]: {
        used: day.used + usedMl,
        chats: day.chats + 1,
        helperUses: day.helperUses + (usedHelper ? 1 : 0),
      },
    },
  };
  saveStore(next);
  return next;
}
