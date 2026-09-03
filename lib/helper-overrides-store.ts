/** 기본 프롬프트 도우미(요약/번역/코드 등) 내부 옵션 커스터마이징.
 * 기본 카테고리 자체는 lib/water.ts의 HELPER_CATEGORIES에 고정돼 있지만,
 * 사용자가 각 카테고리 안에서 옵션을 추가하거나 끄고 켜는 것은 여기서 관리한다.
 * 옵션을 끄는 건 삭제가 아니라 숨김(비활성) 처리라서 목록엔 계속 남고 다시 켤 수 있다.
 * 백엔드가 없는 프로토타입이라 localStorage에 저장한다. */

import type { HelperCategory, HelperOption } from "@/lib/water";

export interface HelperOverrideStore {
  /** 카테고리 key -> 사용자가 추가한 옵션들 */
  added: Record<string, HelperOption[]>;
  /** 카테고리 key -> 지금 꺼져 있는 옵션 라벨들 (기본 옵션·내가 추가한 옵션 모두 포함) */
  disabled: Record<string, string[]>;
}

const KEY = "aqu-helper-overrides-v1";
const EMPTY: HelperOverrideStore = { added: {}, disabled: {} };

export function loadHelperOverrides(): HelperOverrideStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<HelperOverrideStore> & { removed?: Record<string, string[]> };
    // 예전 버전(옵션을 아예 지우던 방식)에 저장된 데이터가 있으면 disabled로 옮겨온다
    return {
      added: parsed.added ?? {},
      disabled: parsed.disabled ?? parsed.removed ?? {},
    };
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

/** 카테고리 안의 옵션 하나를 껐다 켰다 — 목록에서 지우지 않고 활성 여부만 뒤집는다 */
export function toggleHelperOption(
  store: HelperOverrideStore,
  categoryKey: string,
  optionLabel: string,
): HelperOverrideStore {
  const current = store.disabled[categoryKey] ?? [];
  const isOff = current.includes(optionLabel);
  const next: HelperOverrideStore = {
    ...store,
    disabled: {
      ...store.disabled,
      [categoryKey]: isOff ? current.filter((l) => l !== optionLabel) : [...current, optionLabel],
    },
  };
  saveHelperOverrides(next);
  return next;
}

/** 기본 카테고리 목록에 추가 옵션·on/off 상태를 적용해 실제로 화면·전송 로직에서 쓸 목록을 만든다.
 * 꺼진 옵션도 enabled:false로 목록에 그대로 남는다 — 편집 화면에서 다시 켤 수 있게 하기 위함 */
export function applyHelperOverrides(
  categories: HelperCategory[],
  store: HelperOverrideStore,
): HelperCategory[] {
  return categories.map((cat) => {
    const disabledLabels = new Set(store.disabled[cat.key] ?? []);
    const withState = (o: HelperOption): HelperOption => ({ ...o, enabled: !disabledLabels.has(o.label) });
    const added = store.added[cat.key] ?? [];
    return { ...cat, options: [...cat.options.map(withState), ...added.map(withState)] };
  });
}
