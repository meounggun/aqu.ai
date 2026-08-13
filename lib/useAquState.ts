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
import {
  type Deck,
  type DeckCard,
  type DeckCategory,
  type DeckStore,
  createDeck as createDeckIn,
  deckDirective,
  loadDeckStore,
  removeDeck as removeDeckIn,
  snapDeck as snapDeckIn,
  toggleDeck as toggleDeckIn,
  toggleShare as toggleShareIn,
} from "@/lib/deck-store";
import {
  type CustomHelper,
  type CustomHelperStore,
  createCustomHelper as createCustomHelperIn,
  loadCustomHelperStore,
  removeCustomHelper as removeCustomHelperIn,
  toggleCustomHelper as toggleCustomHelperIn,
  updateCustomHelper as updateCustomHelperIn,
} from "@/lib/custom-helper-store";
import {
  type HelperOverrideStore,
  addHelperOption as addHelperOptionIn,
  applyHelperOverrides,
  loadHelperOverrides,
  removeHelperOption as removeBuiltinOptionIn,
} from "@/lib/helper-overrides-store";
import {
  type ChatHistoryStore,
  type ChatMessage,
  loadChatHistory,
  removeChatSession as removeChatSessionIn,
  saveChatHistory,
  upsertChatSession,
} from "@/lib/chat-history-store";

export type Message = ChatMessage;

