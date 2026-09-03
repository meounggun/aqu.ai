/** AQU.AI 물 사용량 계산 & 냉각수 단계 로직 (PRD §2) */

export const DAILY_LIMIT = 2000; // 하루 사용 가능한 냉각수 (mL)

/* ---------- 실시간 물 사용량 계산 ---------- */

// 기획서 "불필요한 냉각수 증가 원인" 명세
const VAGUE_WORDS = ["그거", "이거", "저거", "알려줘", "해봐", "뭐야"];
const LENGTHY_WORDS = ["길게", "많이", "자세히", "끝까지", "전부다", "전부 다"];
const SPAM_WORDS = ["ㅋㅋㅋ", "ㅎㅎㅎ", "ㄷㄷ", "아무거나"];
const SPAM_PATTERN = /(.)\1{5,}/; // 같은 문자 6회 이상 반복
const PROFANITY = /(시발|씨발|병신|존나|개새|미친놈)/;

export interface UsageFlag {
  label: string; // 증가 원인명 (기획서 표기)
  percent: number; // 증가율 (%)
}

export interface UsageBreakdown {
  base: number;
  multiplier: number;
  total: number;
  flags: UsageFlag[];
}

/** 글자 수 × 1.2mL + 상황별 가산 (모호 +40%, 단발 단어 +40%, 분량 과다 +70%, 도배 +100%) */
export function calcUsage(raw: string): UsageBreakdown {
  const text = raw.trim();
  if (!text) return { base: 0, multiplier: 1, total: 0, flags: [] };

  const base = text.length * 1.2;
  let multiplier = 1;
  const flags: UsageFlag[] = [];

  if (VAGUE_WORDS.some((w) => text.includes(w))) {
    multiplier += 0.4;
    flags.push({ label: "모호한 지시어", percent: 40 });
  }
  if (!/\s/.test(text) && text.length <= 6) {
    multiplier += 0.4;
    flags.push({ label: "무맥락 단발성 단어", percent: 40 });
  }
  if (LENGTHY_WORDS.some((w) => text.includes(w))) {
    multiplier += 0.7;
    flags.push({ label: "분량 과다 요구", percent: 70 });
  }
  if (SPAM_WORDS.some((w) => text.includes(w)) || SPAM_PATTERN.test(text) || PROFANITY.test(text)) {
    multiplier += 1.0;
    flags.push({ label: "무의미한 도배", percent: 100 });
  }

  return { base, multiplier, total: Math.round(base * multiplier), flags };
}

/* ---------- 12단계 냉각수 테이블 (PRD §5-1) ---------- */

// 단계 임계값: remaining >= threshold[i] 이면 단계 i+1
const STAGE_THRESHOLDS = [2000, 1800, 1600, 1400, 1200, 1000, 900, 700, 500, 300, 200, 100];

/** 잔여량(mL) → 1~12단계, 소진 시 13(사용 중지) */
export function getStage(remaining: number): number {
  if (remaining <= 0) return 13;
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (remaining >= STAGE_THRESHOLDS[i]) return i + 1;
  }
  return 12;
}

/** 단계별 가상 시간 — 1단계 00:00, 단계당 +2시간, 소진 24:00 */
export function stageTime(stage: number): string {
  const h = Math.min((stage - 1) * 2, 24);
  return `${String(h).padStart(2, "0")} : 00`;
}

/* ---------- 단계별 물 색상 (블루 → 그린 → 옐로우 → 오렌지 → 레드) ---------- */

export interface WaterPalette {
  top: string; // 수면 부근 밝은 색
  mid: string; // 물기둥 중심 색
  deep: string; // 하단 진한 색
  glow: string; // 바닥 글로우
  surface: string; // 수면 타원 색
}

const PALETTES: Record<number, WaterPalette> = {
  1: { top: "#7c9bf9", mid: "#4d55f2", deep: "#4348ee", glow: "#8ff3e6", surface: "#6f8ffa" },
  2: { top: "#7c9bf9", mid: "#4d55f2", deep: "#4348ee", glow: "#8ff3e6", surface: "#6f8ffa" },
  3: { top: "#74a3f7", mid: "#4a68ef", deep: "#4157ea", glow: "#8df1e2", surface: "#6a97f8" },
  4: { top: "#63b6d9", mid: "#3f8fc9", deep: "#3a7fb8", glow: "#96f3d9", surface: "#5cabd8" }, // 블루→그린
  5: { top: "#5fd3a8", mid: "#37b581", deep: "#2fa374", glow: "#a4f5cd", surface: "#57c99f" },
  6: { top: "#5fd3a8", mid: "#37b581", deep: "#2fa374", glow: "#a4f5cd", surface: "#57c99f" },
  7: { top: "#b4d95f", mid: "#93bd3a", deep: "#84ab31", glow: "#dcf5a4", surface: "#abd056" }, // 옐로우그린
  8: { top: "#f2d75e", mid: "#dcb93a", deep: "#c9a52f", glow: "#f8ecad", surface: "#eccf55" }, // 옐로우
  9: { top: "#f5b356", mid: "#e39332", deep: "#d08228", glow: "#f9d9a5", surface: "#f0a94d" }, // 오렌지
  10: { top: "#f68d4e", mid: "#e56a2c", deep: "#d25a22", glow: "#f9c39d", surface: "#f18345" }, // 오렌지레드
  11: { top: "#f36a55", mid: "#e04432", deep: "#cc3628", glow: "#f8ada0", surface: "#ee604b" }, // 레드
  12: { top: "#f36a55", mid: "#e04432", deep: "#cc3628", glow: "#f8ada0", surface: "#ee604b" },
};

