"use client";

/* 진입점 — 사이트에 들어올 때 인트로 영상을 한 번 보여준 뒤, 공유 상태를 만들고
   뷰포트에 따라 데스크탑/모바일 레이아웃을 고른다. */

import { useState } from "react";
import { useAquState } from "@/lib/useAquState";
import { useIsMobile } from "@/lib/useIsMobile";
import DesktopApp from "@/components/DesktopApp";
import MobileApp from "@/components/mobile/MobileApp";
import IntroVideo from "@/components/IntroVideo";

export default function Home() {
  const app = useAquState();
  const isMobile = useIsMobile();
  const [introDone, setIntroDone] = useState(false);

  // 모바일 여부가 결정되기 전(SSR/최초 페인트)엔 레이아웃 튐 방지를 위해 빈 배경만
  if (isMobile === null) return <main className="min-h-[100dvh] bg-bg" />;

  return (
    <>
      {!introDone && <IntroVideo onFinish={() => setIntroDone(true)} />}
      {isMobile ? <MobileApp app={app} /> : <DesktopApp app={app} />}
    </>
  );
}
