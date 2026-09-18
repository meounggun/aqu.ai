"use client";

/* 전시 체험 — Figma 1131:1401(인트로) / 1131:1407(체험) 재현.
   관람객이 "글자 하나에 물이 얼마나 드는지"를 몸으로 느끼는 페이지.

   흐름: 인트로 → 입력 → (보내기) → 결과 → 처음으로
   입력하는 동안에는 컵도 숫자도 그대로 두고, 보내기를 누른 순간 결과로 한꺼번에 보여준다.
   그래야 '보냈더니 이만큼 사라졌다'는 인과가 또렷하게 남는다.

   여기서 쓰는 물은 페이지 안에서만 도는 로컬 상태다 —
   useAquState의 실제 사용 기록(프로필 통계)에는 전혀 반영되지 않는다. */

import { useState } from "react";
import SendCupVideo from "./SendCupVideo";
import { EXHIBIT_LIMIT, ML_PER_CHAR, getStage } from "@/lib/water";

/* 글자당 단가(ML_PER_CHAR)와 12단계 표(getStage)는 lib/water.ts의 공통 기준을 채팅과 똑같이 쓴다.
   컵 크기만 다르다 — 여기선 단어 하나씩 적어보는 자리라 EXHIBIT_LIMIT(100mL)을 쓴다. */

export interface ExhibitCost {
  ml: number;
  chars: number;
}

/** 전시는 '글자수 × 단가'만 보여준다 — 화면의 계산식(3자 × 6mL = 18mL)이 그대로 맞아떨어져야 해서
    채팅의 상황별 가산(모호·단발어 등)은 빼고 순수하게 글자수로만 계산한다. 단가는 채팅과 같다. */
export function exhibitCost(raw: string): ExhibitCost {
  const text = raw.trim();
  return { ml: text.length * ML_PER_CHAR, chars: text.length };
}

export interface ExhibitResult {
  text: string;
  cost: ExhibitCost;
  /** 실제로 빠진 양 — 남은 물보다 많이 적으면 남은 만큼만 빠진다 */
  used: number;
}

/** 전시 체험 상태 — 데스크톱(ExhibitView)과 모바일(MobileExhibit)이 같은 흐름을 쓴다 */
export function useExhibit() {
  const [phase, setPhase] = useState<"intro" | "input" | "result">("intro");
  const [remaining, setRemaining] = useState(EXHIBIT_LIMIT);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ExhibitResult | null>(null);
  const [sends, setSends] = useState(0);
  /** 처음으로를 누른 횟수 — 컵을 새로 마운트해서 '줄어드는 재생' 없이 가득 찬 컵으로 되돌린다 */
  const [round, setRound] = useState(0);

  const empty = remaining <= 0;

  const submit = () => {
    const text = input.trim();
    if (!text || empty) return;
    const cost = exhibitCost(text);
    const used = Math.min(cost.ml, remaining);
    setResult({ text, cost, used });
    setRemaining(remaining - used);
    setSends((n) => n + 1);
    setInput("");
    setPhase("result");
  };

  /** 처음으로 — 물을 다시 채우고 인트로부터 새로 시작한다 (다음 관람객용) */
  const restart = () => {
    setRemaining(EXHIBIT_LIMIT);
    setInput("");
    setResult(null);
    setSends(0);
    setRound((n) => n + 1);
    setPhase("intro");
  };

  return {
    phase,
    remaining,
    empty,
    // 컵은 확정된 잔량만 따른다 — 입력 중에는 움직이지 않는다
    stage: getStage(remaining, EXHIBIT_LIMIT),
    input,
    setInput,
    result,
    sends,
    round,
    start: () => setPhase("input"),
    submit,
    /** 결과를 본 뒤 같은 컵으로 단어를 더 적어본다 */
    more: () => setPhase("input"),
    restart,
  };
}

