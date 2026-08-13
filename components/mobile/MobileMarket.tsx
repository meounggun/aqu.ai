"use client";

/* 모바일 덱 마켓 (PRD §8) — 데스크탑 MarketView를 세로 스택으로 재구성.
   내 덱(장착/공유/제거) → 새 덱 만들기 → 마켓에서 스냅해오기 순으로 쌓인다. */

import { useEffect, useState } from "react";
import {
  CARD_KIND_LABEL,
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
import {
  type MarketTip,
  SEED_MARKET_TIPS,
  loadMarketTips,
  saveMarketTips,
  tipTimeAgo,
} from "@/lib/market-tip-store";
import { HELPER_CATEGORIES, type HelperCategory, type HelperOption } from "@/lib/water";

const HELPER_SAVING_PRESETS = [0.3, 0.5, 0.7];

function Card({ children }: { children: React.ReactNode }) {
  return <div className="fade-up rounded-[14px] bg-[#242628] p-[16px]">{children}</div>;
}

/** 이모지 대신 쓰는 카테고리 색상 배지 */
function CategoryBadge({ category, size = 18 }: { category: DeckCategory; size?: number }) {
  const color = DECK_CATEGORIES.find((c) => c.key === category)?.color ?? "#9aa0a6";
  return (
    <span
      className="shrink-0 rounded-[7px]"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

const KIND_ORDER: DeckCardKind[] = ["persona", "format", "constraint"];
const KIND_PLACEHOLDER: Record<DeckCardKind, string> = {
  persona: "예) 10년 차 UI 디자이너 관점으로 답해줘.",
  format: "예) 문제점 / 개선안 / 근거로 정리해줘.",
  constraint: "예) 300자 이내로 작성해줘.",
};

export default function MobileMarket({
  deckStore,
  activeDeckIds,
  onToggleDeck,
  onCreateDeck,
  onRemoveDeck,
  onSnapDeck,
  onToggleShare,
  customHelperStore,
  onToggleCustomHelper,
  onCreateCustomHelper,
  onUpdateCustomHelper,
  onRemoveCustomHelper,
  visibleCategories,
  onToggleCategory,
  allHelperCategories,
  onAddBuiltinOption,
  onRemoveBuiltinOption,
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
  allHelperCategories: HelperCategory[];
  onAddBuiltinOption: (categoryKey: string, option: HelperOption) => void;
  onRemoveBuiltinOption: (categoryKey: string, optionLabel: string, isBuiltIn: boolean) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DeckCategory>(DECK_CATEGORIES[0].key);
  const [texts, setTexts] = useState<Record<DeckCardKind, string>>({
    persona: "",
    format: "",
    constraint: "",
  });
  const [marketFilter, setMarketFilter] = useState<DeckCategory | "all">("all");

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
  const sharedMine = deckStore.installed.filter((d) => d.author === "나" && d.shared);
  const marketAll: Deck[] = [...sharedMine, ...MARKET_DECKS];
  const marketList = marketAll.filter(
    (d) => marketFilter === "all" || d.category === marketFilter,
  );

  const cards: DeckCard[] = KIND_ORDER.filter((k) => texts[k].trim()).map((k) => ({
    kind: k,
    text: texts[k].trim(),
  }));
  const canSubmit = name.trim().length > 0 && cards.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onCreateDeck({ name: name.trim(), category, description: "", cards });
    setName("");
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

  /* ---------- 기본 도우미(요약/번역/코드 등) 안의 옵션 보기 + 추가/삭제 ---------- */
  const builtInLabels = (categoryKey: string) =>
    new Set(HELPER_CATEGORIES.find((c) => c.key === categoryKey)?.options.map((o) => o.label) ?? []);

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
    setTips(loadMarketTips());
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
    <div className="flex flex-col gap-[14px] px-[16px] pb-[28px] pt-[16px]">
      <div>
        <h2 className="text-[18px] font-semibold tracking-[-0.9px] text-white">프롬프트 도우미 편집</h2>
        <p className="mt-[4px] text-[12px] tracking-[-0.6px] text-label">
          아낄수록 강해지는 나만의 프롬프트 워크스페이스
        </p>
      </div>

      {/* 내 덱 */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-medium tracking-[-0.75px] text-white">
            내 덱 <span className="text-label">({deckStore.installed.length})</span>
          </p>
          <button
            type="button"
            onClick={() => setComposing((v) => !v)}
            className="rounded-full border border-main px-[12px] py-[5px] text-[12px] font-semibold tracking-[-0.6px] text-main"
          >
            {composing ? "닫기" : "+ 만들기"}
          </button>
        </div>

        {composing && (
          <div className="fade-up mt-[12px] rounded-[12px] bg-white/[0.04] p-[12px]">
            {/* 이모지 대신 카테고리로 덱 성격을 표시 — 마켓에서 카테고리 검색과도 연결된다 */}
            <div className="flex flex-wrap gap-[6px]">
              {DECK_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`flex items-center gap-[5px] rounded-full border px-[9px] py-[5px] text-[11px] font-semibold tracking-[-0.55px] transition-colors ${
                    category === c.key ? "border-transparent text-white" : "border-stroke text-label"
                  }`}
                  style={category === c.key ? { backgroundColor: c.color } : undefined}
                >
                  <span
                    className="size-[6px] rounded-full"
                    style={{ backgroundColor: category === c.key ? "#fff" : c.color }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="덱 이름"
              className="mt-[8px] w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[9px] text-[13px] tracking-[-0.65px] text-white placeholder:text-white/35 focus:outline-none"
            />
            {KIND_ORDER.map((k) => (
              <div key={k} className="mt-[8px]">
                <p className="mb-[4px] text-[11px] font-semibold tracking-[-0.55px] text-label">
                  {CARD_KIND_LABEL[k]}
                </p>
                <input
                  value={texts[k]}
                  onChange={(e) => setTexts((t) => ({ ...t, [k]: e.target.value }))}
                  placeholder={KIND_PLACEHOLDER[k]}
                  className="w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[12px] tracking-[-0.6px] text-white placeholder:text-white/30 focus:outline-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="mt-[12px] w-full rounded-[10px] bg-main py-[10px] text-[13px] font-semibold tracking-[-0.65px] text-white transition-opacity disabled:opacity-35"
            >
              덱 만들기 {cards.length > 0 && `(카드 ${cards.length}장)`}
            </button>
          </div>
        )}

        <div className="mt-[12px] flex flex-col gap-[8px]">
          {deckStore.installed.length === 0 && !composing && (
            <p className="py-[8px] text-[12px] leading-[1.6] tracking-[-0.6px] text-label">
              아직 장착한 덱이 없어요. 아래 마켓에서 가져오거나 직접 만들어보세요.
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
                    <p className="truncate text-[13px] font-semibold tracking-[-0.65px] text-white">
                      {deck.name}
                    </p>
                    <p className="mt-[2px] text-[11px] tracking-[-0.55px] text-label">
                      {CATEGORY_LABEL[deck.category]} · by {deck.author} · -
                      {Math.round(deck.saving * 100)}%
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleDeck(deck.id)}
                    aria-label={on ? "덱 끄기" : "덱 켜기"}
                    className={`flex h-[22px] w-[40px] shrink-0 items-center rounded-full px-[3px] transition-colors duration-200 ${
                      on ? "bg-main" : "bg-white/20"
                    }`}
                  >
                    <span
                      className="size-[16px] rounded-full bg-white transition-transform duration-200"
                      style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
                    />
                  </button>
                </div>
                <div className="mt-[8px] flex flex-col gap-[4px]">
                  {deck.cards.map((c, i) => (
                    <span
                      key={i}
                      className="truncate rounded-[6px] bg-white/[0.06] px-[8px] py-[4px] text-[10px] tracking-[-0.5px] text-white/70"
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
                      className={`rounded-full px-[10px] py-[4px] text-[11px] font-semibold tracking-[-0.55px] ${
                        deck.shared ? "bg-main/25 text-main" : "bg-white/[0.06] text-label"
                      }`}
                    >
                      {deck.shared ? "마켓에 공유 중" : "마켓에 공유"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => requestRemoveDeck(deck.id)}
                    className="ml-auto text-[11px] tracking-[-0.55px] text-label"
                  >
                    제거
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 마켓 */}
      <Card>
        <p className="text-[15px] font-medium tracking-[-0.75px] text-white">검증된 덱 가져오기</p>
        <p className="mt-[4px] text-[11px] leading-[1.5] tracking-[-0.55px] text-label">
          가져간 유저가 절감에 성공하면 창작자에게 크레딧이 분배돼요
        </p>

        {/* 카테고리별 검색 */}
        <div className="chat-scroll-x -mx-[4px] mt-[10px] flex gap-[6px] overflow-x-auto px-[4px]">
          <button
            type="button"
            onClick={() => setMarketFilter("all")}
            className={`shrink-0 rounded-full px-[10px] py-[5px] text-[11px] font-semibold tracking-[-0.55px] transition-colors ${
              marketFilter === "all" ? "bg-main text-white" : "text-label"
            }`}
          >
            전체
          </button>
          {DECK_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setMarketFilter(c.key)}
              className={`flex shrink-0 items-center gap-[5px] rounded-full px-[10px] py-[5px] text-[11px] font-semibold tracking-[-0.55px] transition-colors ${
                marketFilter === c.key ? "text-white" : "text-label"
              }`}
              style={marketFilter === c.key ? { backgroundColor: c.color } : undefined}
            >
              <span className="size-[5px] rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-[12px] flex flex-col gap-[10px]">
          {marketList.length === 0 && (
            <p className="py-[8px] text-[12px] tracking-[-0.6px] text-label">
              이 카테고리에는 아직 덱이 없어요.
            </p>
          )}
          {marketList.map((deck) => {
            const owned = installedIds.has(deck.id);
            const snapCount = deck.snaps + (deckStore.marketSnaps[deck.id] ?? 0);
            return (
              <div key={deck.id} className="rounded-[12px] border border-stroke bg-white/[0.02] p-[12px]">
                <div className="flex items-start gap-[10px]">
                  <CategoryBadge category={deck.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold tracking-[-0.65px] text-white">
                      {deck.name}
                    </p>
                    <p className="mt-[2px] text-[11px] tracking-[-0.55px] text-label">
                      {CATEGORY_LABEL[deck.category]} · by {deck.author} · 스냅{" "}
                      {snapCount.toLocaleString()}
                    </p>
                  </div>
                </div>
                {deck.description && (
                  <p className="mt-[8px] text-[11px] leading-[1.55] tracking-[-0.55px] text-white/60">
                    {deck.description}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onSnapDeck(deck)}
                  disabled={owned}
                  className="mt-[10px] w-full rounded-[10px] bg-main py-[9px] text-[12px] font-semibold tracking-[-0.6px] text-white transition-opacity disabled:bg-white/[0.08] disabled:text-label"
                >
                  {owned ? "보유 중" : "Snap 해오기"}
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 프롬프트 도우미 편집 — "내 덱"과 같은 방식으로 만들고, 켜고 끄고, 수정한다 */}
      <Card>
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-medium tracking-[-0.75px] text-white">
            프롬프트 도우미 편집
          </p>
          {helperComposing && (
            <button
              type="button"
              onClick={resetHelperForm}
              className="rounded-full border border-main px-[12px] py-[5px] text-[12px] font-semibold tracking-[-0.6px] text-main"
            >
              닫기
            </button>
          )}
        </div>
        <p className="mt-[4px] text-[11px] tracking-[-0.55px] text-label">
          동그라미를 눌러 기본 도우미를 편집하거나, +를 눌러 나만의 도우미를 만들어보세요
        </p>

        {helperComposing && (
          <div className="fade-up mt-[10px] rounded-[12px] bg-white/[0.04] p-[12px]">
            <input
              value={helperName}
              onChange={(e) => setHelperName(e.target.value)}
              placeholder="도우미 이름 (예: 회의록 정리)"
              className="w-full rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[13px] tracking-[-0.65px] text-white placeholder:text-white/35 focus:outline-none"
            />
            <textarea
              value={helperDirective}
              onChange={(e) => setHelperDirective(e.target.value)}
              placeholder="프롬프트에 이어붙일 지시문"
              rows={2}
              className="mt-[8px] w-full resize-none rounded-[8px] bg-white/[0.06] px-[10px] py-[8px] text-[12px] leading-[1.5] tracking-[-0.6px] text-white placeholder:text-white/30 focus:outline-none"
            />
            <div className="mt-[8px] flex items-center gap-[6px]">
              <span className="text-[11px] tracking-[-0.55px] text-label">예상 절감율</span>
              {HELPER_SAVING_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setHelperSaving(p)}
                  className={`rounded-full px-[10px] py-[4px] text-[11px] font-semibold tracking-[-0.55px] transition-colors ${
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
              className="mt-[10px] w-full rounded-[10px] bg-main py-[9px] text-[13px] font-semibold tracking-[-0.65px] text-white transition-opacity disabled:opacity-35"
            >
              {editingHelperId ? "수정 완료" : "도우미 만들기"}
            </button>
          </div>
        )}

        <div className="mt-[12px] flex flex-col gap-[8px]">
          {/* 기존 요약/번역/코드 등 기본 도우미 — 동그라미를 눌러야 편집 패널이 나타난다 */}
          <p className="px-[2px] text-[11px] font-semibold tracking-[-0.55px] text-label">
            기본 도우미 · 눌러서 편집
          </p>
          <div className="chat-scroll-x -mx-[4px] flex gap-[8px] overflow-x-auto px-[4px]">
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
                  title={cat.label}
                  className={`relative flex h-[32px] w-[44px] shrink-0 items-center justify-center rounded-[14px] border text-[11px] font-semibold tracking-[-0.55px] transition-colors ${
                    selected
                      ? "border-main bg-main text-white"
                      : "border-stroke bg-white/[0.03] text-label"
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
              className={`flex h-[32px] w-[44px] shrink-0 items-center justify-center rounded-[14px] border border-dashed text-[18px] font-semibold transition-colors ${
                helperComposing ? "border-main bg-main text-white" : "border-stroke text-label"
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
              const builtIns = builtInLabels(cat.key);
              return (
                <div
                  className="fade-up rounded-[12px] border border-stroke bg-white/[0.02] p-[12px]"
                  style={{ animationDuration: "0.2s" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold tracking-[-0.65px] text-white">
                      {cat.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => onToggleCategory(cat.key)}
                      aria-label={on ? "기본 도우미 끄기" : "기본 도우미 켜기"}
                      className={`flex h-[22px] w-[40px] shrink-0 items-center rounded-full px-[3px] transition-colors duration-200 ${
                        on ? "bg-main" : "bg-white/20"
                      }`}
                    >
                      <span
                        className="size-[16px] rounded-full bg-white transition-transform duration-200"
                        style={{ transform: on ? "translateX(18px)" : "translateX(0)" }}
                      />
                    </button>
                  </div>

                  <div className="mt-[10px] flex flex-col gap-[6px]">
                    {cat.options.map((opt) => {
                      const isBuiltIn = builtIns.has(opt.label);
                      return (
                        <div
                          key={opt.label}
                          className="flex items-start justify-between gap-[8px] rounded-[8px] bg-white/[0.04] px-[10px] py-[8px]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-[6px]">
                              <span className="text-[12px] font-semibold tracking-[-0.6px] text-white">
                                {opt.label}
                              </span>
                              <span className="text-[10px] font-semibold tracking-[-0.5px] text-main">
                                -{Math.round(opt.saving * 100)}%
                              </span>
                              {!isBuiltIn && (
                                <span className="rounded-full bg-main/20 px-[6px] py-[1px] text-[9px] font-semibold tracking-[-0.45px] text-main">
                                  내가 추가함
                                </span>
                              )}
                            </div>
                            <p className="mt-[3px] text-[11px] leading-[1.5] tracking-[-0.55px] text-white/60">
                              {opt.directive}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveBuiltinOption(cat.key, opt.label, isBuiltIn)}
                            className="shrink-0 text-[11px] tracking-[-0.55px] text-label"
                          >
                            제거
                          </button>
                        </div>
                      );
                    })}
                    {cat.options.length === 0 && (
                      <p className="text-[11px] tracking-[-0.55px] text-label">
                        옵션이 모두 제거됐어요. 아래에서 새로 추가해보세요.
                      </p>
                    )}
                  </div>

                  <div className="mt-[10px] rounded-[8px] bg-white/[0.03] p-[10px]">
                    <input
                      value={optLabel}
                      onChange={(e) => setOptLabel(e.target.value)}
                      placeholder="옵션 이름 (예: 개조식 요약)"
                      className="w-full rounded-[7px] bg-white/[0.06] px-[9px] py-[7px] text-[12px] tracking-[-0.6px] text-white placeholder:text-white/35 focus:outline-none"
                    />
                    <textarea
                      value={optDirective}
                      onChange={(e) => setOptDirective(e.target.value)}
                      placeholder="프롬프트에 이어붙일 지시문"
                      rows={2}
                      className="mt-[6px] w-full resize-none rounded-[7px] bg-white/[0.06] px-[9px] py-[7px] text-[11px] leading-[1.5] tracking-[-0.55px] text-white placeholder:text-white/30 focus:outline-none"
                    />
                    <div className="mt-[6px] flex flex-wrap items-center gap-[6px]">
                      <span className="text-[10px] tracking-[-0.5px] text-label">절감율</span>
                      {HELPER_SAVING_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setOptSaving(p)}
                          className={`rounded-full px-[8px] py-[3px] text-[10px] font-semibold tracking-[-0.5px] ${
                            optSaving === p ? "bg-main text-white" : "bg-white/[0.06] text-label"
                          }`}
                        >
                          -{Math.round(p * 100)}%
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => submitOption(cat.key)}
                        disabled={!optLabel.trim() || !optDirective.trim()}
                        className="ml-auto rounded-full bg-main px-[12px] py-[5px] text-[11px] font-semibold tracking-[-0.55px] text-white disabled:opacity-35"
                      >
                        옵션 추가
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          <p className="mt-[6px] px-[2px] text-[11px] font-semibold tracking-[-0.55px] text-label">
            나만의 도우미
          </p>
          {customHelperStore.items.length === 0 && !helperComposing && (
            <p className="py-[4px] text-[12px] leading-[1.6] tracking-[-0.6px] text-label">
              아직 만든 프롬프트 도우미가 없어요. 자주 쓰는 지시문을 도우미로 등록해보세요.
            </p>
          )}
          {customHelperStore.items.map((helper) => {
            const on = customHelperStore.activeIds.includes(helper.id);
            return (
              <div
                key={helper.id}
                className={`rounded-[12px] border p-[12px] ${
                  on ? "border-main bg-main/15" : "border-stroke bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-[10px]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold tracking-[-0.65px] text-white">
                      {helper.name}
                    </p>
                    <p className="mt-[2px] truncate text-[11px] tracking-[-0.55px] text-label">
                      {helper.directive}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-main/20 px-[8px] py-[3px] text-[11px] font-semibold tracking-[-0.55px] text-main">
                    -{Math.round(helper.saving * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleCustomHelper(helper.id)}
                    aria-label={on ? "도우미 끄기" : "도우미 켜기"}
                    className={`flex h-[22px] w-[40px] shrink-0 items-center rounded-full px-[3px] transition-colors duration-200 ${
                      on ? "bg-main" : "bg-white/20"
                    }`}
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
                    className="text-[11px] tracking-[-0.55px] text-label"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveCustomHelper(helper.id)}
                    className="ml-auto text-[11px] tracking-[-0.55px] text-label"
                  >
                    제거
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 프롬프트 팁 & 링크 공유 — 사람들이 여기저기서 찾은 꿀팁이나 링크를 나누는 게시판 */}
      <Card>
        <p className="text-[15px] font-medium tracking-[-0.75px] text-white">
          프롬프트 팁 & 링크 공유
        </p>
        <p className="mt-[4px] text-[11px] tracking-[-0.55px] text-label">
          다른 곳에서 발견한 꿀팁이나 링크를 여기서 같이 나눠보세요
        </p>

        <div className="mt-[10px] flex flex-col gap-[6px]">
          <input
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTip()}
            placeholder="나만의 프롬프트 팁을 공유해보세요..."
            className="w-full rounded-[10px] bg-white/[0.05] px-[12px] py-[9px] text-[13px] tracking-[-0.65px] text-white placeholder:text-white/35 focus:outline-none"
          />
          <input
            value={tipUrl}
            onChange={(e) => setTipUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitTip()}
            placeholder="관련 링크 (선택)"
            className="w-full rounded-[10px] bg-white/[0.05] px-[12px] py-[8px] text-[12px] tracking-[-0.6px] text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={submitTip}
            disabled={!tipText.trim()}
            className="w-full rounded-full bg-main px-[16px] py-[9px] text-[13px] font-semibold tracking-[-0.65px] text-white transition-opacity disabled:opacity-40"
          >
            공유
          </button>
        </div>

        <div className="mt-[12px] flex flex-col gap-[8px]">
          {tipFeed.map((tip) => (
            <div key={tip.id} className="rounded-[10px] bg-white/[0.03] px-[12px] py-[9px]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold tracking-[-0.6px] text-white">
                  💡 {tip.author}
                </span>
                <span className="text-[10px] tracking-[-0.5px] text-label">
                  {tipTimeAgo(tip.createdAt)}
                </span>
              </div>
              <p className="mt-[4px] text-[12px] leading-[1.5] tracking-[-0.6px] text-white/80">
                {tip.text}
              </p>
              {tip.url && (
                <a
                  href={tip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[4px] block truncate text-[11px] tracking-[-0.55px] text-main hover:underline"
                >
                  🔗 {tip.url}
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
