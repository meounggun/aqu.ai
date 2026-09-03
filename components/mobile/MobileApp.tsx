"use client";

/* eslint-disable @next/next/no-img-element */

/* 모바일(폰) 전용 셸 — 상단바 + 슬라이드 드로어 내비게이션 + 뷰 라우팅. */

import { useState } from "react";
import type { AquState, AppView } from "@/lib/useAquState";
import MobileOnboarding from "./MobileOnboarding";
import MobileLanding from "./MobileLanding";
import MobileChat from "./MobileChat";
import MobileProfile from "./MobileProfile";
import MobileNews from "./MobileNews";
import MobileSponsor from "./MobileSponsor";
import MobileMarket from "./MobileMarket";

const NAV: { key: AppView; label: string; icon: string; iconClass: string; action?: "newChat" }[] = [
  { key: "chat", label: "새 채팅", icon: "/assets/icon-newchat.svg", iconClass: "size-[18px]", action: "newChat" },
  { key: "market", label: "프롬프트 도우미 편집", icon: "/assets/icon-helper-edit.svg", iconClass: "w-[20px]" },
  { key: "about", label: "우리에 대하여", icon: "/assets/icon-about.svg", iconClass: "size-[30px]" },
  { key: "sponsor", label: "도움", icon: "/assets/icon-sponsor.svg", iconClass: "w-[18px]" },
  { key: "profile", label: "프로필", icon: "/assets/icon-profile.svg", iconClass: "w-[17px]" },
];

export default function MobileApp({ app }: { app: AquState }) {
  const {
    view,
    setView,
    store,
    enterApp,
    newChat,
    chatSessions,
    loadChatSession,
    deleteChatSession,
    deckStore,
    toggleDeck,
    createDeck,
    removeDeck,
    snapDeck,
    toggleShareDeck,
    customHelperStore,
    toggleCustomHelper,
    createCustomHelper,
    updateCustomHelper,
    removeCustomHelper,
    visibleCategories,
    toggleCategoryVisibility,
    effectiveHelperCategories,
    addBuiltinHelperOption,
    toggleHelperOptionEnabled,
  } = app;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 랜딩(항상 먼저)·소개는 전체화면
  if (view === "landing") {
    return <MobileLanding onStart={enterApp} onAbout={() => setView("about")} />;
  }
  if (view === "about") return <MobileOnboarding onFinish={() => setView("chat")} showBack />;

  const handleNav = (item: (typeof NAV)[number]) => {
    setDrawerOpen(false);
    if (item.action === "newChat") newChat();
    else setView(item.key);
  };

  return (
    <div className="app-enter flex h-[100dvh] flex-col overflow-hidden bg-bg">
      {/* 상단바 */}
      <header className="app-header-in flex h-[54px] shrink-0 items-center justify-between border-b border-sidebar-stroke bg-bg px-[18px]">
        <button type="button" onClick={() => setView("chat")} aria-label="홈">
          <img src="/assets/logo.svg" alt="AQU.AI" className="h-[19px]" />
        </button>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="메뉴 열기"
          className="flex size-[36px] items-center justify-center"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#e9e9e9" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h16M3 11h16M3 16h16" />
          </svg>
        </button>
      </header>

      {/* 뷰 */}
      <main className="min-h-0 flex-1 overflow-hidden">
        {view === "chat" && (
          <div className="h-full">
            <MobileChat app={app} />
          </div>
        )}
        {view === "news" && (
          <div className="chat-scroll h-full overflow-y-auto">
            <MobileNews />
          </div>
        )}
        {view === "sponsor" && (
          <div className="chat-scroll h-full overflow-y-auto">
            <MobileSponsor />
          </div>
        )}
        {view === "profile" && (
          <div className="chat-scroll h-full overflow-y-auto">
            <MobileProfile store={store} />
          </div>
        )}
        {view === "market" && (
          <div className="chat-scroll h-full overflow-y-auto">
            <MobileMarket
              deckStore={deckStore}
              activeDeckIds={deckStore.activeIds}
              onToggleDeck={toggleDeck}
              onCreateDeck={createDeck}
              onRemoveDeck={removeDeck}
              onSnapDeck={snapDeck}
              onToggleShare={toggleShareDeck}
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
          </div>
        )}
      </main>

      {/* 드로어 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <nav
            className="slide-in-left absolute left-0 top-0 flex h-full w-[264px] flex-col bg-bg p-[16px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-[38px] items-center justify-between px-[6px]">
              <img src="/assets/logo.svg" alt="AQU.AI" className="h-[18px]" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="메뉴 닫기"
                className="flex size-[32px] items-center justify-center text-label"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l10 10M14 4L4 14" />
                </svg>
              </button>
            </div>

            <div className="mt-[14px] flex flex-col gap-[4px]">
              {NAV.map((item) => {
                const active = !item.action && view === item.key;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNav(item)}
                    className={`flex h-[46px] items-center gap-[12px] rounded-[12px] px-[12px] transition-colors ${
                      active ? "bg-main/20" : "active:bg-white/10"
                    }`}
                  >
                    <span className="flex size-[26px] shrink-0 items-center justify-center">
                      <img src={item.icon} alt="" className={item.iconClass} />
                    </span>
                    <span className="text-[17px] tracking-[-0.75px] text-white/90">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 최근 항목 — 새 채팅을 누르면 이전 대화가 여기 쌓인다 */}
            <div className="mt-[14px] flex min-h-0 flex-1 flex-col border-t border-white/[0.08] pt-[14px]">
              <p className="mb-[6px] px-[6px] text-[14px] font-semibold tracking-[-0.55px] text-label">
                최근 항목
              </p>
              <div className="chat-scroll flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto pb-[8px]">
                {chatSessions.length === 0 && (
                  <p className="px-[6px] text-[15px] leading-[1.6] tracking-[-0.6px] text-label/70">
                    새 채팅을 시작하면 여기에 대화가 저장돼요.
                  </p>
                )}
                {chatSessions.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center gap-[4px] rounded-[10px] px-[6px] py-[9px] active:bg-white/10"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        loadChatSession(s.id);
                      }}
                      className="min-w-0 flex-1 truncate text-left text-[16px] tracking-[-0.7px] text-white/85"
                    >
                      {s.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteChatSession(s.id)}
                      aria-label="대화 삭제"
                      className="shrink-0 text-[16px] leading-none text-label"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