/* ---------- 레이아웃 치수 (1920×1080 캔버스 기준) ----------
   인트로·입력·결과 세 화면이 똑같은 틀을 쓴다: [제목 영역] [컵 자리] [하단 영역].
   세 칸의 높이를 모두 고정해 두면 화면이 바뀌어도 제목과 컵이 제자리에 있고 문구만 바뀐다.

   컵 영상(정사각 CUP_SIZE) 안에서 실제 컵 몸통은 세로 25.2%~70%에 있고,
   그림자는 단계에 따라 돌면서 최대 89.6%까지 내려온다.
   컵 몸통 위아래에 같은 간격(CUP_GAP)을 줘서 제목과 게이지 사이 정가운데에 두고,
   CUP_GAP은 가장 긴 그림자(5·7.mp4)가 들어가고도 게이지까지 24px 남도록 잡았다.

   간격은 두 가지로만 쓴다 — 큰 간격(제목↔컵, 컵↔게이지 = CUP_GAP)과
   작은 간격(제목↔보조문구, 게이지↔입력창 = SMALL_GAP).
   전체 높이: 제목 84 + 컵 자리(260 + 138×2) + 하단 144 = 764 */
const CUP_SIZE = 580;
const CUP_BODY_TOP = Math.round(CUP_SIZE * 0.252); // 146
const CUP_BODY_BOTTOM = Math.round(CUP_SIZE * 0.7); // 406
const CUP_GAP = Math.round(CUP_SIZE * (0.896 - 0.7)) + 24; // 138 — 그림자(89.6%) + 여유 24px

/** 세 화면 공통 제목 영역 — 제목·보조문구의 크기와 위치가 항상 같다 */
function Header({ title, sub, animKey }: { title: React.ReactNode; sub: React.ReactNode; animKey?: string }) {
  return (
    <div className="relative z-10 flex h-[84px] shrink-0 flex-col items-center">
      <h2 key={`t-${animKey}`} className="fade-up text-center text-[36px] font-light leading-[1.3] tracking-[-1.1px] text-white">
        {title}
      </h2>
      <p key={`s-${animKey}`} className="fade-up mt-[14px] text-[17px] tracking-[-0.7px] text-label">
        {sub}
      </p>
    </div>
  );
}

