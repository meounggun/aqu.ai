/** 기본 프롬프트 도우미(요약/번역/코드 등) 내부 옵션 커스터마이징.
 * 기본 카테고리 자체는 lib/water.ts의 HELPER_CATEGORIES에 고정돼 있지만,
 * 사용자가 각 카테고리 안에서 옵션을 추가하거나 기존 옵션을 빼는 것은 여기서 관리한다.
 * 백엔드가 없는 프로토타입이라 localStorage에 저장한다. */

import type { HelperCategory, HelperOption } from "@/lib/water";

export interface HelperOverrideStore {
  /** 카테고리 key -> 사용자가 추가한 옵션들 */
  added: Record<string, HelperOption[]>;
  /** 카테고리 key -> 사용자가 뺀 기본 옵션의 라벨들 */
  removed: Record<string, string[]>;
}

const KEY = "aqu-helper-overrides-v1";
const EMPTY: HelperOverrideStore = { added: {}, removed: {} };

export function loadHelperOverrides(): HelperOverrideStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as HelperOverrideStore) };
  } catch {
    /* 손상된 데이터는 초기화 */
  }
  return EMPTY;
}

export function saveHelperOverrides(store: HelperOverrideStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* 저장 공간 부족은 무시 — 화면에는 이미 반영됨 */
  }
}

export function addHelperOption(
  store: HelperOverrideStore,
  categoryKey: string,
  option: HelperOption,
): HelperOverrideStore {
  const next: HelperOverrideStore = {
    ...store,
    added: {
      ...store.added,
      [categoryKey]: [...(store.added[categoryKey] ?? []), option],
    },
  };
  saveHelperOverrides(next);
  return next;
}

/** 기본 옵션이면 숨김 처리(removed)하고, 내가 추가한 옵션이면 목록에서 완전히 뺀다 */
export function removeHelperOption(
  store: HelperOverrideStore,
  categoryKey: string,
  optionLabel: string,
  isBuiltIn: boolean,
): HelperOverrideStore {
  const next: HelperOverrideStore = { ...store };
  if (isBuiltIn) {
    next.removed = {
      ...store.removed,
      [categoryKey]: [...(store.removed[categoryKey] ?? []), optionLabel],
    };
  } else {
    next.added = {
      ...store.added,
      [categoryKey]: (store.added[categoryKey] ?? []).filter((o) => o.label !== optionLabel),
    };
  }
  saveHelperOverrides(next);
  return next;
}

/** 기본 카테고리 목록에 추가/제거 오버라이드를 적용해 실제로 화면·전송 로직에서 쓸 목록을 만든다 */
export function applyHelperOverrides(
  categories: HelperCategory[],
  store: HelperOverrideStore,
): HelperCategory[] {
  return categories.map((cat) => {
    const removedLabels = new Set(store.removed[cat.key] ?? []);
    const kept = cat.options.filter((o) => !removedLabels.has(o.label));
    const added = store.added[cat.key] ?? [];
    return { ...cat, options: [...kept, ...added] };
  });
}
