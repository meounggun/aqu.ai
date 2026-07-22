"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar, { type AppView } from "@/components/Sidebar";
import CupVisual from "@/components/CupVisual";
import StatsBar from "@/components/StatsBar";
import PromptHelper, { type SelectedHelper } from "@/components/PromptHelper";
import ProfileView from "@/components/ProfileView";
import NewsView from "@/components/NewsView";
import OnboardingView from "@/components/OnboardingView";
import {
  DAILY_LIMIT,
  HELPER_CATEGORIES,
  calcUsage,
  generateResponse,
  getStage,
  stageTime,
  type HelperCategory,
  type HelperOption,
} from "@/lib/water";
import {
  type UsageStore,
  dateKey,
  getDay,
  loadStore,
  recordSend,
} from "@/lib/usage-store";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

/** 1920×1080 디자인 캔버스를 뷰포트에 맞게 스케일 */
function useCanvasScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

export default function Home() {
  const scale = useCanvasScale();

  const [view, setView] = useState<AppView>("onboarding");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [helperOpen, setHelperOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedHelper[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    () => new Set(HELPER_CATEGORIES.map((c) => c.key))
  );
  const [typing, setTyping] = useState(false);
  const [store, setStore] = useState<UsageStore>({ history: {} });

  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const stage = getStage(remaining);
  const exhausted = remaining <= 0;

  // 실시간 물 사용량 — 중첩 선택된 도우미 옵션들의 절감율을 곱연산으로 합산
  const breakdown = calcUsage(input);
  const combinedFactor = selected.reduce((f, s) => f * (1 - s.option.saving), 1);
  const liveUsage =
    selected.length > 0 ? Math.round(breakdown.total * combinedFactor) : breakdown.total;

  // [기본 세팅] 사용 기록 로드 → 자정 기준 하루 리셋 (오늘 사용량만 차감)
  useEffect(() => {
    const s = loadStore();
    setStore(s);
    const todayUsed = getDay(s, dateKey()).used;
    let rem = Math.max(0, DAILY_LIMIT - todayUsed);
    // 데모/테스트용: ?ml=700 으로 잔여량 강제 지정
    const params = new URLSearchParams(window.location.search);
    const ml = params.get("ml");
    if (ml !== null && !Number.isNaN(Number(ml))) {
      rem = Math.max(0, Math.min(DAILY_LIMIT, Number(ml)));
    }
    setRemaining(rem);

    // 온보딩은 최초 1회만 노출 (?onboarding=1 로 강제 노출)
    const seen = localStorage.getItem("aqu-onboarded") === "1";
    if (seen && params.get("onboarding") !== "1") {
      setView("chat");
    }
  }, []);

  const finishOnboarding = useCallback(() => {
    localStorage.setItem("aqu-onboarded", "1");
    setView("chat");
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || exhausted || typing) return;

    const usage = Math.min(liveUsage, remaining);
    const options = selected.map((s) => s.option);
    const fullPrompt =
      options.length > 0 ? `${trimmed} ${options.map((o) => o.directive).join(" ")}` : trimmed;

    setMessages((m) => [...m, { id: ++idRef.current, role: "user", text: fullPrompt }]);
    setInput("");
    setSelected([]);
    setHelperOpen(null);
    setRemaining((r) => Math.max(0, r - usage));
    setStore((s) => recordSend(s, usage, options.length > 0));
    setTyping(true);

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: ++idRef.current, role: "ai", text: generateResponse(fullPrompt, usage, options) },
      ]);
      setTyping(false);
    }, 1100);
  }, [input, exhausted, typing, liveUsage, remaining, selected]);

  const newChat = useCallback(() => {
    setMessages([]);
    setInput("");
    setSelected([]);
    setHelperOpen(null);
    setTyping(false);
    setView("chat");
  }, []);

  // 카테고리당 1개 선택 — 새 카테고리는 스택에 추가, 같은 옵션 재클릭은 해제, 같은 카테고리의 다른 옵션은 교체
  const toggleHelperOption = useCallback((category: HelperCategory, option: HelperOption) => {
    setSelected((prev) => {
      const idx = prev.findIndex((s) => s.category.key === category.key);
      if (idx === -1) return [...prev, { category, option }];
      if (prev[idx].option.label === option.label) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { category, option };
      return next;
    });
    setHelperOpen(null);
  }, []);

  const removeHelperOption = useCallback((categoryKey: string) => {
    setSelected((prev) => prev.filter((s) => s.category.key !== categoryKey));
  }, []);

  // 사이드바 패널에서 프롬프트 도우미 바에 표시할 카테고리를 자유롭게 추가/제거
  const toggleCategoryVisibility = useCallback((categoryKey: string) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
        // 바에서 뺀 카테고리에 이미 선택돼 있던 옵션이 있으면 함께 해제
        setSelected((sel) => sel.filter((s) => s.category.key !== categoryKey));
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  }, []);

  return (
    <main className="fixed inset-0">
      <div
        className="absolute left-1/2 top-1/2 h-[1080px] w-[1920px] overflow-hidden bg-bg"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
        onClick={() => {
          if (helperOpen) setHelperOpen(null);
          if (panelOpen) setPanelOpen(false);
          if (sidebarOpen) setSidebarOpen(false);
        }}
      >
        <Sidebar
          view={view}
          onNavigate={setView}
          onNewChat={newChat}
          panelOpen={panelOpen}
          onTogglePanel={() =>
            setPanelOpen((v) => {
              // 프롬프트 도우미 팝업은 '사이드바 닫힌 상태'의 플로팅 오버레이로만 노출 → 열 때 사이드바를 닫아 화면 밀림 없이 표시
              if (!v) setSidebarOpen(false);
              return !v;
            })
          }
          visibleCategories={visibleCategories}
          onToggleCategory={toggleCategoryVisibility}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() =>
            setSidebarOpen((v) => {
              // 사이드바를 열 때는 프롬프트 도우미 팝업을 닫아 둘이 겹치지 않도록
              if (!v) setPanelOpen(false);
              return !v;
            })
          }
        />

        {view === "onboarding" && <OnboardingView onFinish={finishOnboarding} />}

        {/* 사이드바가 열리면 메인 콘텐츠가 가려지지 않도록 오른쪽으로 살짝 밀려난다 */}
        <div
          className="transition-transform duration-300"
          style={{ transform: sidebarOpen && view !== "onboarding" ? "translateX(120px)" : "none" }}
        >
        {view === "profile" && <ProfileView store={store} />}
        {view === "news" && <NewsView />}
        {view === "about" && <OnboardingView onFinish={() => setView("chat")} />}

        {view === "chat" && (
          <>
            {/* ---------- 채팅 / 히어로 영역 ---------- */}
            {messages.length === 0 ? (
              <>
                {/* 사이드바 프롬프트 도우미 팝업이 떠 있는 동안엔 팝업과 겹치지 않도록 히어로 문구만 살짝 비켜난다 */}
                <h1
                  className="absolute top-[141px] text-[48px] font-medium leading-[1.21] tracking-[-2.4px] text-white transition-[left] duration-300"
                  style={{ left: panelOpen ? 240 : 169 }}
                >
                  짧고 명확한 질문은 <br />
                  AI의 물 사용량을 줄일 수 있습니다
                </h1>
                <p
                  className="absolute top-[285px] text-[16px] tracking-[-0.8px] text-[#bbb] transition-[left] duration-300"
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
                      <p className="whitespace-pre-wrap text-[16px] leading-[1.5] tracking-[-0.75px] text-white/90">
                        {msg.text}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={msg.id}
                      className="fade-up flex w-[770px] flex-col gap-[18px] pl-[16px]"
                    >
                      <p className="whitespace-pre-wrap text-[15px] leading-[1.5] tracking-[-0.75px] text-white/90">
                        {msg.text}
                      </p>
                      <img
                        src="/assets/response-actions.svg"
                        alt="응답 액션"
                        className="h-[15px] w-[98px] opacity-80"
                      />
                    </div>
                  )
                )}
                {typing && (
                  <div className="flex gap-[6px] pl-[16px] pt-[4px]">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="typing-dot size-[7px] rounded-full bg-white/70" />
                    ))}
                  </div>
                )}
                {exhausted && !typing && (
                  <p className="pl-[16px] pt-[8px] text-[15px] tracking-[-0.75px] text-label">
                    오늘 쓸 수 있는 냉각수를 모두 사용하였습니다.
                  </p>
                )}
              </div>
            )}

            {/* ---------- 물컵 오브제 ---------- */}
            <div className="absolute left-[1051px] top-[187px] size-[800px]">
              <CupVisual remaining={remaining} stage={stage} />
            </div>

            {/* 현재 시간 배지 */}
            <div className="absolute left-[1369px] top-[204px] flex h-[31px] w-[172px] items-center justify-center rounded-[17px] border border-label">
              <span className="text-[14px] tracking-[-0.7px] text-label">
                현재 시간 {stageTime(stage)}
              </span>
            </div>
            <p className="absolute left-[1348px] top-[251px] text-[14px] tracking-[-0.7px] text-label">
              물의 하루가 지나면 사용이 중지됩니다.
            </p>

            {/* ---------- 프롬프트 도우미 ---------- */}
            <div onClick={(e) => e.stopPropagation()}>
              <PromptHelper
                openKey={helperOpen}
                selected={selected}
                onToggle={setHelperOpen}
                onSelectOption={toggleHelperOption}
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
                className="absolute left-[21px] top-[18px] h-[68px] w-[740px] resize-none bg-transparent text-[16px] leading-[1.5] tracking-[-0.8px] text-white placeholder:text-white/69 disabled:cursor-not-allowed"
              />
              {/* 선택된 도우미 옵션 태그들 — 중첩 선택 가능, 각각 자유롭게 클릭해서 제거 */}
              {selected.length > 0 && (
                <div className="absolute bottom-[14px] left-[48px] flex max-w-[700px] flex-wrap gap-[6px]">
                  {selected.map((s) => (
                    <button
                      key={s.category.key}
                      type="button"
                      onClick={() => removeHelperOption(s.category.key)}
                      className="flex h-[24px] cursor-pointer items-center gap-[6px] rounded-[8px] bg-main/25 px-[10px] text-[12px] tracking-[-0.6px] text-white"
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
              <img
                src="/assets/icon-plus.svg"
                alt="첨부"
                className="absolute bottom-[20px] left-[21px] w-[12px] cursor-pointer opacity-90"
              />
              <button
                type="button"
                aria-label="보내기"
                onClick={send}
                disabled={exhausted || !input.trim()}
                className="absolute bottom-[13px] right-[43px] size-[33px] cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-50"
              >
                <img src="/assets/send-btn.svg" alt="" className="size-full" />
              </button>
            </div>

            {/* ---------- 통계 ---------- */}
            <StatsBar
              liveUsage={exhausted ? 0 : liveUsage}
              remaining={remaining}
              flags={exhausted ? [] : breakdown.flags}
              savingPercent={
                !exhausted && selected.length > 0 && breakdown.total > 0
                  ? Math.round((1 - combinedFactor) * 100)
                  : 0
              }
            />
          </>
        )}
        </div>
      </div>
    </main>
  );
}
