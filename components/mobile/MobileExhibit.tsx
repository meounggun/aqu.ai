"use client";

/* 전시 체험 (모바일) — ExhibitView와 같은 흐름(useExhibit)과 같은 틀.
   인트로·입력·결과가 [제목 영역] [컵 자리] [하단 영역]을 공유해서,
   화면이 바뀌어도 제목과 컵이 제자리에 있고 문구만 바뀐다. */

import SendCupVideo from "../SendCupVideo";
import { useExhibit } from "../ExhibitView";
import { EXHIBIT_LIMIT, ML_PER_CHAR } from "@/lib/water";

/* 데스크톱과 같은 방식 — 컵 몸통(캔버스 세로 25.2%~70%) 위아래에 같은 간격을 두고,
   간격은 가장 긴 그림자(89.6%)가 들어가고도 게이지까지 16px 남도록 잡는다. */
const CUP_SIZE = 260;
const CUP_BODY_TOP = Math.round(CUP_SIZE * 0.252); // 66
const CUP_BODY_BOTTOM = Math.round(CUP_SIZE * 0.7); // 182
const CUP_GAP = Math.round(CUP_SIZE * (0.896 - 0.7)) + 16; // 67

export default function MobileExhibit() {
  const x = useExhibit();
  const r = x.result;
  const showResult = x.phase === "result" && r;

  let title: React.ReactNode;
  let sub: React.ReactNode;
  if (x.phase === "intro") {
    title = "단어별 물 사용량을 체감하세요";
    sub = `한 글자에 ${ML_PER_CHAR}mL · 컵 한 잔은 ${EXHIBIT_LIMIT}mL`;
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
    sub = "보내기를 누르면 쓰인 물의 양을 보여드려요";
  }

  const animKey = `${x.phase}-${x.sends}`;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-[20px] py-[24px]">
      {/* 제목 영역 — 높이 고정(두 줄까지 들어가게), 위쪽 정렬 */}
      <div className="relative z-10 flex h-[96px] w-full shrink-0 flex-col items-center text-center">
        <h2 key={`t-${animKey}`} className="fade-up text-[23px] font-light leading-[1.35] tracking-[-0.9px] text-white">
          {title}
        </h2>
        <p key={`s-${animKey}`} className="fade-up mt-[8px] text-[14px] leading-[1.5] tracking-[-0.55px] text-label">
          {sub}
        </p>
      </div>

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

      {/* 하단 영역 — 높이 고정 */}
      <div className="relative z-10 flex h-[190px] w-full shrink-0 flex-col items-center">
        {x.phase === "intro" ? (
          <button
            type="button"
            onClick={x.start}
            className="h-[52px] w-[160px] shrink-0 rounded-[73px] border-[3px] border-main text-[18px] font-light tracking-[-0.6px] text-white"
          >
            시작하기
          </button>
        ) : (
          <>
            <div className="flex w-full flex-col gap-[10px]">
              <div className="flex items-end justify-between">
                <span className="text-[14px] tracking-[-0.55px] text-label">남은 물</span>
                <span className="text-[14px] tracking-[-0.55px] text-label">
                  <span className="text-[36px] font-semibold leading-none text-white">{x.remaining}</span> /{" "}
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
              <div className="mt-[20px] flex w-full gap-[10px]">
                {!x.empty && (
                  <button
                    type="button"
                    onClick={x.more}
                    className="h-[52px] flex-1 rounded-[73px] border-[3px] border-main text-[16px] font-light tracking-[-0.6px] text-white"
                  >
                    단어 더 적기
                  </button>
                )}
                <button
                  type="button"
                  onClick={x.restart}
                  className={`h-[52px] flex-1 rounded-[73px] text-[16px] font-light tracking-[-0.6px] text-white ${
                    x.empty ? "border-[3px] border-main" : "border-2 border-stroke"
                  }`}
                >
                  처음으로
                </button>
              </div>
            ) : (
              <>
                <div className="mt-[16px] flex h-[58px] w-full items-center gap-[10px] rounded-[14px] bg-gray-box px-[16px]">
                  <input
                    value={x.input}
                    onChange={(e) => x.setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        x.submit();
                      }
                    }}
                    placeholder="단어를 입력해보세요"
                    className="min-w-0 flex-1 bg-transparent text-[16px] tracking-[-0.6px] text-white placeholder:text-white/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={x.submit}
                    disabled={!x.input.trim()}
                    aria-label="보내기"
                    className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-main disabled:opacity-40"
                  >
                    <svg width="13" height="14" viewBox="0 0 14 15" fill="none">
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
                {x.sends > 0 && (
                  <button type="button" onClick={x.restart} className="mt-[14px] text-[14px] tracking-[-0.55px] text-label">
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