export function getPalette(stage: number): WaterPalette {
  return PALETTES[Math.min(Math.max(stage, 1), 12)] ?? PALETTES[12];
}

/* ---------- 프롬프트 도우미 (PRD §2-2, Figma 서브옵션) ---------- */

export interface HelperOption {
  label: string;
  saving: number; // 예상 절감율 (0~1)
  directive: string; // 프롬프트에 이어붙는 지시문
  /** 프롬프트 도우미 편집 화면에서 껐는지 — 꺼도 목록에서 사라지지 않고 다시 켤 수 있다.
   * 정적 HELPER_CATEGORIES에는 없고, applyHelperOverrides가 붙여준다(없으면 켜진 것으로 간주) */
  enabled?: boolean;
}

export interface HelperCategory {
  key: string;
  label: string;
  chipWidth: number; // Figma 칩 너비(px)
  options: HelperOption[];
}

/** 기획서 "프롬프트 도우미 설계" 명세 — 지시문·절감율 원문 반영 */
export const HELPER_CATEGORIES: HelperCategory[] = [
  {
    key: "summary",
    label: "요약",
    chipWidth: 71,
    options: [
      {
        label: "한 줄 요약",
        saving: 0.85,
        directive: "제공된 텍스트의 핵심 내용을 정확하게 한 줄(문장 1개)로 요약해줘.",
      },
      {
        label: "3줄 요약",
        saving: 0.7,
        directive: "제공된 텍스트의 핵심 내용을 글머리 기호(•)를 사용하여 딱 3줄로 요약해줘.",
      },
    ],
  },
  {
    key: "translate",
    label: "번역",
    chipWidth: 71,
    options: [
      {
        label: "직역",
        saving: 0.3,
        directive: "의역이나 문맥적 가공을 하지 말고, 원문의 단어와 문장 구조를 있는 그대로 매칭하여 직역해줘.",
      },
      {
        label: "자연스러운 번역",
        saving: 0.5,
        directive: "도착어(번역될 언어)의 문화적 맥락과 구어체 표현을 고려하여, 번역투 없이 자연스럽게 의역해줘.",
      },
    ],
  },
  {
    key: "code",
    label: "코드",
    chipWidth: 71,
    options: [
      {
        label: "프로그래밍",
        saving: 0.45,
        directive: "주어진 요구사항을 충족하는 최적화된 프로그래밍 코드를 작성해줘. 가독성과 효율성을 최우선으로 해줘.",
      },
      {
        label: "코드수정",
        saving: 0.55,
        directive: "제공된 코드에서 비효율적인 부분을 개선하고, 리팩토링하여 더 깔끔하고 가독성 좋은 코드로 수정해줘.",
      },
      {
        label: "오류 검토",
        saving: 0.65,
        directive: "제공된 코드의 구문 오류(Syntax Error)나 논리 오류(Logical Bug)를 찾아내고, 이를 수정한 코드를 함께 보여줘.",
      },
    ],
  },
  {
    key: "tone",
    label: "톤",
    chipWidth: 50,
    options: [
      {
        label: "단호하게",
        saving: 0.75,
        directive: "감정이나 수식어를 배제하고, 객관적인 사실 위주의 단호한 어조로 문장을 재작성해줘.",
      },
      {
        label: "비즈니스",
        saving: 0.55,
        directive: "제공된 텍스트를 비즈니스 환경에 적합하도록 professional하고 격식 있는 문체로 재작성해줘.",
      },
      {
        label: "기획서",
        saving: 0.55,
        directive: "제공된 텍스트를 공식 기획서 및 보고서 양식에 어울리는 명확하고 논리적인 문체(하십시오체)로 다듬어줘.",
      },
      {
        label: "친근한",
        saving: 0.4,
        directive: "사용자에게 친근감과 유대감을 줄 수 있도록 다정하고 친숙한 어조로 변경해줘.",
      },
      {
        label: "부드러운",
        saving: 0.4,
        directive: "날카롭거나 딱딱한 느낌을 빼고, 정중하면서도 유연하게 읽히는 부드러운 말투(해요체)로 바꾸어줘.",
      },
    ],
  },
  {
    key: "review",
    label: "검토",
    chipWidth: 71,
    options: [
      {
        label: "오타",
        saving: 0.4,
        directive: "텍스트 내에 글자가 잘못 입력되었거나 빠진 오타(Typo)를 찾아서 올바르게 수정해줘.",
      },
      {
        label: "맞춤법",
        saving: 0.4,
        directive: "띄어쓰기, 맞춤법, 표준어 규정에 어긋난 부분을 찾아서 올바른 문법으로 교정해줘.",
      },
      {
        label: "가독성",
        saving: 0.4,
        directive: "문맥이 매끄럽게 통하고 독자가 한눈에 읽기 편하도록 문장 구조와 배열을 다듬어줘.",
      },
    ],
  },
  {
    key: "easy",
    label: "쉽게",
    chipWidth: 71,
    options: [
      {
        label: "전문용어 쉽게",
        saving: 0.6,
        directive: "텍스트에 포함된 전문 용어나 기술적 개념을 대중이 이해하기 쉬운 일반적인 단어로 바꾸어 설명해줘.",
      },
      {
        label: "아동용 설명",
        saving: 0.45,
        directive: "10세 어린이가 쉽게 이해할 수 있도록 비유를 사용하고 초등학생 수준의 쉬운 어휘로 설명해줘.",
      },
    ],
  },
  {
    key: "example",
    label: "예시",
    chipWidth: 71,
    options: [
      {
        label: "개념사용 사례",
        saving: 0.5,
        directive: "해당 개념이나 이론이 실제로 적용된 구체적인 현실 세계의 활용 사례를 들어서 설명해줘.",
      },
      {
        label: "실패 사례",
        saving: 0.6,
        directive: "해당 방식이나 개념을 잘못 적용하여 발생한 대표적인 실패 사례와 그 원인을 분석해줘.",
      },
    ],
  },
  {
    key: "table",
    label: "표",
    chipWidth: 50,
    options: [
      {
        label: "장단점",
        saving: 0.55,
        directive: "해당 대상의 장점과 단점을 명확히 비교할 수 있도록 2열 구조의 표(Table)로 정리해줘.",
      },
      {
        label: "타임라인",
        saving: 0.5,
        directive: "시간 순서나 절차에 따른 흐름을 한눈에 볼 수 있도록 날짜/단계별 타임라인을 표 형태로 구조화해줘.",
      },
      {
        label: "막대",
        saving: 0.6,
        directive: "제공된 수치 데이터를 비교하기 쉽도록, 마크다운 표 형식을 활용해 막대그래프 형태로 시각화해서 표현해줘.",
      },
      {
        label: "선 그래프",
        saving: 0.6,
        directive: "시간이나 흐름에 따른 데이터의 변화 추이를 볼 수 있도록, 마크다운 표형식을 활용해 선 그래프 형태로 구조화해줘.",
      },
    ],
  },
];

