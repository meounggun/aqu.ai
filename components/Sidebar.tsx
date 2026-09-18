"use client";

/* 좌측 사이드바 — Figma 228:302 / 824:1209(프롬프트 도우미 패널)
   기획서 사이드바 스펙(새채팅/도우미/어바웃/뉴스/프로필)
   로고를 누르면 아이콘 전용 레일(60px) ↔ 라벨이 붙은 확장 사이드바(220px)로 열렸다 닫혔다 한다. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { HELPER_CATEGORIES } from "@/lib/water";
import { CARD_KIND_LABEL, CATEGORY_COLOR, CATEGORY_LABEL, type Deck } from "@/lib/deck-store";
import type { ChatSession } from "@/lib/chat-history-store";

export type AppView =
  | "landing"
  | "chat"
  | "about"
  | "news"
  | "sponsor"
  | "profile"
  | "market"
  | "exhibit";

/* Figma 패널의 2열×4행 고정 배치: [요약,톤] [코드,검토] [번역,표] [예시,쉽게] */
const PANEL_ORDER = ["summary", "tone", "code", "review", "translate", "table", "example", "easy"];

/** 커스텀 덱 섹션 옆의 설정(톱니바퀴) 버튼 — 덱 마켓으로 바로 연결한다.
   패널 배경색에 상관없이 안전하도록(구멍을 배경색으로 메우지 않도록) 다른 아이콘들과 같은
   방식으로 stroke 선으로만 그린다 — 원 + 균등 배치된 짧은 이빨 8개 */
