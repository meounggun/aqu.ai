"use client";

import { useEffect, useState } from "react";

/** 뷰포트 너비가 768px 미만이면 모바일(폰) 전용 레이아웃을 사용한다. */
export function useIsMobile(breakpoint = 768) {
  // SSR/최초 렌더에서 레이아웃이 튀지 않도록 null → 결정되기 전엔 아무것도 안 그림
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);
  return isMobile;
}
