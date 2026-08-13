/** 나만의 프롬프트 도우미 — "내 덱"처럼 사용자가 직접 만들고 켜고 끄는 프롬프트 템플릿.
 * 백엔드가 없는 프로토타입이라 localStorage에 저장한다. */

export interface CustomHelper {
  id: string;
  name: string;
  directive: string; // 프롬프트에 이어붙는 지시문
  saving: number; // 예상 절감율 0~1
  createdAt: number;
}

export interface CustomHelperStore {
  items: CustomHelper[];
  activeIds: string[];
}

const KEY = "aqu-custom-helpers-v1";
const EMPTY: CustomHelperStore = { items: [], activeIds: [] };

export function loadCustomHelperStore(): CustomHelperStore {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as CustomHelperStore) };
  } catch {
    /* 손상된 데이터는 초기화 */
  }
  return EMPTY;
}

export function saveCustomHelperStore(store: CustomHelperStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* 저장 공간 부족은 무시 — 화면에는 이미 반영됨 */
  }
}

export function createCustomHelper(
  store: CustomHelperStore,
  input: { name: string; directive: string; saving: number },
): CustomHelperStore {
  const helper: CustomHelper = {
    id: `helper-${Date.now()}`,
    name: input.name,
    directive: input.directive,
    saving: input.saving,
    createdAt: Date.now(),
  };
  // 새로 만들면 바로 켜진 상태로 시작 — 만들자마자 적용되는지 바로 눈에 보여야 한다
  const next: CustomHelperStore = {
    items: [helper, ...store.items],
    activeIds: [helper.id, ...store.activeIds],
  };
  saveCustomHelperStore(next);
  return next;
}

export function updateCustomHelper(
  store: CustomHelperStore,
  id: string,
  input: { name: string; directive: string; saving: number },
): CustomHelperStore {
  const next: CustomHelperStore = {
    ...store,
    items: store.items.map((h) => (h.id === id ? { ...h, ...input } : h)),
  };
  saveCustomHelperStore(next);
  return next;
}

export function removeCustomHelper(store: CustomHelperStore, id: string): CustomHelperStore {
  const next: CustomHelperStore = {
    items: store.items.filter((h) => h.id !== id),
    activeIds: store.activeIds.filter((a) => a !== id),
  };
  saveCustomHelperStore(next);
  return next;
}

export function toggleCustomHelper(store: CustomHelperStore, id: string): CustomHelperStore {
  const on = store.activeIds.includes(id);
  const next: CustomHelperStore = {
    ...store,
    activeIds: on ? store.activeIds.filter((a) => a !== id) : [...store.activeIds, id],
  };
  saveCustomHelperStore(next);
  return next;
}
