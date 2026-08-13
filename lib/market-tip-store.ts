/** 프롬프트 팁 & 링크 공유 — 덱 마켓 안에서 사람들이 프롬프트 꿀팁이나
 * 여기저기서 발견한 링크를 가볍게 나누는 커뮤니티 게시판.
 * 백엔드가 없는 프로토타입이라 예시 글을 시드로 두고, 내가 올린 글은 로컬에 저장한다. */

export interface MarketTip {
  id: string;
  author: string;
  text: string;
  url?: string;
  createdAt: number;
}

const KEY = "aqu-market-tips-v1";

export const SEED_MARKET_TIPS: MarketTip[] = [
  {
    id: "seed-1",
    author: "냉각수마스터",
    text: "Anthropic 공식 프롬프트 엔지니어링 가이드 — 예시를 몇 개만 넣어도 답변 품질이 확 달라져요.",
    url: "https://docs.anthropic.com/claude/docs/prompt-engineering",
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
  {
    id: "seed-2",
    author: "물방울요정",
    text: "역할(페르소나)을 먼저 지정하고 원하는 출력 형식을 뒤에 붙이면 재질문이 확 줄어요.",
    createdAt: Date.now() - 1000 * 60 * 60 * 52,
  },
  {
    id: "seed-3",
    author: "그린유저",
    text: "'단계별로 생각해줘' 한 줄만 추가해도 복잡한 문제의 답변 정확도가 눈에 띄게 좋아져요.",
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
];

export function loadMarketTips(): MarketTip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as MarketTip[];
  } catch {
    /* 손상된 데이터는 무시 */
  }
  return [];
}

export function saveMarketTips(tips: MarketTip[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(tips));
  } catch {
    /* 저장 공간 부족 등은 무시 — 화면에는 이미 반영됨 */
  }
}

export function tipTimeAgo(ts: number): string {
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}
