"use client";

/* 덱 마켓 (PRD §8) — 커스텀 덱 워크스페이스 + 공유 마켓
   + 나만의 프롬프트 도우미 편집 + 프롬프트 팁·링크 공유 (스크롤하면 아래에 나온다)

   레이아웃: 상단 행 — 왼쪽 컬럼(460px, 내 덱) / 오른쪽(마켓, 왼쪽 컬럼과 같은 높이로 길게)
             하단 행 — 스크롤해야 보이는 프롬프트 도우미 편집 + 프롬프트 팁·링크 공유
   여백 스케일은 프로필 화면과 동일하게 16px(카드 간) / 12px(보조) / 4~6px(촘촘) */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CARD_KIND_LABEL,
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  DECK_CATEGORIES,
  type Deck,
  type DeckCard,
  type DeckCardKind,
  type DeckCategory,
  type DeckStore,
  MARKET_DECKS,
} from "@/lib/deck-store";
import type { CustomHelper, CustomHelperStore } from "@/lib/custom-helper-store";
import { type HelperCategory, type HelperOption } from "@/lib/water";
import {
  type MarketTip,
  SEED_MARKET_TIPS,
  loadMarketTips,
  saveMarketTips,
  tipTimeAgo,
} from "@/lib/market-tip-store";

