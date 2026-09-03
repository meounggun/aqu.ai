"use client";

/* eslint-disable @next/next/no-img-element */

/* 모바일 채팅 — 세로 스택 레이아웃.
   메시지 스크롤 영역 + 하단 고정 입력바(도우미 칩 가로 스크롤, 선택 태그, 통계). */

import { useEffect, useRef, useState } from "react";
import SendCupVideo from "@/components/SendCupVideo";
import { stageTime, DAILY_LIMIT } from "@/lib/water";
import { downloadCardAsPdf } from "@/lib/card-export";
import type { AquState } from "@/lib/useAquState";

export default function MobileChat({ app }: { app: AquState }) {
  const {
    input,
    setInput,
    messages,
    remaining,
    stage,
    exhausted,
    selected,
    visibleCategories,
    typing,
    liveUsage,
    savingPercent,
    send,
    removeHelperOption,
    toggleHelperOption,
    activeDecks,
    deckSavingPercent,
    toggleDeck,
    activeCustomHelpers,
    toggleCustomHelper,
    effectiveHelperCategories,
  } = app;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [sheetKey, setSheetKey] = useState<string | null>(null);


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const categories = effectiveHelperCategories.filter((c) => visibleCategories.has(c.key));
  const sheetCat = categories.find((c) => c.key === sheetKey) ?? null;

  return (
    <div className="flex h-full flex-col">
      {/* ---------- 메시지 / 히어로 ---------- */}
      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-[18px] pt-[16px]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center pt-[64px]">
            <h1 className="text-center text-[26px] font-semibold leading-[1.3] tracking-[-1.2px] text-white">
              짧고 명확한 질문은
              <br />
              AI의 물 사용량을 줄일 수 있습니다
            </h1>
            <p className="mt-[10px] text-center text-[15px] tracking-[-0.65px] text-[#bbb]">
              프롬프트 도우미로 효율적인 대화를 시작해보세요
            </p>
            <div className="mt-[20px] size-[240px]">
              <SendCupVideo stage={stage} />
            </div>
            {/* 컵 영상 프레임 하단에 여백이 들어 있어 음수 마진으로 시간 배지를 끌어당긴다 */}
            <div className="relative z-10 mt-[-56px] flex items-center gap-[8px] rounded-full border border-label bg-bg px-[14px] py-[6px]">
              <span className="text-[15px] tracking-[-0.6px] text-label">
                현재 시간 {stageTime(stage)}
              </span>
            </div>
            <p className="relative z-10 mt-[8px] text-[14px] tracking-[-0.55px] text-label">
              물의 하루가 지나면 사용이 중지됩니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[22px] pb-[12px]">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <div
                  key={msg.id}
                  className="fade-up max-w-[85%] self-end rounded-[15px] bg-main px-[15px] py-[10px]"
                >
                  <p className="whitespace-pre-wrap text-[16px] leading-[1.5] tracking-[-0.7px] text-white/95">
                    {msg.text}
                  </p>
                </div>
              ) : (
                <div key={msg.id} className="fade-up flex flex-col gap-[12px]">
                  <p className="whitespace-pre-wrap text-[16px] leading-[1.55] tracking-[-0.7px] text-white/90">
                    {msg.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-[10px]">
                    <img
                      src="/assets/response-actions.svg"
                      alt="응답 액션"
                      className="h-[14px] w-[92px] opacity-80"
                    />
                    {/* 결과물 PDF 내보내기 (PRD §8-1-3) — AI 답변 텍스트만 담은 카드를 PDF 한 장으로 저장한다 */}
                    <button
                      type="button"
                      onClick={() => downloadCardAsPdf({ text: msg.text })}
                      className="rounded-full border border-stroke px-[11px] py-[5px] text-[14px] tracking-[-0.55px] text-white/80"
                    >
                      PDF 내보내기
                    </button>
                  </div>
                  {msg.deckNames && msg.deckNames.length > 0 && (
                    <p className="text-[14px] tracking-[-0.55px] text-label">
                      덱 {msg.deckNames.join(" · ")} · 절약{" "}
                      <span className="font-semibold text-main">
                        {(msg.savedMl ?? 0).toLocaleString()}mL
                      </span>
                    </p>
                  )}
                </div>
              ),
            )}
            {typing && (
              <div className="flex gap-[6px] pt-[2px]">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="typing-dot size-[7px] rounded-full bg-white/70" />
                ))}
              </div>
            )}
            {exhausted && !typing && (
              <p className="pt-[4px] text-[15px] tracking-[-0.65px] text-label">
                오늘 쓸 수 있는 냉각수를 모두 사용하였습니다.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---------- 하단 입력 영역 ---------- */}
      <div className="shrink-0 border-t border-sidebar-stroke bg-bg px-[16px] pb-[14px] pt-[12px]">
        {/* 통계 스트립 */}
        <div className="mb-[10px] flex items-center justify-between text-[15px] tracking-[-0.6px]">
          <span className="text-label">
            실시간 <span className="font-semibold text-white">{exhausted ? 0 : liveUsage}</span>ml
            {savingPercent > 0 && !exhausted && (
              <span className="ml-[6px] font-semibold text-main">-{savingPercent}%</span>
            )}
          </span>
          <span className="text-label">
            잔여 <span className="font-semibold text-main">{remaining.toLocaleString()}</span>/
            {DAILY_LIMIT.toLocaleString()}ml
          </span>
        </div>

        {/* 장착된 커스텀 덱 + 나만의 프롬프트 도우미 (PRD §8-1-1) — 탭하면 즉시 해제 */}
        {(activeDecks.length > 0 || activeCustomHelpers.length > 0) && (
          <div className="chat-scroll-x -mx-[16px] mb-[8px] flex items-center gap-[6px] overflow-x-auto px-[16px]">
            <span className="shrink-0 text-[14px] font-semibold tracking-[-0.55px] text-main">
              -{deckSavingPercent}%
            </span>
            {activeDecks.map((deck) => (
              <button
                key={deck.id}
                type="button"
                onClick={() => toggleDeck(deck.id)}
                className="flex h-[26px] shrink-0 items-center gap-[5px] rounded-full border border-main/60 bg-main/15 px-[10px] text-[15px] tracking-[-0.6px] text-white"
              >
                {deck.name}
                <span className="text-white/60">×</span>
              </button>
            ))}
            {activeCustomHelpers.map((helper) => (
              <button
                key={helper.id}
                type="button"
                onClick={() => toggleCustomHelper(helper.id)}
                className="flex h-[26px] shrink-0 items-center gap-[5px] rounded-full border border-main/60 bg-main/15 px-[10px] text-[15px] tracking-[-0.6px] text-white"
              >
                {helper.name}
                <span className="text-white/60">×</span>
              </button>
            ))}
          </div>
        )}

        {/* 도우미 칩 (가로 스크롤) — 스크롤바가 칩 바로 밑에 붙어 보이지 않도록 pb로 살짝 띄운다 */}
        <div className="chat-scroll-x -mx-[16px] mb-[6px] flex gap-[8px] overflow-x-auto px-[16px] pb-[6px]">
          {categories.map((cat) => {
            const active = selected.some((s) => s.category.key === cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSheetKey(cat.key)}
                className={`flex h-[30px] shrink-0 items-center gap-[4px] rounded-full border px-[13px] text-[15px] tracking-[-0.65px] transition-colors ${
                  active
                    ? "border-main bg-main/25 text-white"
                    : "border-stroke text-white/80"
                }`}
              >
                {cat.label}
                {active && (
                  <span className="text-main">
                    {selected.find((s) => s.category.key === cat.key)?.option.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 선택된 태그 (가로 스크롤) */}
        {selected.length > 0 && (
          <div className="chat-scroll-x -mx-[16px] mb-[10px] flex gap-[6px] overflow-x-auto px-[16px]">
            {selected.map((s) => (
              <button
                key={s.category.key}
                type="button"
                onClick={() => removeHelperOption(s.category.key)}
                className="flex h-[26px] shrink-0 items-center gap-[6px] rounded-[8px] bg-main/25 px-[10px] text-[15px] tracking-[-0.6px] text-white"
              >
                {s.category.label} · {s.option.label}
                <span className="font-semibold text-main">-{Math.round(s.option.saving * 100)}%</span>
                <span className="text-white/60">×</span>
              </button>
            ))}
          </div>
        )}

        {/* 입력창 */}
        <div className="flex items-end gap-[8px] rounded-[16px] bg-gray-box px-[14px] py-[10px]">
          <img src="/assets/icon-plus.svg" alt="첨부" className="mb-[7px] w-[12px] shrink-0 opacity-90" />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={exhausted}
            rows={1}
            placeholder={exhausted ? "냉각수를 모두 사용하였습니다" : "무엇이든 물어보세요"}
            className="max-h-[92px] min-h-[24px] flex-1 resize-none bg-transparent py-[3px] text-[17px] leading-[1.4] tracking-[-0.75px] text-white placeholder:text-white/60 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            aria-label="보내기"
            onClick={send}
            disabled={exhausted || !input.trim()}
            className="size-[34px] shrink-0 disabled:opacity-50"
          >
            <svg viewBox="0 0 33 33" fill="none" className="size-full">
              <rect width="33" height="33" rx="16.5" className={input.trim() && !exhausted ? "fill-main" : "fill-[#6f6f6f]"} />
              <path
                d="M15.25 22C15.25 22.4142 15.5858 22.75 16 22.75C16.4142 22.75 16.75 22.4142 16.75 22L16 22L15.25 22ZM16.5303 10.4697C16.2374 10.1768 15.7626 10.1768 15.4697 10.4697L10.6967 15.2426C10.4038 15.5355 10.4038 16.0104 10.6967 16.3033C10.9896 16.5962 11.4645 16.5962 11.7574 16.3033L16 12.0607L20.2426 16.3033C20.5355 16.5962 21.0104 16.5962 21.3033 16.3033C21.5962 16.0104 21.5962 15.5355 21.3033 15.2426L16.5303 10.4697ZM16 22L16.75 22L16.75 11L16 11L15.25 11L15.25 22L16 22Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ---------- 도우미 옵션 바텀시트 ---------- */}
      {sheetCat && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end" onClick={() => setSheetKey(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="slide-up relative rounded-t-[20px] border-t border-sidebar-stroke bg-[#242628] px-[20px] pb-[28px] pt-[16px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-[14px] h-[4px] w-[40px] rounded-full bg-white/20" />
            <p className="mb-[14px] text-[17px] font-semibold tracking-[-0.75px] text-white">
              {sheetCat.label}
            </p>
            <div className="flex flex-col gap-[8px]">
              {sheetCat.options.filter((opt) => opt.enabled !== false).map((opt, i) => {
                const active = selected.some(
                  (s) => s.category.key === sheetCat.key && s.option.label === opt.label,
                );
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      toggleHelperOption(sheetCat, opt);
                      setSheetKey(null);
                    }}
                    className={`fade-up flex items-center justify-between rounded-[12px] border px-[16px] py-[13px] text-left transition-colors ${
                      active ? "border-main bg-main/20" : "border-stroke"
                    }`}
                    style={{ animationDuration: "0.22s", animationDelay: `${i * 45}ms` }}
                  >
                    <span className="text-[16px] tracking-[-0.7px] text-white">{opt.label}</span>
                    <span className="text-[15px] font-semibold text-main">
                      -{Math.round(opt.saving * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
