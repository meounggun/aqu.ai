/** 프롬프트 워크스페이스 확장 (PRD §8) — 커스텀 덱 / 덱 마켓
 *
 * 백엔드가 없는 프로토타입이라 모든 상태를 localStorage에 저장한다.
 * "다른 유저"가 존재하지 않으므로 마켓의 시드 덱과 그 누적 지표(snaps)는
 * 데모용 초기값이며, 내가 스냅할 때마다 실제로 증가한다. */

export type DeckCardKind = "persona" | "format" | "constraint";

export interface DeckCard {
  kind: DeckCardKind;
  text: string;
}

export type DeckCategory = "design" | "dev" | "writing" | "research" | "planning" | "etc";

export const DECK_CATEGORIES: { key: DeckCategory; label: string; color: string }[] = [
  { key: "design", label: "디자인", color: "#f97583" },
  { key: "dev", label: "개발", color: "#5b8cff" },
  { key: "writing", label: "글쓰기/카피", color: "#ffb648" },
  { key: "research", label: "학습/리서치", color: "#4fd1c5" },
  { key: "planning", label: "기획/문서", color: "#a78bfa" },
  { key: "etc", label: "기타", color: "#9aa0a6" },
];

export const CATEGORY_LABEL: Record<DeckCategory, string> = Object.fromEntries(
  DECK_CATEGORIES.map((c) => [c.key, c.label]),
) as Record<DeckCategory, string>;

export const CATEGORY_COLOR: Record<DeckCategory, string> = Object.fromEntries(
  DECK_CATEGORIES.map((c) => [c.key, c.color]),
) as Record<DeckCategory, string>;

export interface Deck {
  id: string;
  name: string;
  category: DeckCategory;
  author: string;
  description: string;
  cards: DeckCard[];
  saving: number; // 예상 절감율 0~1
  snaps: number; // 마켓에서 가져간 횟수
  shared: boolean; // 마켓에 공유 중인지
  createdAt: number;
}

export interface DeckStore {
  installed: Deck[]; // 내 사이드바에 장착된 덱 (내가 만든 것 + 스냅한 것)
  activeIds: string[]; // 현재 켜져 있는 덱
  marketSnaps: Record<string, number>; // 시드 덱별 스냅 횟수 누적
}

const KEY = "aqu-decks-v1";

export const CARD_KIND_LABEL: Record<DeckCardKind, string> = {
  persona: "페르소나",
  format: "출력 포맷",
  constraint: "제약 조건",
};

/* ---------- 마켓 시드 덱 (PRD §8-1-2 예시) ---------- */

export const MARKET_DECKS: Deck[] = [
  {
    id: "market-ui",
    name: "10년 차 UI 디자이너 덱",
    category: "design",
    author: "물방울요정",
    description: "디자인 피드백을 구조적으로 받아내는 덱. 근거 없는 감상평을 걸러줍니다.",
    cards: [
      { kind: "persona", text: "10년 차 시니어 UI 디자이너 관점에서 답변해줘." },
      { kind: "format", text: "문제점 / 개선안 / 근거 3단 구조로 정리해줘." },
      { kind: "constraint", text: "추상적인 형용사 대신 구체적인 수치와 사례로 설명해줘." },
    ],
    saving: 0.62,
    snaps: 1284,
    shared: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 41,
  },
  {
    id: "market-react",
    name: "React + Tailwind 코드 덱",
    category: "dev",
    author: "냉각수마스터",
    description: "설명 장황함을 걷어내고 바로 쓸 수 있는 컴포넌트 코드만 받습니다.",
    cards: [
      { kind: "persona", text: "React 19 + Tailwind v4에 능숙한 프론트엔드 개발자로서 답변해줘." },
      { kind: "format", text: "설명은 3줄 이내로 줄이고, 바로 실행 가능한 코드 블록을 먼저 보여줘." },
      { kind: "constraint", text: "사용하지 않는 import나 예시용 더미 코드는 넣지 마." },
    ],
    saving: 0.71,
    snaps: 2043,
    shared: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 63,
  },
  {
    id: "market-marketer",
    name: "카피라이터 300자 덱",
    category: "writing",
    author: "그린유저",
    description: "매번 '300자로 써줘'를 반복하지 않도록 분량·톤을 고정합니다.",
    cards: [
      { kind: "persona", text: "브랜드 카피라이터 관점에서 답변해줘." },
      { kind: "format", text: "300자 내외의 완성된 카피 3안을 번호로 제시해줘." },
      { kind: "constraint", text: "과장된 수식어와 느낌표는 쓰지 마." },
    ],
    saving: 0.58,
    snaps: 876,
    shared: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 19,
  },
  {
    id: "market-study",
    name: "개념 정리 학습 덱",
    category: "research",
    author: "아쿠아",
    description: "되묻는 대화를 줄이는 학습용 덱. 한 번에 이해되는 구조로 받습니다.",
    cards: [
      { kind: "persona", text: "해당 분야를 처음 배우는 사람에게 설명하는 튜터로서 답변해줘." },
      { kind: "format", text: "핵심 정의 → 비유 → 예시 → 흔한 오해 순서로 정리해줘." },
      { kind: "constraint", text: "전문 용어를 쓸 때는 반드시 괄호로 쉬운 말을 덧붙여줘." },
    ],
    saving: 0.54,
    snaps: 612,
    shared: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
];

/* ---------- 저장소 ---------- */

const EMPTY: DeckStore = {
  installed: [],
  activeIds: [],
  marketSnaps: {},
};

export function loadDeckStore(): DeckStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as DeckStore) };
  } catch {
    /* 손상된 데이터는 초기화 */
  }
  return EMPTY;
}

