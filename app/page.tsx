"use client";

/* 진입점 — 공유 상태를 만들고, 뷰포트에 따라 데스크탑/모바일 레이아웃을 고른다. */

import { useAquState } from "@/lib/useAquState";
import { useIsMobile } from "@/lib/useIsMobile";
import DesktopApp from "@/components/DesktopApp";
import MobileApp from "@/components/mobile/MobileApp";

export default function Home() {
  const app = useAquState();
  const isMobile = useIsMobile();

  // 모바일 여부가 결정되기 전(SSR/최초 페인트)엔 레이아웃 튐 방지를 위해 빈 배경만
  if (isMobile === null) return <main className="min-h-[100dvh] bg-bg" />;

  return isMobile ? <MobileApp app={app} /> : <DesktopApp app={app} />;
}
