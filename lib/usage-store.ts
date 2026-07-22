/** 사용 기록 저장소 — 플로우차트 [기본 세팅] 및 프로필 통계용 (localStorage) */

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
  const seed: UsageStore = { history: {} };
  const demo = [400, 820, 430, 700, 500, 1180];
  demo.forEach((used, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (demo.length - i));
    seed.history[dateKey(d)] = {
      used,
      chats: Math.round(used / 55),
      helperUses: Math.round(used / 80),
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

/* ---------- 프로필 통계 ---------- */

export function totals(store: UsageStore) {
  let used = 0;
  let chats = 0;
  let helperUses = 0;
  for (const day of Object.values(store.history)) {
    used += day.used;
    chats += day.chats;
    helperUses += day.helperUses;
  }
  return {
    used,
    chats,
    helperUses,
    cupsEmptied: Math.floor(used / 2000), // 비워낸 컵 (2,000mL 기준)
  };
}

/** 최근 n일 (오늘 포함, 과거→오늘 순) */
export function lastDays(store: UsageStore, n: number): { key: string; used: number }[] {
  const out: { key: string; used: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    out.push({ key, used: getDay(store, key).used });
  }
  return out;
}

/** 이번 달 총 사용량 (mL) */
export function monthTotal(store: UsageStore, base: Date = new Date()): number {
  const prefix = dateKey(base).slice(0, 7);
  return Object.entries(store.history)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((sum, [, d]) => sum + d.used, 0);
}
