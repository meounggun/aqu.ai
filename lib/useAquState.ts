"use client";

/* 데스크탑/모바일 레이아웃이 공유하는 앱 상태 & 로직 (단일 소스).
   레이아웃 컴포넌트는 이 훅을 호출해 상태를 받고, 각자 UI만 다르게 그린다.
   물컵 애니메이션은 sendTick 카운터로 트리거 → 각 레이아웃이 자신의 컵을 재생. */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppView } from "@/components/Sidebar";
import type { SelectedHelper } from "@/components/PromptHelper";
import {
  DAILY_LIMIT,
  HELPER_CATEGORIES,
  calcUsage,
  generateResponse,
  getStage,
  type HelperCategory,
  type HelperOption,
} from "@/lib/water";
import { type UsageStore, dateKey, getDay, loadStore, recordSend } from "@/lib/usage-store";

export interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

export function useAquState() {
  const [view, setView] = useState<AppView>("onboarding");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [selected, setSelected] = useState<SelectedHelper[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    () => new Set(HELPER_CATEGORIES.map((c) => c.key)),
  );
  const [typing, setTyping] = useState(false);
  const [store, setStore] = useState<UsageStore>({ history: {} });
  const [sendTick, setSendTick] = useState(0);

  const idRef = useRef(0);

  const stage = getStage(remaining);
  const exhausted = remaining <= 0;

  // 실시간 물 사용량 — 중첩 선택된 도우미 옵션들의 절감율을 곱연산으로 합산
  const breakdown = calcUsage(input);
  const combinedFactor = selected.reduce((f, s) => f * (1 - s.option.saving), 1);
  const liveUsage =
    selected.length > 0 ? Math.round(breakdown.total * combinedFactor) : breakdown.total;
  const savingPercent =
    selected.length > 0 && breakdown.total > 0 ? Math.round((1 - combinedFactor) * 100) : 0;

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
    setRemaining((r) => Math.max(0, r - usage));
    setStore((s) => recordSend(s, usage, options.length > 0));
    setTyping(true);
    setSendTick((t) => t + 1);

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
        setSelected((sel) => sel.filter((s) => s.category.key !== categoryKey));
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  }, []);

  return {
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
    combinedFactor,
    liveUsage,
    savingPercent,
    sendTick,
    send,
    newChat,
    finishOnboarding,
    toggleHelperOption,
    removeHelperOption,
    toggleCategoryVisibility,
  };
}

export type AquState = ReturnType<typeof useAquState>;
export type { AppView };
