"use client";

/* 프롬프트 도우미 바 — Figma 789:611~622
   여러 카테고리의 옵션을 동시에 중첩 선택할 수 있고(카테고리당 1개),
   각 선택은 입력창 위의 태그에서 개별적으로 자유롭게 제거할 수 있다. */
/* eslint-disable @next/next/no-img-element */

import { HELPER_CATEGORIES, type HelperCategory, type HelperOption } from "@/lib/water";

export interface SelectedHelper {
  category: HelperCategory;
  option: HelperOption;
}

export default function PromptHelper({
  openKey,
  selected,
  onToggle,
  onSelectOption,
  visibleCategories,
}: {
  openKey: string | null;
  selected: SelectedHelper[];
  onToggle: (key: string | null) => void;
  onSelectOption: (category: HelperCategory, option: HelperOption) => void;
  visibleCategories: Set<string>;
}) {
  const categories = HELPER_CATEGORIES.filter((c) => visibleCategories.has(c.key));

  return (
    <div className="absolute left-[172px] top-[838px] flex h-[47px] w-[560px] items-center gap-[21px]">
      <div className="flex items-center gap-[8px]">
        <img src="/assets/helper-bar-icon.svg" alt="" className="w-[14px] opacity-90" />
        <span className="whitespace-nowrap text-[16px] tracking-[-0.8px] text-white/90">프롬프트 도우미</span>
      </div>

      <div className="flex items-center gap-[13px] pl-[10px]">
        {categories.length === 0 && (
          <span className="whitespace-nowrap text-[13px] text-label">
            사이드바에서 도우미 항목을 추가해보세요
          </span>
        )}
        {categories.map((cat) => {
          const isOpen = openKey === cat.key;
          const activeSel = selected.find((s) => s.category.key === cat.key) ?? null;
          const active = isOpen || !!activeSel;
          return (
            <div key={cat.key} className="relative">
              <button
                type="button"
                onClick={() => onToggle(isOpen ? null : cat.key)}
                style={{ width: cat.chipWidth }}
                className={`h-[30px] cursor-pointer rounded-[10px] border text-[13px] font-semibold tracking-[-0.65px] text-white transition-colors ${
                  active
                    ? "border-main bg-main"
                    : "border-stroke bg-transparent hover:border-main hover:bg-main"
                }`}
              >
                {cat.label}
              </button>

              {/* 세부 옵션 — 칩 위로 펼침 (Figma 프롬프트 요약/번역/톤/코드/검토) */}
              {isOpen && (
                <div
                  className="fade-up absolute bottom-[36px] left-0 z-30 w-[128px] rounded-[10px] bg-main py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                  style={{ animationDuration: "0.2s" }}
                >
                  {cat.options.map((opt) => {
                    const optSelected = activeSel?.option.label === opt.label;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => onSelectOption(cat, opt)}
                        className={`flex w-full cursor-pointer items-center justify-between px-[12px] py-[8px] text-left text-[13px] tracking-[-0.65px] text-white transition-colors hover:bg-white/15 ${
                          optSelected ? "bg-white/20 font-semibold" : ""
                        }`}
                      >
                        <span className="whitespace-nowrap">{opt.label}</span>
                        <span className="ml-[8px] shrink-0 text-[11px] font-semibold text-white/75">
                          -{Math.round(opt.saving * 100)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