/* ---------- AI 응답 생성 (데모) ---------- */

const CONSTITUTION_RESPONSE = `제시하신 문장들은 대한민국 헌법 제26조 제1항과 제16조의 내용을 담고 있습니다.
이 조항들은 국가가 국민의 의견 제출 권리를 보장하고, 개인의 사생활과 주거 공간의 불가침성을 헌법적으로 보호한다는 핵심 가치를 설명하고 있습니다. 특히 주거에 대한 강제 처분 시 법관이 발행한 영장이 있어야 한다는 '영장주의' 원칙을 명시하고 있습니다.

요청하신 핵심 요약은 다음과 같습니다.

[1줄 요약]
• 핵심: 국민의 청원권 보장 및 주거의 자유와 영장주의 원칙 명시.
• 결론: 국가는 국민의 의사 표현과 사적 공간의 안전을 법적으로 보호해야 한다.`;

export function generateResponse(prompt: string, usedMl: number, options?: HelperOption[]): string {
  if (prompt.includes("모든 국민은") && prompt.includes("청원")) {
    return CONSTITUTION_RESPONSE;
  }
  const header =
    options && options.length > 0
      ? `[${options.map((o) => o.label).join(" · ")}] 요청을 반영해 답변드립니다.\n\n`
      : "";
  return (
    header +
    `질문 잘 받았습니다. 이번 질문으로 약 ${usedMl.toLocaleString()}mL의 냉각수가 사용되었어요.\n\n` +
    `짧고 명확한 질문은 AI 데이터센터의 냉각수 소비를 크게 줄일 수 있습니다. ` +
    `프롬프트 도우미의 옵션을 활용하면 최대 85%까지 물 사용량을 절감할 수 있으니, 다음 질문에도 활용해보세요.`
  );
}
