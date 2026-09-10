"use client";

/* eslint-disable @next/next/no-img-element */

/* 데스크탑/태블릿(≥768px) 레이아웃 — 1920×1080 디자인 캔버스를 뷰포트 너비에 맞춰
   스케일하고 세로 중앙 정렬한다. 16:9가 아니어도 위아래 여백이 균형 있게 나뉜다. */

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import SendCupVideo from "@/components/SendCupVideo";
import StatsBar from "@/components/StatsBar";
import PromptHelper from "@/components/PromptHelper";
import ProfileView from "@/components/ProfileView";
import NewsView from "@/components/NewsView";
import SponsorView from "@/components/SponsorView";
import MarketView from "@/components/MarketView";
import OnboardingView from "@/components/OnboardingView";
import LandingView from "@/components/LandingView";
import { stageTime } from "@/lib/water";
import { copyCard, downloadCardAsPdf } from "@/lib/card-export";
import type { AquState } from "@/lib/useAquState";

/** 1920×1080 캔버스를 뷰포트 너비에 반응형으로 맞춘다(항상 너비를 채우고 세로 중앙 정렬). */
/** 확대 배율 상한 — 초고해상도(2496px 이상)에서 UI가 과하게 커지는 것을 막는다.
    상한에 걸리면 캔버스는 화면 가운데 놓이고 양옆은 같은 배경색(--bg)으로 이어져 티가 나지 않는다.
    반대로 좁은 창에서는 하한을 두지 않는다 — 계속 줄어들어야 내용이 잘리지 않는다. */
const MAX_CANVAS_SCALE = 1.3;

function useCanvasScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // 세로가 긴 화면이면 전체가 보이도록 축소, 아니면 너비를 꽉 채운다
      const fit = w / h < 1 ? Math.min(w / 1920, h / 1080) : w / 1920;
      setScale(Math.min(fit, MAX_CANVAS_SCALE));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

