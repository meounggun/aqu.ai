"use client";

/* eslint-disable @next/next/no-img-element */

/* 모바일(폰) 전용 셸 — 상단바 + 슬라이드 드로어 내비게이션 + 뷰 라우팅. */

import { useState } from "react";
import type { AquState, AppView } from "@/lib/useAquState";
import MobileOnboarding from "./MobileOnboarding";
import MobileChat from "./MobileChat";
import MobileProfile from "./MobileProfile";
import MobileNews from "./MobileNews";

const NAV: { key: AppView; label: string; icon: string; iconClass: string; action?: "newChat" }[] = [
  { key: "chat", label: "새 채팅", icon: "/assets/icon-newchat.svg", iconClass: "size-[18px]", action: "newChat" },
  { key: "about", label: "우리에 대하여", icon: "/assets/icon-about.svg", iconClass: "size-[30px]" },
  { key: "news", label: "뉴스", icon: "/assets/icon-news.svg", iconClass: "w-[18px]" },
  { key: "profile", label: "프로필", icon: "/assets/icon-profile.svg", iconClass: "w-[17px]" },
];

export default function MobileApp({ app }: { app: AquState }) {
  const { view, setView, store, finishOnboarding, newChat } = app;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 온보딩(최초)·소개는 전체화면
  if (view === "onboarding") return <MobileOnboarding onFinish={finishOnboarding} />;
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
        {view === "profile" && (
          <div className="chat-scroll h-full overflow-y-auto">
            <MobileProfile store={store} />
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
                const active = item.action !== "newChat" && view === item.key;
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
                    <span className="text-[15px] tracking-[-0.75px] text-white/90">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
