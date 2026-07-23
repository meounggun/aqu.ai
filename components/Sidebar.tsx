"use client";

/* 좌측 사이드바 — Figma 228:302 / 824:1209(프롬프트 도우미 패널)
   기획서 사이드바 스펙(새채팅/도우미/어바웃/뉴스/프로필)
   로고를 누르면 아이콘 전용 레일(60px) ↔ 라벨이 붙은 확장 사이드바(220px)로 열렸다 닫혔다 한다. */
/* eslint-disable @next/next/no-img-element */

import { HELPER_CATEGORIES } from "@/lib/water";

export type AppView = "onboarding" | "chat" | "about" | "news" | "profile";

/* Figma 패널의 2열×4행 고정 배치: [요약,톤] [코드,검토] [번역,표] [예시,쉽게] */
const PANEL_ORDER = ["summary", "tone", "code", "review", "translate", "table", "example", "easy"];

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
        <span className="whitespace-nowrap text-[14px] tracking-[-0.7px] text-white/90">{label}</span>
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
}) {
  // 패널이 열리면 아래쪽 아이콘들이 패널 높이만큼 밀려 내려간다 (Figma 실측: +197px)
  const pushDown = panelOpen ? 197 : 0;

  return (
    <aside
      className={`app-sidebar-in absolute left-0 top-0 z-20 h-full border-r border-sidebar-stroke bg-bg transition-[width] duration-300 ${
        sidebarOpen ? "w-[220px]" : "w-[60px]"
      }`}
    >
      {/* 로고 — 클릭하면 사이드바가 열렸다 닫혔다 함 */}
      <button
        type="button"
        aria-label={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
        title={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
        onClick={onToggleSidebar}
        className="absolute left-[13px] top-[28px] w-[34px] cursor-pointer"
      >
        <img src="/assets/logo.svg" alt="AQU.AI" className="w-full" />
      </button>

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

      {/* 프롬프트 도우미 — 클릭 시 아래에 카테고리 추가/제거 패널이 나왔다 들어갔다 함 */}
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
            className="fade-up absolute left-0 top-[46px] z-50 grid w-[198px] grid-cols-2 gap-x-[19px] gap-y-[11px] rounded-[15px] bg-gray-box px-[11px] py-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            style={{ animationDuration: "0.2s" }}
          >
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
                  className={`flex h-[30px] cursor-pointer items-center justify-center rounded-[10px] border text-[13px] font-semibold tracking-[-0.65px] text-white transition-colors ${
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
        )}
      </div>

      <div className="absolute left-[10px] transition-[top] duration-200" style={{ top: 167 + pushDown }}>
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
      <div className="absolute left-[10px] transition-[top] duration-200" style={{ top: 213 + pushDown }}>
        <RailButton
          src="/assets/icon-news.svg"
          alt="뉴스"
          label="뉴스"
          expanded={sidebarOpen}
          onClick={() => onNavigate("news")}
          active={view === "news"}
          iconClassName="w-[17px]"
        />
      </div>
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