export default function DesktopApp({ app }: { app: AquState }) {
  const {
    view,
    setView,
    input,
    setInput,
    messages,
    remaining,
    stage,
    exhausted,
    selected,
    visibleCategories,
    typing,
    store,
    breakdown,
    liveUsage,
    savingPercent,
    send,
    newChat,
    enterApp,
    chatSessions,
    loadChatSession,
    deleteChatSession,
    toggleHelperOption,
    removeHelperOption,
    toggleCategoryVisibility,
    effectiveHelperCategories,
    addBuiltinHelperOption,
    toggleHelperOptionEnabled,
    deckStore,
    activeDecks,
    toggleDeck,
    createDeck,
    removeDeck,
    snapDeck,
    toggleShareDeck,
    customHelperStore,
    activeCustomHelpers,
    createCustomHelper,
    updateCustomHelper,
    removeCustomHelper,
    toggleCustomHelper,
  } = app;

  const scale = useCanvasScale();
  const scaledW = 1920 * scale;
  const scaledH = 1080 * scale;

  const [helperOpen, setHelperOpen] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  // 사이드바 설정(톱니바퀴) 버튼으로 마켓에 진입했을 때만 "내 덱" 카드를 흔들어 알려준다.
  // 매번 값을 바꿔야 같은 화면에서 다시 눌러도 애니메이션이 재생된다.
  const [deckNudge, setDeckNudge] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // 도우미 옵션 선택 시 열린 드롭다운 닫기
  const handleSelectOption = (
    category: Parameters<typeof toggleHelperOption>[0],
    option: Parameters<typeof toggleHelperOption>[1],
  ) => {
    toggleHelperOption(category, option);
    setHelperOpen(null);
  };

  // 랜딩은 사이드바 없이 전체 화면으로 — 접속할 때마다 항상 먼저 보인다
  if (view === "landing") {
    return (
      <main className="grid min-h-[100dvh] w-full place-items-center overflow-x-hidden bg-bg">
        <div
          className="app-enter relative overflow-hidden bg-bg"
          style={{ width: scaledW, height: scaledH }}
        >
          <div
            className="absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
            style={{ transform: `scale(${scale})` }}
          >
            <LandingView onStart={enterApp} onAbout={() => setView("about")} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-[100dvh] w-full place-items-center overflow-x-hidden bg-bg">
      <div
        className="app-enter relative overflow-hidden bg-bg"
        style={{ width: scaledW, height: scaledH }}
      >
        <div
          className="absolute left-0 top-0 h-[1080px] w-[1920px] origin-top-left"
          style={{ transform: `scale(${scale})` }}
          onClick={() => {
            if (helperOpen) setHelperOpen(null);
            if (panelOpen) setPanelOpen(false);
            if (sidebarOpen) setSidebarOpen(false);
          }}
        >
          <Sidebar
            view={view}
            onNavigate={(v) => {
              setView(v);
              setPanelOpen(false);
            }}
            onNewChat={newChat}
            panelOpen={panelOpen}
            onTogglePanel={() => setPanelOpen((v) => !v)}
            visibleCategories={visibleCategories}
            onToggleCategory={toggleCategoryVisibility}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            decks={deckStore.installed}
            activeDeckIds={deckStore.activeIds}
            onToggleDeck={toggleDeck}
            onOpenDeckSettings={() => {
              setView("market");
              setPanelOpen(false);
              setDeckNudge((n) => n + 1);
            }}
            sessions={chatSessions}
            onLoadSession={loadChatSession}
            onDeleteSession={deleteChatSession}
          />

          {/* 사이드바가 열리면 메인 콘텐츠가 가려지지 않도록 오른쪽으로 살짝 밀려난다 */}
          <div
            className="transition-transform duration-300"
            style={{
              transform: sidebarOpen ? "translateX(120px)" : "none",
            }}
          >
            {view === "profile" && <ProfileView store={store} />}
            {view === "news" && <NewsView />}
            {view === "sponsor" && <SponsorView />}
            {view === "market" && (
              <MarketView
                deckStore={deckStore}
                activeDeckIds={deckStore.activeIds}
                onToggleDeck={toggleDeck}
                onCreateDeck={createDeck}
                onRemoveDeck={removeDeck}
                onSnapDeck={snapDeck}
                onToggleShare={toggleShareDeck}
                nudgeMyDecks={deckNudge}
                customHelperStore={customHelperStore}
                onToggleCustomHelper={toggleCustomHelper}
                onCreateCustomHelper={createCustomHelper}
                onUpdateCustomHelper={updateCustomHelper}
                onRemoveCustomHelper={removeCustomHelper}
                visibleCategories={visibleCategories}
                onToggleCategory={toggleCategoryVisibility}
                allHelperCategories={effectiveHelperCategories}
                onAddBuiltinOption={addBuiltinHelperOption}
                onToggleHelperOption={toggleHelperOptionEnabled}
              />
            )}
            {view === "about" && <OnboardingView onFinish={() => setView("chat")} />}

            {view === "chat" && (
              <>
                {/* ---------- 채팅 / 히어로 영역 ---------- */}
                {messages.length === 0 ? (
                  <>
                    <h1
                      className="absolute top-[141px] text-[48px] font-medium leading-[1.21] tracking-[-2.4px] text-white transition-[left] duration-300"
                      style={{ left: panelOpen ? 240 : 169 }}
                    >
                      짧고 명확한 질문은 <br />
                      AI의 물 사용량을 줄일 수 있습니다
                    </h1>
                    <p
                      className="absolute top-[285px] text-[18px] tracking-[-0.8px] text-[#bbb] transition-[left] duration-300"
                      style={{ left: panelOpen ? 240 : 169 }}
                    >
                      프롬프트 도우미로 효율적인 대화를 시작해보세요
                    </p>
                  </>
                ) : (
                  <div
                    ref={scrollRef}
                    className="chat-scroll absolute left-[169px] top-[60px] flex h-[760px] w-[802px] flex-col gap-[36px] overflow-y-auto pb-[24px] pr-[8px] pt-[24px]"
                  >
                    {messages.map((msg) =>
                      msg.role === "user" ? (
                        <div
                          key={msg.id}
                          className="fade-up max-w-[580px] self-end rounded-[17px] bg-main px-[19px] py-[12px]"
                        >
                          <p className="whitespace-pre-wrap text-[18px] leading-[1.5] tracking-[-0.75px] text-white/90">
                            {msg.text}
                          </p>
                        </div>
                      ) : (
                        <div
                          key={msg.id}
                          className="fade-up flex w-[770px] flex-col gap-[18px] pl-[16px]"
                        >
                          <p className="whitespace-pre-wrap text-[17px] leading-[1.5] tracking-[-0.75px] text-white/90">
                            {msg.text}
                          </p>
                          <div className="flex items-center gap-[14px]">
                            <img
                              src="/assets/response-actions.svg"
                              alt="응답 액션"
                              className="h-[15px] w-[98px] opacity-80"
                            />
                            {/* 결과물 PDF 내보내기 (PRD §8-1-3) — AI 답변 텍스트만 담은 카드를 PDF 한 장으로 저장한다 */}
                            <button
                              type="button"
                              onClick={() => downloadCardAsPdf({ text: msg.text })}
                              className="cursor-pointer rounded-full border border-stroke px-[12px] py-[5px] text-[15px] tracking-[-0.6px] text-white/80 transition-colors hover:border-main hover:text-white"
                            >
                              PDF 내보내기
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const ok = await copyCard({ text: msg.text });
                                if (ok) {
                                  setCopied(msg.id);
                                  setTimeout(() => setCopied(null), 1600);
                                }
                              }}
                              className="cursor-pointer text-[15px] tracking-[-0.6px] text-label transition-colors hover:text-white"
                            >
                              {copied === msg.id ? "복사됨!" : "이미지 복사"}
                            </button>
                            {msg.deckNames && msg.deckNames.length > 0 && (
                              <span className="text-[14px] tracking-[-0.55px] text-label">
                                덱 {msg.deckNames.join(" · ")} · 절약{" "}
                                <span className="font-semibold text-main">
                                  {(msg.savedMl ?? 0).toLocaleString()}mL
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                    {typing && (
                      <div className="flex gap-[6px] pl-[16px] pt-[4px]">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="typing-dot size-[7px] rounded-full bg-white/70" />
                        ))}
                      </div>
                    )}
                    {exhausted && !typing && (
                      <p className="pl-[16px] pt-[8px] text-[17px] tracking-[-0.75px] text-label">
                        오늘 쓸 수 있는 냉각수를 모두 사용하였습니다.
                      </p>
                    )}
                  </div>
                )}

                {/* ---------- 물컵 오브제 (메인 비주얼) — 중심(1451, 587)은 그대로 두고 크기만 키운다 ---------- */}
                <div className="absolute left-[1001px] top-[137px] size-[900px]">
                  <SendCupVideo stage={stage} />
                </div>

                {/* 현재 시간 배지 */}
                <div className="absolute left-[1369px] top-[204px] flex h-[31px] w-[172px] items-center justify-center rounded-[17px] border border-label">
                  <span className="text-[16px] tracking-[-0.7px] text-label">
                    현재 시간 {stageTime(stage)}
                  </span>
                </div>
                <p className="absolute left-[1348px] top-[251px] text-[16px] tracking-[-0.7px] text-label">
                  물의 하루가 지나면 사용이 중지됩니다.
                </p>

                {/* ---------- 프롬프트 도우미 ---------- */}
                <div onClick={(e) => e.stopPropagation()}>
                  <PromptHelper
                    allCategories={effectiveHelperCategories}
                    openKey={helperOpen}
                    selected={selected}
                    onToggle={setHelperOpen}
                    onSelectOption={handleSelectOption}
                    visibleCategories={visibleCategories}
                  />
                </div>

                {/* ---------- 입력 영역 ---------- */}
                <div className="absolute left-[169px] top-[885px] h-[125px] w-[802px] rounded-[17px] bg-gray-box">
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
                    placeholder={
                      exhausted
                        ? "오늘 쓸 수 있는 냉각수를 모두 사용하였습니다"
                        : "무엇이든 물어보세요"
                    }
                    className="absolute left-[21px] top-[18px] h-[58px] w-[760px] resize-none bg-transparent text-[18px] leading-[1.5] tracking-[-0.8px] text-white placeholder:text-white/69 disabled:cursor-not-allowed"
                  />
                  <div className="absolute bottom-[13px] left-[21px] right-[21px] flex h-[33px] items-center gap-[10px]">
                    <img
                      src="/assets/icon-plus.svg"
                      alt="첨부"
                      className="w-[12px] shrink-0 cursor-pointer opacity-90"
                    />
                    {(selected.length > 0 ||
                      activeDecks.length > 0 ||
                      activeCustomHelpers.length > 0) && (
                      <div className="chat-scroll-x flex min-w-0 flex-1 items-center gap-[6px] overflow-x-auto">
                        {/* 장착된 커스텀 덱 — 클릭하면 즉시 해제 */}
                        {activeDecks.map((deck) => (
                          <button
                            key={deck.id}
                            type="button"
                            onClick={() => toggleDeck(deck.id)}
                            className="flex h-[24px] shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-main/60 bg-main/15 px-[10px] text-[15px] tracking-[-0.6px] text-white"
                            title="클릭하여 덱 해제"
                          >
                            {deck.name}
                            <span className="font-semibold text-main">
                              -{Math.round(deck.saving * 100)}%
                            </span>
                            <span className="text-white/60">×</span>
                          </button>
                        ))}
                        {/* 나만의 프롬프트 도우미 — 클릭하면 즉시 해제 */}
                        {activeCustomHelpers.map((helper) => (
                          <button
                            key={helper.id}
                            type="button"
                            onClick={() => toggleCustomHelper(helper.id)}
                            className="flex h-[24px] shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] border border-main/60 bg-main/15 px-[10px] text-[15px] tracking-[-0.6px] text-white"
                            title="클릭하여 해제"
                          >
                            {helper.name}
                            <span className="font-semibold text-main">
                              -{Math.round(helper.saving * 100)}%
                            </span>
                            <span className="text-white/60">×</span>
                          </button>
                        ))}
                        {selected.map((s) => (
                          <button
                            key={s.category.key}
                            type="button"
                            onClick={() => removeHelperOption(s.category.key)}
                            className="flex h-[24px] shrink-0 cursor-pointer items-center gap-[6px] rounded-[8px] bg-main/25 px-[10px] text-[15px] tracking-[-0.6px] text-white"
                            title="클릭하여 해제"
                          >
                            {s.category.label} · {s.option.label}
                            <span className="font-semibold text-main">
                              -{Math.round(s.option.saving * 100)}%
                            </span>
                            <span className="text-white/60">×</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {selected.length === 0 &&
                      activeDecks.length === 0 &&
                      activeCustomHelpers.length === 0 && <div className="flex-1" />}
                    <button
                      type="button"
                      aria-label="보내기"
                      onClick={send}
                      disabled={exhausted || !input.trim()}
                      className="group size-[33px] shrink-0 cursor-pointer disabled:cursor-default disabled:opacity-50"
                    >
                      <svg viewBox="0 0 33 33" fill="none" className="size-full">
                        <rect
                          width="33"
                          height="33"
                          rx="16.5"
                          className="fill-[#6f6f6f] opacity-100 transition-[fill,opacity] duration-200 group-hover:fill-main group-hover:opacity-80"
                        />
                        <path
                          d="M15.25 22C15.25 22.4142 15.5858 22.75 16 22.75C16.4142 22.75 16.75 22.4142 16.75 22L16 22L15.25 22ZM16.5303 10.4697C16.2374 10.1768 15.7626 10.1768 15.4697 10.4697L10.6967 15.2426C10.4038 15.5355 10.4038 16.0104 10.6967 16.3033C10.9896 16.5962 11.4645 16.5962 11.7574 16.3033L16 12.0607L20.2426 16.3033C20.5355 16.5962 21.0104 16.5962 21.3033 16.3033C21.5962 16.0104 21.5962 15.5355 21.3033 15.2426L16.5303 10.4697ZM16 22L16.75 22L16.75 11L16 11L15.25 11L15.25 22L16 22Z"
                          fill="white"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ---------- 통계 ---------- */}
                <StatsBar
                  liveUsage={exhausted ? 0 : liveUsage}
                  remaining={remaining}
                  flags={exhausted ? [] : breakdown.flags}
                  savingPercent={exhausted ? 0 : savingPercent}
                />

              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