function GearIcon({ className = "" }: { className?: string }) {
  const C = 8;
  const TEETH = 8;
  const rCircle = 4.3;
  const rTickIn = 5.3;
  const rTickOut = 7;

  const teeth = Array.from({ length: TEETH }, (_, i) => (360 / TEETH) * i);
  const pt = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
  };

  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      {teeth.map((deg) => {
        const a = pt(deg, rTickIn);
        const b = pt(deg, rTickOut);
        return (
          <line
            key={deg}
            x1={a.x.toFixed(2)}
            y1={a.y.toFixed(2)}
            x2={b.x.toFixed(2)}
            y2={b.y.toFixed(2)}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={C} cy={C} r={rCircle} stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function RailButton({
  src,
  alt,
  label,
  expanded,
  onClick,
  active = false,
  iconClassName = "",
}: {
  src: string;
  alt: string;
  label: string;
  expanded: boolean;
  onClick?: () => void;
  active?: boolean;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      aria-label={alt}
      title={alt}
      onClick={onClick}
      className={`flex h-[40px] cursor-pointer items-center rounded-[20px] transition-[width,background-color] duration-300 hover:bg-white/10 ${
        expanded ? "w-[196px] justify-start" : "w-[40px] justify-center"
      } ${active ? "bg-main/25" : ""}`}
    >
      {/* 아이콘은 항상 40px 슬롯 중앙에 — 확장 시 라벨 시작점이 모두 동일하게 정렬됨 */}
      <span className="flex size-[40px] shrink-0 items-center justify-center">
        <img src={src} alt="" className={iconClassName} />
      </span>
      {expanded && (
        <span className="whitespace-nowrap text-[16px] tracking-[-0.7px] text-white/90">{label}</span>
      )}
    </button>
  );
}

export default function Sidebar({
  view,
  onNavigate,
  onNewChat,
  panelOpen,
  onTogglePanel,
  visibleCategories,
  onToggleCategory,
  sidebarOpen,
  onToggleSidebar,
  decks,
  activeDeckIds,
  onToggleDeck,
  onOpenDeckSettings,
  sessions,
  onLoadSession,
  onDeleteSession,
}: {
  view: AppView;
  onNavigate: (v: AppView) => void;
  onNewChat: () => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  visibleCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  decks: Deck[];
  activeDeckIds: string[];
  onToggleDeck: (id: string) => void;
  /** 설정(톱니바퀴) 버튼으로 마켓에 진입 — 일반 "덱 마켓" 아이콘 클릭과 구분해 마켓의 "내 덱" 카드를 흔들어준다 */
  onOpenDeckSettings: () => void;
  /** 새 채팅을 누르면 이전 대화가 여기 저장된다 — 사이드바가 펼쳐졌을 때 "최근 항목"으로 보여준다 */
  sessions: ChatSession[];
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}) {
  // 패널이 열리면 아래쪽 아이콘들이 패널 높이만큼 밀려 내려간다.
  // 덱 개수·펼쳐진 카테고리에 따라 패널 높이가 달라지므로 실제 렌더된 높이를 재서 그만큼만 밀어낸다.
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelH, setPanelH] = useState(0);

  useEffect(() => {
    setPanelH(panelOpen ? (panelRef.current?.offsetHeight ?? 0) : 0);
  }, [panelOpen, decks.length, visibleCategories.size]);
  const pushDown = panelOpen ? panelH + 18 : 0;

  return (
    <aside
      className={`app-sidebar-in absolute left-0 top-0 z-20 h-full border-r border-sidebar-stroke bg-bg transition-[width] duration-300 ${
        sidebarOpen ? "w-[220px]" : "w-[60px]"
      }`}
    >
      {/* 로고 — 접혀 있을 땐 눌러서 펼치고, 펼쳐진 뒤엔 랜딩 페이지로 이동한다 */}
      <button
        type="button"
        aria-label={sidebarOpen ? "랜딩 페이지로 이동" : "사이드바 열기"}
        title={sidebarOpen ? "랜딩 페이지로 이동" : "사이드바 열기"}
        onClick={() => (sidebarOpen ? onNavigate("landing") : onToggleSidebar())}
        className="absolute left-[13px] top-[28px] w-[34px] cursor-pointer"
      >
        <img src="/assets/logo.svg" alt="AQU.AI" className="w-full" />
      </button>

      {/* 사이드바가 펼쳐졌을 때만 보이는 별도의 닫기 버튼 */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="사이드바 닫기"
          title="사이드바 닫기"
          onClick={onToggleSidebar}
          className="absolute right-[14px] top-[19px] flex size-[28px] cursor-pointer items-center justify-center rounded-[8px] text-label transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1.5" y="2.5" width="13" height="11" rx="2" />
            <path d="M6 2.5v11" />
          </svg>
        </button>
      )}

      <div className="absolute left-[10px] top-[72px]">
        <RailButton
          src="/assets/icon-newchat.svg"
          alt="새채팅"
          label="새채팅"
          expanded={sidebarOpen}
          onClick={onNewChat}
          iconClassName="size-[17px]"
        />
      </div>

      {/* 프롬프트 도우미 — 클릭 시 도우미 카테고리와 커스텀 덱이 한 패널에 이어서 열린다 */}
      <div className="absolute left-[10px] top-[118px] z-50" onClick={(e) => e.stopPropagation()}>
        <RailButton
          src="/assets/icon-helper.svg"
          alt="프롬프트 도우미"
          label="프롬프트 도우미"
          expanded={sidebarOpen}
          onClick={onTogglePanel}
          active={panelOpen}
          iconClassName="w-[16px]"
        />

        {panelOpen && (
          <div
            ref={panelRef}
            className="fade-up absolute left-0 top-[46px] z-50 w-[228px] rounded-[15px] bg-gray-box px-[13px] py-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            style={{ animationDuration: "0.2s" }}
          >
            {/* 1) 커스텀 덱 — 옆의 설정 버튼으로 덱 마켓에 바로 연결 (PRD §8-1-1) */}
            <div className="flex items-center justify-between">
              <p className="px-[2px] text-[14px] font-semibold tracking-[-0.55px] text-label">
                커스텀 덱
              </p>
              <button
                type="button"
                onClick={onOpenDeckSettings}
                aria-label="덱 편집에서 설정"
                title="덱 편집에서 설정"
                className="flex size-[22px] cursor-pointer items-center justify-center rounded-[7px] text-label transition-colors hover:bg-white/10 hover:text-white"
              >
                <GearIcon className="size-[14px]" />
              </button>
            </div>
            <div className="mt-[10px]">
              {decks.length === 0 ? (
                <p className="px-[2px] pb-[4px] text-[14px] leading-[1.6] tracking-[-0.55px] text-label/80">
                  아직 덱이 없어요.
                  <br />
                  설정 버튼을 눌러 다른 사람이 공유한 덱을 가져오거나 만들어보세요.
                </p>
              ) : (
                <div className="chat-scroll flex max-h-[190px] flex-col gap-[6px] overflow-y-auto pr-[4px]">
                  {decks.map((deck, i) => {
                    const on = activeDeckIds.includes(deck.id);
                    return (
                      <button
                        key={deck.id}
                        type="button"
                        onClick={() => onToggleDeck(deck.id)}
                        title={deck.cards
                          .map((c) => `${CARD_KIND_LABEL[c.kind]}: ${c.text}`)
                          .join("\n")}
                        className={`fade-up flex cursor-pointer items-center gap-[9px] rounded-[10px] border px-[10px] py-[8px] text-left transition-colors ${
                          on
                            ? "border-main bg-main/20"
                            : "border-stroke hover:border-main/60 hover:bg-white/[0.04]"
                        }`}
                        style={{ animationDuration: "0.25s", animationDelay: `${Math.min(i, 6) * 30}ms` }}
                      >
                        <span
                          className="size-[8px] shrink-0 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLOR[deck.category] }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-semibold tracking-[-0.6px] text-white">
                            {deck.name}
                          </span>
                          <span className="block text-[13px] tracking-[-0.5px] text-label">
                            {CATEGORY_LABEL[deck.category]} · -{Math.round(deck.saving * 100)}%
                          </span>
                        </span>
                        <span
                          className={`flex h-[16px] w-[28px] shrink-0 items-center rounded-full px-[2px] transition-colors duration-200 ${
                            on ? "bg-main" : "bg-white/20"
                          }`}
                        >
                          <span
                            className="size-[12px] rounded-full bg-white transition-transform duration-200"
                            style={{ transform: on ? "translateX(12px)" : "translateX(0)" }}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2) 프롬프트 도우미 바에 노출할 카테고리 선택 — 같은 패널에 이어서 */}
            <div className="mt-[14px] border-t border-white/[0.08] pt-[12px]">
              <p className="mb-[10px] px-[2px] text-[14px] font-semibold tracking-[-0.55px] text-label">
                프롬프트 도우미
              </p>
              <div className="grid grid-cols-2 gap-x-[10px] gap-y-[8px]">
                {PANEL_ORDER.map((key) => {
                  const cat = HELPER_CATEGORIES.find((c) => c.key === key);
                  if (!cat) return null;
                  const isVisible = visibleCategories.has(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => onToggleCategory(cat.key)}
                      title={isVisible ? "프롬프트 도우미 바에서 빼기" : "프롬프트 도우미 바에 추가"}
                      className={`flex h-[30px] cursor-pointer items-center justify-center rounded-[10px] border text-[15px] font-semibold tracking-[-0.65px] text-white transition-colors ${
                        isVisible
                          ? "border-main bg-main"
                          : "border-stroke bg-transparent hover:border-main hover:bg-main/40"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-[10px] transition-[top] duration-200" style={{ top: 164 + pushDown }}>
        <RailButton
          src="/assets/icon-helper-edit.svg"
          alt="프롬프트 도우미 편집"
          label="프롬프트 도우미 편집"
          expanded={sidebarOpen}
          onClick={() => onNavigate("market")}
          active={view === "market"}
          iconClassName="w-[19px]"
        />
      </div>
      <div className="absolute left-[10px] transition-[top] duration-200" style={{ top: 210 + pushDown }}>
        <RailButton
          src="/assets/icon-about.svg"
          alt="우리에 대하여"
          label="우리에 대하여"
          expanded={sidebarOpen}
          onClick={() => onNavigate("about")}
          active={view === "about"}
          iconClassName="size-[40px]"
        />
      </div>
      <div className="absolute left-[10px] transition-[top] duration-200" style={{ top: 256 + pushDown }}>
        <RailButton
          src="/assets/icon-sponsor.svg"
          alt="도움"
          label="도움"
          expanded={sidebarOpen}
          onClick={() => onNavigate("sponsor")}
          active={view === "sponsor"}
          iconClassName="w-[17px]"
        />
      </div>
      <div className="absolute left-[10px] transition-[top] duration-200" style={{ top: 302 + pushDown }}>
        <RailButton
          src="/assets/icon-exhibit.svg"
          alt="전시 체험"
          label="전시 체험"
          expanded={sidebarOpen}
          onClick={() => onNavigate("exhibit")}
          active={view === "exhibit"}
          iconClassName="w-[15px]"
        />
      </div>
      {/* 최근 항목 — 새 채팅을 누르면 이전 대화가 여기 쌓인다. 사이드바가 펼쳐졌을 때만 보인다 */}
      {sidebarOpen && (
        <div
          className="absolute left-[10px] right-[10px] flex flex-col transition-[top] duration-200"
          style={{ top: 381 + pushDown, bottom: 70 }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-[8px] px-[8px] text-[14px] font-semibold tracking-[-0.55px] text-label opacity-65">
            최근 항목
          </p>
          <div className="chat-scroll flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto pr-[2px]">
            {sessions.length === 0 && (
              <p className="px-[8px] text-[14px] leading-[1.6] tracking-[-0.55px] text-label/70">
                새 채팅을 시작하면 여기에 대화가 저장돼요.
              </p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                className="group flex items-center gap-[4px] rounded-[10px] px-[8px] py-[4px] transition-colors hover:bg-white/10"
              >
                <button
                  type="button"
                  onClick={() => onLoadSession(s.id)}
                  title={s.title}
                  className="min-w-0 flex-1 cursor-pointer truncate text-left text-[15px] tracking-[-0.65px] text-white/85"
                >
                  {s.title}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSession(s.id)}
                  aria-label="대화 삭제"
                  title="대화 삭제"
                  className="hidden shrink-0 cursor-pointer text-[15px] leading-none text-label transition-colors hover:text-white group-hover:block"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-[15px] left-[10px]">
        <RailButton
          src="/assets/icon-profile.svg"
          alt="프로필"
          label="프로필"
          expanded={sidebarOpen}
          onClick={() => onNavigate("profile")}
          active={view === "profile"}
          iconClassName="w-[16px]"
        />
      </div>
    </aside>
  );
}