function Card({
  className = "",
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fade-up rounded-[14px] bg-[#242628] p-[20px] ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** 이모지 대신 쓰는 카테고리 색상 배지 — 덱이 어떤 용도인지 한눈에 구분되게 */
function CategoryBadge({ category, size = 20 }: { category: DeckCategory; size?: number }) {
  return (
    <span
      className="block shrink-0 rounded-[8px]"
      style={{ width: size, height: size, backgroundColor: `${CATEGORY_COLOR[category]}30` }}
    >
      <span
        className="block rounded-[8px]"
        style={{ width: "100%", height: "100%", backgroundColor: `${CATEGORY_COLOR[category]}` }}
      />
    </span>
  );
}

const KIND_ORDER: DeckCardKind[] = ["persona", "format", "constraint"];
const KIND_PLACEHOLDER: Record<DeckCardKind, string> = {
  persona: "예) 10년 차 UI 디자이너 관점으로 답해줘.",
  format: "예) 문제점 / 개선안 / 근거 3단 구조로 정리해줘.",
  constraint: "예) 300자 이내로, 수식어 없이 작성해줘.",
};

const HELPER_SAVING_PRESETS = [0.3, 0.5, 0.7];

export default function MarketView({
  deckStore,
  activeDeckIds,
  onToggleDeck,
  onCreateDeck,
  onRemoveDeck,
  onSnapDeck,
  onToggleShare,
  nudgeMyDecks = 0,
  customHelperStore,
  onToggleCustomHelper,
  onCreateCustomHelper,
  onUpdateCustomHelper,
  onRemoveCustomHelper,
  visibleCategories,
  onToggleCategory,
  allHelperCategories,
  onAddBuiltinOption,
  onToggleHelperOption,
}: {
  deckStore: DeckStore;
  activeDeckIds: string[];
  onToggleDeck: (id: string) => void;
  onCreateDeck: (input: {
    name: string;
    category: DeckCategory;
    description: string;
    cards: DeckCard[];
  }) => void;
  onRemoveDeck: (id: string) => void;
  onSnapDeck: (deck: Deck) => void;
  onToggleShare: (id: string) => void;
  /** 값이 바뀔 때마다 "내 덱" 카드를 한 번 흔든다 — 사이드바 설정 버튼으로 진입했을 때 사용 */
  nudgeMyDecks?: number;
  customHelperStore: CustomHelperStore;
  onToggleCustomHelper: (id: string) => void;
  onCreateCustomHelper: (input: { name: string; directive: string; saving: number }) => void;
  onUpdateCustomHelper: (
    id: string,
    input: { name: string; directive: string; saving: number },
  ) => void;
  onRemoveCustomHelper: (id: string) => void;
  /** 기존 요약/번역/코드 등 기본 도우미 — 채팅 바 노출 여부를 여기서도 함께 관리한다 */
  visibleCategories: Set<string>;
  onToggleCategory: (key: string) => void;
  /** 사용자 추가/on-off가 반영된 기본 도우미 전체 목록 — 카테고리 안의 옵션을 펼쳐 보여줄 때 사용 */
  allHelperCategories: HelperCategory[];
  onAddBuiltinOption: (categoryKey: string, option: HelperOption) => void;
  /** 옵션 하나를 껐다 켰다 — 목록에서 지우지 않는다 */
  onToggleHelperOption: (categoryKey: string, optionLabel: string) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DeckCategory>(DECK_CATEGORIES[0].key);
  const [description, setDescription] = useState("");
  const [texts, setTexts] = useState<Record<DeckCardKind, string>>({
    persona: "",
    format: "",
    constraint: "",
  });
  // 마켓에서 카테고리별로 검색 — "전체" 또는 특정 카테고리 하나
  const [marketFilter, setMarketFilter] = useState<DeckCategory | "all">("all");

  const [shaking, setShaking] = useState(false);
  const myDeckRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (nudgeMyDecks === 0) return;
    myDeckRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 520);
    return () => clearTimeout(t);
  }, [nudgeMyDecks]);

  // 덱 제거 시 바로 사라지지 않고 짧게 접히며 빠지는 애니메이션을 보여준 뒤 실제로 지운다
  const [removingDeckId, setRemovingDeckId] = useState<string | null>(null);
  const requestRemoveDeck = (id: string) => {
    setRemovingDeckId(id);
    setTimeout(() => {
      onRemoveDeck(id);
      setRemovingDeckId(null);
    }, 180);
  };

  const installedIds = new Set(deckStore.installed.map((d) => d.id));
  // 마켓에는 시드 덱과, 내가 공유 중인 덱이 함께 노출된다
  const sharedMine = deckStore.installed.filter((d) => d.author === "나" && d.shared);
  const marketAll: Deck[] = [...sharedMine, ...MARKET_DECKS];
  const marketList = useMemo(
    () => marketAll.filter((d) => marketFilter === "all" || d.category === marketFilter),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [marketFilter, deckStore.installed],
  );

  const cards: DeckCard[] = KIND_ORDER.filter((k) => texts[k].trim()).map((k) => ({
    kind: k,
    text: texts[k].trim(),
  }));
  const canSubmit = name.trim().length > 0 && cards.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onCreateDeck({ name: name.trim(), category, description: description.trim(), cards });
    setName("");
    setDescription("");
    setTexts({ persona: "", format: "", constraint: "" });
    setComposing(false);
  };

  /* ---------- 나만의 프롬프트 도우미 편집 ---------- */
  const [helperComposing, setHelperComposing] = useState(false);
  const [editingHelperId, setEditingHelperId] = useState<string | null>(null);
  const [helperName, setHelperName] = useState("");
  const [helperDirective, setHelperDirective] = useState("");
  const [helperSaving, setHelperSaving] = useState(HELPER_SAVING_PRESETS[0]);

  const resetHelperForm = () => {
    setHelperName("");
    setHelperDirective("");
    setHelperSaving(HELPER_SAVING_PRESETS[0]);
    setEditingHelperId(null);
    setHelperComposing(false);
  };

  const startEditHelper = (helper: CustomHelper) => {
    setEditingHelperId(helper.id);
    setHelperName(helper.name);
    setHelperDirective(helper.directive);
    setHelperSaving(helper.saving);
    setHelperComposing(true);
  };

  const canSubmitHelper = helperName.trim().length > 0 && helperDirective.trim().length > 0;

  const submitHelper = () => {
    if (!canSubmitHelper) return;
    const input = { name: helperName.trim(), directive: helperDirective.trim(), saving: helperSaving };
    if (editingHelperId) onUpdateCustomHelper(editingHelperId, input);
    else onCreateCustomHelper(input);
    resetHelperForm();
  };

  /* ---------- 기본 도우미(요약/번역/코드 등) 안의 옵션 보기 + 추가 / 켜고 끄기 ---------- */
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [optLabel, setOptLabel] = useState("");
  const [optDirective, setOptDirective] = useState("");
  const [optSaving, setOptSaving] = useState(HELPER_SAVING_PRESETS[0]);

  const resetOptionForm = () => {
    setOptLabel("");
    setOptDirective("");
    setOptSaving(HELPER_SAVING_PRESETS[0]);
  };

  const submitOption = (categoryKey: string) => {
    if (!optLabel.trim() || !optDirective.trim()) return;
    onAddBuiltinOption(categoryKey, {
      label: optLabel.trim(),
      directive: optDirective.trim(),
      saving: optSaving,
    });
    resetOptionForm();
  };

  /* ---------- 프롬프트 팁 & 링크 공유 ---------- */
  const [tips, setTips] = useState<MarketTip[]>([]);
  const [tipText, setTipText] = useState("");
  const [tipUrl, setTipUrl] = useState("");

  useEffect(() => {
    const mine = loadMarketTips();
    setTips(mine);
  }, []);

  const submitTip = () => {
    const trimmed = tipText.trim();
    if (!trimmed) return;
    const url = tipUrl.trim();
    const tip: MarketTip = {
      id: `tip-${Date.now()}`,
      author: "나",
      text: trimmed,
      url: url || undefined,
      createdAt: Date.now(),
    };
    const next = [tip, ...tips];
    setTips(next);
    saveMarketTips(next);
    setTipText("");
    setTipUrl("");
  };

  const tipFeed = [...tips, ...SEED_MARKET_TIPS];

  return (
    <div className="absolute left-[140px] top-[60px] flex h-[960px] w-[1640px] flex-col p-[24px]">
      <div className="fade-up shrink-0">
        <h2 className="text-[22px] font-semibold tracking-[-1px] text-white">덱 편집</h2>
        <p className="mt-[4px] text-[15px] tracking-[-0.65px] text-label">
          덱을 켜두면 반복 입력 없이 프롬프트가 유지됩니다
        </p>
      </div>

      {/* 스크롤하면 아래쪽에 프롬프트 도우미 편집 / 팁 공유가 나온다 */}
      <div className="chat-scroll mt-[16px] mr-[-21px] flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto pr-[21px]">
        {/* ---------- 상단 행: 왼쪽(내 덱) / 오른쪽(마켓, 왼쪽 컬럼 높이만큼 길게) ---------- */}
        <div className="grid shrink-0 grid-cols-[460px_1fr] items-stretch gap-[16px]">
          {/* 내 덱 — 설정 버튼으로 들어왔을 때 잠깐 흔들려 여기서 수정하면 된다는 걸 알려준다.
              흔들림은 카드를 감싸는 래퍼에 걸어, 카드 자체의 fade-up 진입 애니메이션과
              animation 속성이 겹쳐 재생 후 다시 떠오르는 것처럼 보이는 문제를 피한다 */}
          <div ref={myDeckRef} className={shaking ? "nudge-shake" : ""}>
            <Card className="flex h-full min-h-[460px] flex-col" delay={0}>
                <div className="flex shrink-0 items-center justify-between">
                  <p className="text-[17px] font-medium tracking-[-0.75px] text-white">
                    내 덱 <span className="text-label">({deckStore.installed.length})</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setComposing((v) => !v)}
                    className="cursor-pointer rounded-full border border-main px-[12px] py-[5px] text-[15px] font-semibold tracking-[-0.6px] text-main transition-colors hover:bg-main hover:text-white"
                  >
                    {composing ? "닫기" : "+ 덱 만들기"}
                  </button>
                </div>

                {composing && (
                  <div className="fade-up mt-[12px] shrink-0 rounded-[12px] bg-white/[0.04] p-[14px]">
                    {/* 이모지 대신 카테고리로 덱 성격을 표시 — 마켓에서 카테고리 검색과도 연결된다 */}
                    <div className="flex flex-wrap gap-[6px]">
                      {DECK_CATEGORIES.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setCategory(c.key)}
                          className={`flex cursor-pointer items-center gap-[6px] rounded-full border px-[10px] py-[5px] text-[14px] font-semibold tracking-[-0.55px] transition-colors ${
                            category === c.key
                              ? "border-transparent text-white"
                              : "border-stroke text-label hover:border-white/30 hover:text-white"
                          }`}
                          style={category === c.key ? { backgroundColor: c.color } : undefined}
                        >
                          <span
                            className="size-[7px] rounded-full"
                            style={{ backgroundColor: category === c.key ? "#fff" : c.color }}
                          />
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="덱 이름 (예: 내 기획서 덱)"
                      className="mt-[8px] w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[15px] tracking-[-0.65px] text-white placeholder:text-white/35 focus:outline-none"
                    />
                    <input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="한 줄 설명 (선택)"
                      className="mt-[8px] w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[15px] tracking-[-0.6px] text-white placeholder:text-white/35 focus:outline-none"
                    />
                    <div className="mt-[10px] flex flex-col gap-[8px]">
                      {KIND_ORDER.map((k) => (
                        <div key={k}>
                          <p className="mb-[4px] text-[14px] font-semibold tracking-[-0.55px] text-label">
                            {CARD_KIND_LABEL[k]}
                          </p>
                          <input
                            value={texts[k]}
                            onChange={(e) => setTexts((t) => ({ ...t, [k]: e.target.value }))}
                            placeholder={KIND_PLACEHOLDER[k]}
                            className="w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[15px] tracking-[-0.6px] text-white placeholder:text-white/30 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={!canSubmit}
                      className="mt-[12px] w-full cursor-pointer rounded-[10px] bg-main py-[9px] text-[15px] font-semibold tracking-[-0.65px] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      덱 만들기 {cards.length > 0 && `(카드 ${cards.length}장)`}
                    </button>
                  </div>
                )}

                <div className="chat-scroll mr-[-8px] mt-[12px] flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto pr-[12px]">
                  {deckStore.installed.length === 0 && !composing && (
                    <p className="py-[12px] text-[15px] leading-[1.6] tracking-[-0.65px] text-label">
                      아직 장착한 덱이 없어요.
                      <br />
                      오른쪽 마켓에서 검증된 덱을 가져오거나, 직접 만들어보세요.
                    </p>
                  )}
                  {deckStore.installed.map((deck, i) => {
                    const on = activeDeckIds.includes(deck.id);
                    const removing = removingDeckId === deck.id;
                    return (
                      <div
                        key={deck.id}
                        className={`fade-up rounded-[12px] border p-[12px] transition-all duration-200 ${
                          on ? "border-main bg-main/15" : "border-stroke bg-white/[0.02]"
                        } ${removing ? "-translate-x-[6px] scale-[0.97] opacity-0" : ""}`}
                        style={{ animationDuration: "0.25s", animationDelay: `${Math.min(i, 8) * 30}ms` }}
                      >
                        <div className="flex items-start gap-[10px]">
                          <CategoryBadge category={deck.category} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold tracking-[-0.65px] text-white">
                              {deck.name}
                            </p>
                            <p className="mt-[2px] text-[14px] tracking-[-0.55px] text-label">
                              {CATEGORY_LABEL[deck.category]} · by {deck.author} · -
                              {Math.round(deck.saving * 100)}% 절감
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onToggleDeck(deck.id)}
                            className={`flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-colors duration-200 ${
                              on ? "bg-main" : "bg-white/20"
                            }`}
                            aria-label={on ? "덱 끄기" : "덱 켜기"}
                          >
                            <span
                              className="size-[16px] rounded-full bg-white transition-transform duration-200"
                              style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
                            />
                          </button>
                        </div>

                        <div className="mt-[10px] flex flex-wrap gap-[4px]">
                          {deck.cards.map((c, i) => (
                            <span
                              key={i}
                              title={c.text}
                              className="max-w-[190px] truncate rounded-[6px] bg-white/[0.06] px-[8px] py-[4px] text-[13px] tracking-[-0.5px] text-white/70"
                            >
                              {CARD_KIND_LABEL[c.kind]} · {c.text}
                            </span>
                          ))}
                        </div>

                        <div className="mt-[10px] flex items-center gap-[8px]">
                          {deck.author === "나" && (
                            <button
                              type="button"
                              onClick={() => onToggleShare(deck.id)}
                              className={`cursor-pointer rounded-full px-[10px] py-[4px] text-[14px] font-semibold tracking-[-0.55px] transition-colors ${
                                deck.shared
                                  ? "bg-main/25 text-main"
                                  : "bg-white/[0.06] text-label hover:bg-white/[0.12]"
                              }`}
                            >
                              {deck.shared ? "마켓에 공유 중" : "마켓에 공유"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => requestRemoveDeck(deck.id)}
                            className="ml-auto cursor-pointer text-[14px] tracking-[-0.55px] text-label transition-colors hover:text-white"
                          >
                            제거
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
          </div>

          {/* 마켓 — 왼쪽 컬럼(내 덱) 전체 높이만큼 늘어난다 */}
          <Card className="flex flex-col" delay={240}>
            <div className="flex shrink-0 items-center justify-between">
              <div>
                <p className="text-[17px] font-medium tracking-[-0.75px] text-white">덱 공유하기</p>
                <p className="mt-[2px] text-[14px] tracking-[-0.55px] text-label">
                  가져간 유저가 절감에 성공하면 창작자에게 크레딧이 분배돼요
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposing((v) => !v)}
                aria-label="새 덱 만들기"
                title="새 덱 만들기"
                className={`flex size-[28px] shrink-0 cursor-pointer items-center justify-center rounded-full border text-[18px] font-semibold transition-colors ${
                  composing
                    ? "border-main bg-main text-white"
                    : "border-stroke text-label hover:border-main hover:text-white"
                }`}
              >
                +
              </button>
            </div>

            {/* 카테고리별 검색 */}
            <div className="chat-scroll-x -mx-[4px] mt-[10px] flex shrink-0 gap-[6px] overflow-x-auto px-[4px]">
              <button
                type="button"
                onClick={() => setMarketFilter("all")}
                className={`shrink-0 cursor-pointer rounded-full px-[11px] py-[5px] text-[15px] font-semibold tracking-[-0.6px] transition-colors ${
                  marketFilter === "all" ? "bg-main text-white" : "text-label hover:bg-white/10"
                }`}
              >
                전체
              </button>
              {DECK_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setMarketFilter(c.key)}
                  className={`flex shrink-0 cursor-pointer items-center gap-[5px] rounded-full px-[11px] py-[5px] text-[15px] font-semibold tracking-[-0.6px] transition-colors ${
                    marketFilter === c.key ? "text-white" : "text-label hover:bg-white/10"
                  }`}
                  style={marketFilter === c.key ? { backgroundColor: c.color } : undefined}
                >
                  <span className="size-[6px] rounded-full" style={{ backgroundColor: c.color }} />
                  {c.label}
                </button>
              ))}
            </div>

            <div className="chat-scroll mr-[-8px] mt-[12px] grid min-h-0 flex-1 grid-cols-2 content-start gap-[12px] overflow-y-auto pr-[12px]">
              {marketList.length === 0 && (
                <p className="col-span-2 py-[12px] text-[15px] tracking-[-0.65px] text-label">
                  이 카테고리에는 아직 덱이 없어요.
                </p>
              )}
              {marketList.map((deck) => {
                const owned = installedIds.has(deck.id);
                return (
                  <div
                    key={deck.id}
                    className="flex h-[212px] flex-col rounded-[14px] border border-stroke bg-white/[0.02] p-[18px]"
                  >
                    <CategoryBadge category={deck.category} size={32} />
                    <p className="mt-[14px] shrink-0 truncate text-[17px] font-semibold leading-[1.5] tracking-[-0.75px] text-white">
                      {deck.name}
                    </p>
                    <p className="mt-[6px] line-clamp-2 shrink-0 text-[15px] leading-[1.55] tracking-[-0.6px] text-white/60">
                      {deck.description || "설명이 없는 덱이에요."}
                    </p>

                    <div className="mt-auto flex shrink-0 items-center justify-end pt-[16px]">
                      <button
                        type="button"
                        onClick={() => onSnapDeck(deck)}
                        disabled={owned}
                        className="cursor-pointer rounded-full bg-main px-[14px] py-[6px] text-[15px] font-semibold tracking-[-0.6px] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-label"
                      >
                        {owned ? "보유 중" : "Snap"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 프롬프트 도우미 — 페이지 레벨 섹션 헤더. 아래 두 카드(기본 도우미 편집 / 팁 공유)를 함께 아우른다 */}
        <div className="fade-up mt-[4px] shrink-0">
          <h2 className="text-[22px] font-semibold tracking-[-1px] text-white">프롬프트 도우미</h2>
          <p className="mt-[4px] text-[15px] tracking-[-0.65px] text-label">
            동그라미를 눌러 기본 도우미를 편집하거나, +를 눌러 나만의 도우미를 만들어보세요
          </p>
        </div>

        {/* ---------- 스크롤하면 나오는 하단 행: 프롬프트 도우미 편집 / 프롬프트 팁·링크 공유 ---------- */}
        <div className="grid shrink-0 grid-cols-2 gap-[16px]">
          {/* 프롬프트 도우미 편집 — "내 덱"과 같은 방식으로 만들고, 켜고 끄고, 수정한다.
              내부 스크롤 없이 편집 패널이 한 번에 다 보이도록 높이를 내용에 맞춰 늘어나게 둔다 */}
          <Card className="flex flex-col" delay={0}>
            {helperComposing && (
              <div className="flex shrink-0 justify-end">
                <button
                  type="button"
                  onClick={resetHelperForm}
                  className="cursor-pointer rounded-full border border-main px-[12px] py-[5px] text-[15px] font-semibold tracking-[-0.6px] text-main transition-colors hover:bg-main hover:text-white"
                >
                  닫기
                </button>
              </div>
            )}

            {helperComposing && (
              <div className="fade-up mt-[10px] shrink-0 rounded-[12px] bg-white/[0.04] p-[12px]">
                <input
                  value={helperName}
                  onChange={(e) => setHelperName(e.target.value)}
                  placeholder="도우미 이름 (예: 회의록 정리)"
                  className="w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[15px] tracking-[-0.65px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <textarea
                  value={helperDirective}
                  onChange={(e) => setHelperDirective(e.target.value)}
                  placeholder="프롬프트에 이어붙일 지시문 (예: 발언자별로 정리하고 마지막에 액션 아이템을 표로 뽑아줘.)"
                  rows={2}
                  className="mt-[8px] w-full resize-none rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[15px] leading-[1.5] tracking-[-0.6px] text-white placeholder:text-white/30 focus:outline-none"
                />
                <div className="mt-[8px] flex items-center gap-[6px]">
                  <span className="text-[14px] tracking-[-0.55px] text-label">예상 절감율</span>
                  {HELPER_SAVING_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setHelperSaving(p)}
                      className={`cursor-pointer rounded-full px-[10px] py-[4px] text-[14px] font-semibold tracking-[-0.55px] transition-colors ${
                        helperSaving === p ? "bg-main text-white" : "bg-white/[0.06] text-label"
                      }`}
                    >
                      -{Math.round(p * 100)}%
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={submitHelper}
                  disabled={!canSubmitHelper}
                  className="mt-[10px] w-full cursor-pointer rounded-[10px] bg-main py-[9px] text-[15px] font-semibold tracking-[-0.65px] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {editingHelperId ? "수정 완료" : "도우미 만들기"}
                </button>
              </div>
            )}

            <div className="mt-[12px] flex flex-col gap-[10px]">
              <div className="chat-scroll-x -mx-[4px] flex shrink-0 gap-[10px] overflow-x-auto px-[4px]">
                {allHelperCategories.map((cat) => {
                  const selected = expandedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setExpandedCategory(selected ? null : cat.key);
                        resetOptionForm();
                      }}
                      className={`shrink-0 cursor-pointer rounded-full border px-[18px] py-[10px] text-[15px] font-semibold tracking-[-0.65px] transition-colors ${
                        selected
                          ? "border-main bg-main text-white"
                          : "border-stroke bg-white/[0.03] text-label hover:border-main/60 hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCategory(null);
                    if (helperComposing) resetHelperForm();
                    else setHelperComposing(true);
                  }}
                  aria-label="새 프롬프트 도우미 만들기"
                  title="새 프롬프트 도우미 만들기"
                  className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed px-[16px] py-[10px] text-[18px] font-semibold transition-colors ${
                    helperComposing
                      ? "border-main bg-main text-white"
                      : "border-stroke text-label hover:border-main hover:text-white"
                  }`}
                >
                  +
                </button>
              </div>

              {expandedCategory &&
                (() => {
                  const cat = allHelperCategories.find((c) => c.key === expandedCategory);
                  if (!cat) return null;
                  const on = visibleCategories.has(cat.key);
                  return (
                    <div
                      className="fade-up rounded-[14px] border border-stroke bg-white/[0.02] p-[18px]"
                      style={{ animationDuration: "0.2s" }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[20px] font-semibold tracking-[-0.9px] text-white">
                          {cat.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => onToggleCategory(cat.key)}
                          className={`flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-colors duration-200 ${
                            on ? "bg-main" : "bg-white/20"
                          }`}
                          aria-label={on ? "기본 도우미 끄기" : "기본 도우미 켜기"}
                        >
                          <span
                            className="size-[20px] rounded-full bg-white transition-transform duration-200"
                            style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
                          />
                        </button>
                      </div>

                      <div className="mt-[14px] flex flex-col gap-[10px]">
                        {cat.options.map((opt) => {
                          const optOn = opt.enabled !== false;
                          return (
                            <div
                              key={opt.label}
                              className={`rounded-[10px] bg-white/[0.04] px-[16px] py-[14px] transition-opacity duration-200 ${
                                optOn ? "" : "opacity-45"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-[10px]">
                                <p className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.7px] text-white">
                                  {opt.label}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => onToggleHelperOption(cat.key, opt.label)}
                                  aria-label={optOn ? "옵션 끄기" : "옵션 켜기"}
                                  title={optOn ? "옵션 끄기" : "옵션 켜기"}
                                  className={`flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-colors duration-200 ${
                                    optOn ? "bg-main" : "bg-white/20"
                                  }`}
                                >
                                  <span
                                    className="size-[16px] rounded-full bg-white transition-transform duration-200"
                                    style={{ transform: optOn ? "translateX(18px)" : "translateX(0)" }}
                                  />
                                </button>
                              </div>
                              <p className="mt-[6px] text-[15px] leading-[1.5] tracking-[-0.6px] text-white/60">
                                {opt.directive}
                              </p>
                            </div>
                          );
                        })}
                        {cat.options.length === 0 && (
                          <p className="text-[14px] tracking-[-0.55px] text-label">
                            아직 옵션이 없어요. 아래에서 새로 추가해보세요.
                          </p>
                        )}
                      </div>

                      {/* 이 카테고리에 옵션 추가 */}
                      <div className="mt-[14px] rounded-[10px] bg-white/[0.03] p-[14px]">
                        <p className="text-[15px] font-semibold tracking-[-0.65px] text-white">옵션 추가</p>
                        <input
                          value={optLabel}
                          onChange={(e) => setOptLabel(e.target.value)}
                          placeholder="옵션이름 (예: 개조식 요약)"
                          className="mt-[8px] w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[15px] tracking-[-0.6px] text-white placeholder:text-white/35 focus:outline-none"
                        />
                        <textarea
                          value={optDirective}
                          onChange={(e) => setOptDirective(e.target.value)}
                          placeholder="지시문 작성"
                          rows={2}
                          className="mt-[6px] w-full resize-none rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[14px] leading-[1.5] tracking-[-0.55px] text-white placeholder:text-white/30 focus:outline-none"
                        />
                        <div className="mt-[10px] flex justify-end">
                          <button
                            type="button"
                            onClick={() => submitOption(cat.key)}
                            disabled={!optLabel.trim() || !optDirective.trim()}
                            className="cursor-pointer rounded-full bg-main px-[18px] py-[8px] text-[15px] font-semibold tracking-[-0.6px] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35"
                          >
                            추가하기
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              <p className="mt-[6px] px-[2px] text-[14px] font-semibold tracking-[-0.55px] text-label">
                나만의 도우미
              </p>
              {customHelperStore.items.length === 0 && !helperComposing && (
                <p className="py-[4px] text-[15px] leading-[1.6] tracking-[-0.65px] text-label">
                  아직 만든 프롬프트 도우미가 없어요. 자주 쓰는 지시문을 도우미로 등록해보세요.
                </p>
              )}
              {customHelperStore.items.map((helper) => {
                const on = customHelperStore.activeIds.includes(helper.id);
                return (
                  <div
                    key={helper.id}
                    className={`rounded-[12px] border p-[12px] transition-colors ${
                      on ? "border-main bg-main/15" : "border-stroke bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start gap-[10px]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold tracking-[-0.65px] text-white">
                          {helper.name}
                        </p>
                        <p className="mt-[2px] truncate text-[14px] tracking-[-0.55px] text-label">
                          {helper.directive}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-main/20 px-[8px] py-[3px] text-[14px] font-semibold tracking-[-0.55px] text-main">
                        -{Math.round(helper.saving * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleCustomHelper(helper.id)}
                        className={`flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full px-[3px] transition-colors duration-200 ${
                          on ? "bg-main" : "bg-white/20"
                        }`}
                        aria-label={on ? "도우미 끄기" : "도우미 켜기"}
                      >
                        <span
                          className="size-[16px] rounded-full bg-white transition-transform duration-200"
                          style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
                        />
                      </button>
                    </div>
                    <div className="mt-[10px] flex items-center gap-[10px]">
                      <button
                        type="button"
                        onClick={() => startEditHelper(helper)}
                        className="cursor-pointer text-[14px] tracking-[-0.55px] text-label transition-colors hover:text-white"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveCustomHelper(helper.id)}
                        className="ml-auto cursor-pointer text-[14px] tracking-[-0.55px] text-label transition-colors hover:text-white"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 프롬프트 팁 & 링크 공유 — 사람들이 여기저기서 찾은 꿀팁이나 링크를 나누는 게시판.
              프롬프트 도우미 편집 카드와 마찬가지로 내부 스크롤 없이 내용에 맞춰 늘어난다 */}
          <Card className="flex flex-col" delay={60}>
            <p className="text-[17px] font-medium tracking-[-0.75px] text-white">
              프롬프트 팁 & 링크 공유
            </p>
            <p className="mt-[4px] text-[14px] tracking-[-0.55px] text-label">
              다른 곳에서 발견한 꿀팁이나 링크를 여기서 같이 나눠보세요
            </p>

            <div className="mt-[10px] flex shrink-0 gap-[8px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                <input
                  value={tipText}
                  onChange={(e) => setTipText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitTip()}
                  placeholder="나만의 프롬프트 팁을 공유해보세요..."
                  className="w-full rounded-[10px] bg-white/[0.05] px-[12px] py-[9px] text-[15px] tracking-[-0.65px] text-white placeholder:text-white/35 focus:outline-none"
                />
                <input
                  value={tipUrl}
                  onChange={(e) => setTipUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitTip()}
                  placeholder="관련 링크 (선택)"
                  className="w-full rounded-[10px] bg-white/[0.05] px-[12px] py-[8px] text-[15px] tracking-[-0.6px] text-white placeholder:text-white/30 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={submitTip}
                disabled={!tipText.trim()}
                className="shrink-0 cursor-pointer self-start rounded-full bg-main px-[16px] py-[9px] text-[15px] font-semibold tracking-[-0.65px] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
              >
                공유
              </button>
            </div>

            <div className="mt-[12px] flex flex-col gap-[8px]">
              {tipFeed.map((tip) => (
                <div key={tip.id} className="rounded-[10px] bg-white/[0.03] px-[12px] py-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold tracking-[-0.6px] text-white">
                      {tip.author}
                    </span>
                    <span className="text-[13px] tracking-[-0.5px] text-label">
                      {tipTimeAgo(tip.createdAt)}
                    </span>
                  </div>
                  <p className="mt-[4px] text-[15px] leading-[1.5] tracking-[-0.6px] text-white/80">
                    {tip.text}
                  </p>
                  {tip.url && (
                    <a
                      href={tip.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-[4px] flex items-center gap-[6px] text-[14px] tracking-[-0.55px] text-main hover:underline"
                    >
                      <span className="shrink-0">🔗</span>
                      <span className="truncate">{tip.url}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