export function saveDeckStore(store: DeckStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* 저장 공간 부족은 무시 — 화면에는 이미 반영됨 */
  }
}

/* ---------- 덱 조작 ---------- */

/** 덱의 카드들을 프롬프트에 이어붙일 하나의 지시문으로 합친다 */
export function deckDirective(deck: Deck): string {
  return deck.cards.map((c) => c.text).join(" ");
}

/** 여러 덱을 곱연산으로 합산한 절감율 (0~1) */
export function combinedDeckSaving(decks: Deck[]): number {
  if (decks.length === 0) return 0;
  return 1 - decks.reduce((f, d) => f * (1 - d.saving), 1);
}

export function createDeck(
  store: DeckStore,
  input: { name: string; category: DeckCategory; description: string; cards: DeckCard[] },
): DeckStore {
  // 카드 수가 많을수록 조건이 촘촘해져 되물음이 줄어든다 → 절감율을 카드 수에 비례해 산정
  const saving = Math.min(0.3 + input.cards.length * 0.12, 0.8);
  const deck: Deck = {
    id: `mine-${Date.now()}`,
    name: input.name,
    category: input.category,
    author: "나",
    description: input.description,
    cards: input.cards,
    saving,
    snaps: 0,
    shared: false,
    createdAt: Date.now(),
  };
  const next = { ...store, installed: [deck, ...store.installed] };
  saveDeckStore(next);
  return next;
}

export function removeDeck(store: DeckStore, id: string): DeckStore {
  const next = {
    ...store,
    installed: store.installed.filter((d) => d.id !== id),
    activeIds: store.activeIds.filter((a) => a !== id),
  };
  saveDeckStore(next);
  return next;
}

export function toggleDeck(store: DeckStore, id: string): DeckStore {
  const on = store.activeIds.includes(id);
  const next = {
    ...store,
    activeIds: on ? store.activeIds.filter((a) => a !== id) : [...store.activeIds, id],
  };
  saveDeckStore(next);
  return next;
}

/** 마켓 덱을 내 워크스페이스로 가져오기(Snap) */
export function snapDeck(store: DeckStore, deck: Deck): DeckStore {
  if (store.installed.some((d) => d.id === deck.id)) return store;
  const next: DeckStore = {
    ...store,
    installed: [{ ...deck }, ...store.installed],
    marketSnaps: { ...store.marketSnaps, [deck.id]: (store.marketSnaps[deck.id] ?? 0) + 1 },
  };
  saveDeckStore(next);
  return next;
}

/** 내 덱을 마켓에 공유 / 공유 해제 */
export function toggleShare(store: DeckStore, id: string): DeckStore {
  const next = {
    ...store,
    installed: store.installed.map((d) => (d.id === id ? { ...d, shared: !d.shared } : d)),
  };
  saveDeckStore(next);
  return next;
}

