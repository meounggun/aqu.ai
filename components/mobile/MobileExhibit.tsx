"use client";

/* 전시 체험 (모바일) — ExhibitView와 같은 흐름(useExhibit), 세로 흐름 레이아웃.
   인트로 → 입력 → (보내기) → 결과 → 처음으로 */

import SendCupVideo from "../SendCupVideo";
import { useExhibit } from "../ExhibitView";
import { EXHIBIT_LIMIT, ML_PER_CHAR } from "@/lib/water";

export default function MobileExhibit() {
  const x = useExhibit();

  if (x.phase === "intro") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-[20px] py-[30px]">
        <h2 className="relative z-10 text-center text-[26px] font-light leading-[1.4] tracking-[-0.9px] text-white">
          단어별 물 사용량을
          <br />
          체감하세요
        </h2>
        <p className="relative z-10 mt-[10px] text-center text-[14px] leading-[1.5] tracking-[-0.55px] text-label">
          한 글자를 적을 때마다 {ML_PER_CHAR}mL
          <br />
          컵 한 잔은 {EXHIBIT_LIMIT}mL입니다
        </p>
        {/* 컵은 정사각 캔버스의 세로 45%만 차지한다 — 남는 여백을 당겨 간격을 맞추고,
            캔버스가 불투명한 --bg 사각형이라 겹치는 요소는 z-10으로 올린다 */}
        <div className="-mb-[73px] -mt-[59px] aspect-square w-full max-w-[300px]">
          <SendCupVideo stage={1} />
        </div>
        <button
          type="button"
          onClick={x.start}
          className="relative z-10 mt-[8px] h-[52px] w-[160px] shrink-0 rounded-[73px] border-[3px] border-main text-[18px] font-light tracking-[-0.6px] text-white"
        >
          시작하기
        </button>
      </div>
    );
  }

  const r = x.result;
  const showResult = x.phase === "result" && r;

  return (
    <div className="flex flex-col items-center px-[20px] pb-[30px] pt-[22px]">
      {/* 상단 문구 — 높이 고정으로 결과 전환 시 컵이 흔들리지 않게 */}
      <div className="relative z-10 flex min-h-[78px] flex-col items-center justify-end text-center">
        {showResult ? (
          <>
            <p key={`q-${x.sends}`} className="fade-up max-w-full truncate text-[15px] tracking-[-0.6px] text-label">
              “<span className="text-white">{r.text}</span>”
            </p>
            <h2 key={`h-${x.sends}`} className="fade-up mt-[6px] text-[24px] font-light tracking-[-0.9px] text-white">
              {x.empty ? (
                "물이 모두 사라졌습니다"
              ) : (
                <>
                  물 <span className="font-semibold text-main">{r.used}mL</span>를 사용했습니다
                </>
              )}
            </h2>
          </>
        ) : (
          <>
            <h2 className="text-[22px] font-light tracking-[-0.8px] text-white">단어를 적어보세요</h2>
            <p className="mt-[8px] text-[14px] leading-[1.5] tracking-[-0.55px] text-label">
              보내기를 누르면 쓰인 물의 양을 보여드려요
            </p>
          </>
        )}
      </div>

      {/* 데스크톱과 같은 기준 — 위 25%만 당기고, 아래는 그림자 끝(90%) 이후만 당긴다 */}
      <div className="-mb-[18px] -mt-[52px] aspect-square w-full max-w-[240px]">
        <SendCupVideo stage={x.stage} />
      </div>

      <div className="relative z-10 mt-[6px] flex w-full flex-col gap-[10px]">
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
        <div className="relative z-10 mt-[16px] flex w-full flex-col items-center">
          <p key={`c-${x.sends}`} className="fade-up text-center text-[14px] leading-[1.6] tracking-[-0.55px] text-label">
            {r.cost.chars}자 × {ML_PER_CHAR}mL = <span className="font-semibold text-white">{r.cost.ml}mL</span>
            {x.empty && (
              <>
                <br />컵 한 잔을 {x.sends}번 만에 비웠습니다
              </>
            )}
          </p>
          <div className="mt-[18px] flex w-full gap-[10px]">
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
        </div>
      ) : (
        <>
          <div className="relative z-10 mt-[16px] flex h-[58px] w-full items-center gap-[10px] rounded-[14px] bg-gray-box px-[16px]">
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
            <button
              type="button"
              onClick={x.restart}
              className="relative z-10 mt-[14px] text-[14px] tracking-[-0.55px] text-label"
            >
              처음으로
            </button>
          )}
        </>
      )}
    </div>
  );
}