export function useAquState() {
  // 랜딩은 접속할 때마다 항상 먼저 보여준다 (기억해두고 건너뛰지 않는다)
  const [view, setView] = useState<AppView>("landing");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  // 새 채팅을 시작하면 이전 대화가 "최근 항목"에 저장된다 (기존 AI 사이트의 히스토리처럼)
  const [chatHistory, setChatHistory] = useState<ChatHistoryStore>({ sessions: [] });
  const currentSessionIdRef = useRef<string | null>(null);
  const [remaining, setRemaining] = useState(DAILY_LIMIT);
  const [selected, setSelected] = useState<SelectedHelper[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    () => new Set(HELPER_CATEGORIES.map((c) => c.key)),
  );
  const [typing, setTyping] = useState(false);
  const [store, setStore] = useState<UsageStore>({ history: {} });
  const [sendTick, setSendTick] = useState(0);

  // 프롬프트 워크스페이스 확장 (PRD §8)
  const [deckStore, setDeckStore] = useState<DeckStore>({
    installed: [],
    activeIds: [],
    marketSnaps: {},
  });

  // 나만의 프롬프트 도우미 — "내 덱"처럼 사용자가 만들고 켜고 끄는 프롬프트 템플릿
  const [customHelperStore, setCustomHelperStore] = useState<CustomHelperStore>({
    items: [],
    activeIds: [],
  });

  // 기본 도우미(요약/번역/코드 등) 내부 옵션에 사용자가 추가/삭제한 내용
  const [helperOverrides, setHelperOverrides] = useState<HelperOverrideStore>({
    added: {},
    removed: {},
  });

  const idRef = useRef(0);

  const stage = getStage(remaining);
  const exhausted = remaining <= 0;

  const activeDecks = deckStore.installed.filter((d) => deckStore.activeIds.includes(d.id));
  const activeCustomHelpers = customHelperStore.items.filter((h) =>
    customHelperStore.activeIds.includes(h.id),
  );

  // 실시간 물 사용량 — 도우미 옵션·장착된 덱·나만의 도우미의 절감율을 모두 곱연산으로 합산
  const breakdown = calcUsage(input);
  const helperFactor = selected.reduce((f, s) => f * (1 - s.option.saving), 1);
  const deckFactor = activeDecks.reduce((f, d) => f * (1 - d.saving), 1);
  const customHelperFactor = activeCustomHelpers.reduce((f, h) => f * (1 - h.saving), 1);
  const combinedFactor = helperFactor * deckFactor * customHelperFactor;
  const liveUsage = Math.round(breakdown.total * combinedFactor);
  const savingPercent =
    breakdown.total > 0 && combinedFactor < 1 ? Math.round((1 - combinedFactor) * 100) : 0;
  // 장착된 덱 + 나만의 프롬프트 도우미를 합친 절감율 — 입력창이 비어 있을 때도 보여주는 배지용
  const deckSavingPercent = Math.round((1 - deckFactor * customHelperFactor) * 100);

  // 기본 도우미(요약/번역/코드 등)에 사용자가 추가/삭제한 옵션을 반영한 실제 목록.
  // 채팅 바·프로필 도우미 편집 화면 모두 이 목록을 기준으로 그린다
  const effectiveHelperCategories = applyHelperOverrides(HELPER_CATEGORIES, helperOverrides);

  // [기본 세팅] 사용 기록 로드 → 자정 기준 하루 리셋 (오늘 사용량만 차감)
  useEffect(() => {
    const s = loadStore();
    setStore(s);
    setDeckStore(loadDeckStore());
    setCustomHelperStore(loadCustomHelperStore());
    setHelperOverrides(loadHelperOverrides());
    setChatHistory(loadChatHistory());
    const todayUsed = getDay(s, dateKey()).used;
    let rem = Math.max(0, DAILY_LIMIT - todayUsed);
    // 데모/테스트용: ?ml=700 으로 잔여량 강제 지정
    const params = new URLSearchParams(window.location.search);
    const ml = params.get("ml");
    if (ml !== null && !Number.isNaN(Number(ml))) {
      rem = Math.max(0, Math.min(DAILY_LIMIT, Number(ml)));
    }
    setRemaining(rem);
  }, []);

  /** 랜딩/소개 화면에서 메인(채팅)으로 진입 */
  const enterApp = useCallback(() => setView("chat"), []);

  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || exhausted || typing) return;

    const usage = Math.min(liveUsage, remaining);
    const options = selected.map((s) => s.option);
    // 장착된 덱 + 나만의 프롬프트 도우미의 지시문이 도우미 옵션과 함께 프롬프트에 자동으로 이어붙는다
    const directives = [
      ...activeDecks.map((d) => deckDirective(d)),
      ...activeCustomHelpers.map((h) => h.directive),
      ...options.map((o) => o.directive),
    ];
    const fullPrompt = directives.length > 0 ? `${trimmed} ${directives.join(" ")}` : trimmed;

    // 덱을 안 썼을 때(Baseline) 대비 실제 절감량 — 메시지 하단에 참고용으로만 표시
    const baselineMl = Math.round(breakdown.total * helperFactor);
    const savedMl = Math.max(0, Math.round(baselineMl - liveUsage));
    const deckNames = activeDecks.map((d) => d.name);

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
        {
          id: ++idRef.current,
          role: "ai",
          text: generateResponse(fullPrompt, usage, options),
          usedMl: usage,
          savedMl,
          deckNames,
        },
      ]);
      setTyping(false);
    }, 1100);
  }, [
    input,
    exhausted,
    typing,
    liveUsage,
    remaining,
    selected,
    activeDecks,
    activeCustomHelpers,
    breakdown.total,
    helperFactor,
  ]);

  const newChat = useCallback(() => {
    if (messages.length > 0) {
      const id = currentSessionIdRef.current ?? `session-${Date.now()}`;
      const next = upsertChatSession(chatHistory, { id, messages });
      saveChatHistory(next);
      setChatHistory(next);
    }
    currentSessionIdRef.current = null;
    setMessages([]);
    setInput("");
    setSelected([]);
    setTyping(false);
    setView("chat");
  }, [messages, chatHistory]);

  /** 사이드바 "최근 항목"에서 지난 대화를 다시 불러온다 */
  const loadChatSession = useCallback(
    (id: string) => {
      const session = chatHistory.sessions.find((s) => s.id === id);
      if (!session) return;
      currentSessionIdRef.current = session.id;
      setMessages(session.messages);
      setInput("");
      setSelected([]);
      setTyping(false);
      setView("chat");
    },
    [chatHistory],
  );

  const deleteChatSession = useCallback((id: string) => {
    if (currentSessionIdRef.current === id) currentSessionIdRef.current = null;
    setChatHistory((h) => {
      const next = removeChatSessionIn(h, id);
      saveChatHistory(next);
      return next;
    });
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

  /* ---------- 기본 도우미(요약/번역/코드 등) 내부 옵션 추가/삭제 ---------- */

  const addBuiltinHelperOption = useCallback(
    (categoryKey: string, option: HelperOption) => {
      setHelperOverrides((s) => addHelperOptionIn(s, categoryKey, option));
    },
    [],
  );

  const removeBuiltinHelperOption = useCallback(
    (categoryKey: string, optionLabel: string, isBuiltIn: boolean) => {
      setHelperOverrides((s) => removeBuiltinOptionIn(s, categoryKey, optionLabel, isBuiltIn));
      // 지우려는 옵션이 지금 채팅 바에서 선택돼 있었다면 선택도 함께 풀어준다
      setSelected((sel) =>
        sel.filter((s) => !(s.category.key === categoryKey && s.option.label === optionLabel)),
      );
    },
    [],
  );

  /* ---------- 커스텀 덱 / 마켓 (PRD §8) ---------- */

  const toggleDeck = useCallback((id: string) => {
    setDeckStore((s) => toggleDeckIn(s, id));
  }, []);

  const createDeck = useCallback(
    (input: { name: string; category: DeckCategory; description: string; cards: DeckCard[] }) => {
      setDeckStore((s) => createDeckIn(s, input));
    },
    [],
  );

  const removeDeck = useCallback((id: string) => {
    setDeckStore((s) => removeDeckIn(s, id));
  }, []);

  const snapDeck = useCallback((deck: Deck) => {
    setDeckStore((s) => snapDeckIn(s, deck));
  }, []);

  const toggleShareDeck = useCallback((id: string) => {
    setDeckStore((s) => toggleShareIn(s, id));
  }, []);

  /* ---------- 나만의 프롬프트 도우미 (내 덱과 같은 패턴) ---------- */

  const createCustomHelper = useCallback(
    (input: { name: string; directive: string; saving: number }) => {
      setCustomHelperStore((s) => createCustomHelperIn(s, input));
    },
    [],
  );

  const updateCustomHelperFn = useCallback(
    (id: string, input: { name: string; directive: string; saving: number }) => {
      setCustomHelperStore((s) => updateCustomHelperIn(s, id, input));
    },
    [],
  );

  const removeCustomHelperFn = useCallback((id: string) => {
    setCustomHelperStore((s) => removeCustomHelperIn(s, id));
  }, []);

  const toggleCustomHelperFn = useCallback((id: string) => {
    setCustomHelperStore((s) => toggleCustomHelperIn(s, id));
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
    enterApp,
    // 최근 대화 기록 (새 채팅을 누르면 이전 대화가 여기 저장된다)
    chatSessions: chatHistory.sessions,
    loadChatSession,
    deleteChatSession,
    toggleHelperOption,
    removeHelperOption,
    toggleCategoryVisibility,
    // 기본 도우미 내부 옵션 편집
    effectiveHelperCategories,
    addBuiltinHelperOption,
    removeBuiltinHelperOption,
    // 프롬프트 워크스페이스 확장
    deckStore,
    activeDecks,
    deckSavingPercent,
    toggleDeck,
    createDeck,
    removeDeck,
    snapDeck,
    toggleShareDeck,
    // 나만의 프롬프트 도우미
    customHelperStore,
    activeCustomHelpers,
    createCustomHelper,
    updateCustomHelper: updateCustomHelperFn,
    removeCustomHelper: removeCustomHelperFn,
    toggleCustomHelper: toggleCustomHelperFn,
  };
}

export type AquState = ReturnType<typeof useAquState>;
export type { AppView };