export default function ExhibitView() {
  const x = useExhibit();
  const r = x.result;
  const showResult = x.phase === "result" && r;

  let title: React.ReactNode;
  let sub: React.ReactNode;
  if (x.phase === "intro") {
    title = "단어별 물 사용량을 체감하세요";
    sub = `한 글자를 적을 때마다 ${ML_PER_CHAR}mL — 컵 한 잔은 ${EXHIBIT_LIMIT}mL입니다`;
  } else if (showResult) {
    title = x.empty ? (
      `${x.sends}번 만에 물이 모두 사라졌습니다`
    ) : (
      <>
        물 <span className="font-semibold text-main">{r.used}mL</span>를 사용했습니다
      </>
    );
    sub = (
      <>
        “<span className="text-white">{r.text}</span>” · {r.cost.chars}자 × {ML_PER_CHAR}mL ={" "}
        <span className="font-semibold text-white">{r.cost.ml}mL</span>
      </>
    );
  } else {
    title = "단어를 적어보세요";
    sub = "보내기를 누르면 그 단어에 쓰인 물의 양을 보여드려요";
  }

  return (
    <div className="absolute left-[140px] top-[60px] flex h-[960px] w-[1640px] flex-col items-center justify-center">
      <Header title={title} sub={sub} animKey={`${x.phase}-${x.sends}`} />

      {/* 컵 자리 — 캔버스의 빈 여백을 음수 마진으로 당겨, 몸통 위아래 간격이 정확히 CUP_GAP이 되게 한다.
          캔버스는 --bg로 꽉 찬 불투명 사각형이라 겹치는 제목·게이지는 z-10으로 위에 둔다. */}
      <div
        className="shrink-0"
        style={{
          width: CUP_SIZE,
          height: CUP_SIZE,
          marginTop: CUP_GAP - CUP_BODY_TOP,
          marginBottom: CUP_BODY_BOTTOM + CUP_GAP - CUP_SIZE,
        }}
      >
        <SendCupVideo key={x.round} stage={x.stage} />
      </div>

      {/* 하단 영역 — 높이 고정. 인트로는 시작하기, 입력은 게이지+입력창, 결과는 게이지+버튼 */}
      <div className="relative z-10 flex h-[144px] w-[800px] shrink-0 flex-col items-center">
        {x.phase === "intro" ? (
          <button
            type="button"
            onClick={x.start}
            // 다음 화면 입력창(게이지 62 + 간격 14 아래, 높이 64)과 세로 가운데가 같도록 78px 내린다
            className="mt-[78px] h-[60px] w-[180px] shrink-0 cursor-pointer rounded-[73px] border-4 border-main text-[22px] font-light tracking-[-0.66px] text-white transition-colors hover:bg-main/20"
          >
            시작하기
          </button>
        ) : (
          <>
            {/* 남은 물 — 보내기 전에는 그대로, 결과에서 한 번에 줄어든다 */}
            <div className="flex w-full flex-col gap-[10px]">
              <div className="flex items-end justify-between">
                <span className="text-[16px] tracking-[-0.65px] text-label">남은 물</span>
                <span className="text-[16px] tracking-[-0.65px] text-label">
                  <span className="text-[40px] font-semibold leading-none text-white">{x.remaining}</span> /{" "}
                  {EXHIBIT_LIMIT}mL
                </span>
              </div>
              <div className="h-[12px] w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-main transition-[width] duration-700 ease-out"
                  style={{ width: `${(x.remaining / EXHIBIT_LIMIT) * 100}%` }}
                />
              </div>
            </div>

            {showResult ? (
              <div className="mt-[14px] flex gap-[12px]">
                {!x.empty && (
                  <button
                    type="button"
                    onClick={x.more}
                    className="h-[54px] w-[170px] cursor-pointer rounded-[73px] border-4 border-main text-[18px] font-light tracking-[-0.55px] text-white transition-colors hover:bg-main/20"
                  >
                    단어 더 적기
                  </button>
                )}
                <button
                  type="button"
                  onClick={x.restart}
                  className={`h-[54px] w-[170px] cursor-pointer rounded-[73px] text-[18px] font-light tracking-[-0.55px] text-white transition-colors ${
                    x.empty ? "border-4 border-main hover:bg-main/20" : "border-2 border-stroke hover:border-white/60"
                  }`}
                >
                  처음으로
                </button>
              </div>
            ) : (
              <>
                {/* 입력 — Figma 1131:1407의 하단 바(625×49, r12)를 캔버스 비율에 맞춰 키운 것 */}
                <div className="mt-[14px] flex h-[64px] w-full items-center gap-[12px] rounded-[14px] bg-gray-box px-[22px]">
                  <input
                    value={x.input}
                    autoFocus
                    onChange={(e) => x.setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        x.submit();
                      }
                    }}
                    placeholder="단어를 입력해보세요"
                    className="min-w-0 flex-1 bg-transparent text-[18px] tracking-[-0.7px] text-white placeholder:text-white/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={x.submit}
                    disabled={!x.input.trim()}
                    aria-label="보내기"
                    title="보내기"
                    className="flex size-[38px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-main transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
                      <path
                        d="M7 13.5V1.5M7 1.5L1.5 7M7 1.5L12.5 7"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {/* 자리를 차지하지 않게 입력창 아래에 띄운다 — 있을 때와 없을 때 레이아웃이 같아야 해서 */}
                {x.sends > 0 && (
                  <button
                    type="button"
                    onClick={x.restart}
                    className="absolute left-1/2 top-full mt-[14px] -translate-x-1/2 cursor-pointer text-[16px] tracking-[-0.65px] text-label underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    처음으로
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
