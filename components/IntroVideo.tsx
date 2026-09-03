"use client";

/* 사이트 진입 인트로 — 접속할 때 한 번 전체화면으로 재생되고, 끝나면(또는 건너뛰면)
   부드럽게 페이드아웃되면서 실제 앱(랜딩)으로 넘어간다.
   자동재생 정책 때문에 muted가 필수이고, 재생이 막히거나 에러가 나도 화면이
   멈춰있지 않도록 일정 시간 뒤 자동으로 건너뛴다. */

import { useEffect, useRef, useState } from "react";

export default function IntroVideo({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLeaving(true);
    setTimeout(onFinish, 420);
  };

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 600);
    // 자동재생이 막히거나 영상 로드가 오래 걸려도 화면이 멈춰있지 않도록 안전장치
    const failSafeTimer = setTimeout(finish, 9000);
    return () => {
      clearTimeout(skipTimer);
      clearTimeout(failSafeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-bg transition-opacity duration-[420ms] ease-out ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src="/assets/intro/intro.mp4"
        autoPlay
        muted
        playsInline
        onEnded={finish}
        onError={finish}
        className="size-full object-contain"
      />
      <button
        type="button"
        onClick={finish}
        aria-label="인트로 건너뛰기"
        className={`absolute bottom-[28px] right-[28px] cursor-pointer rounded-full border border-white/25 bg-black/30 px-[16px] py-[8px] text-[14px] tracking-[-0.6px] text-white/85 backdrop-blur-sm transition-opacity duration-300 hover:border-white/50 hover:text-white ${
          showSkip ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        건너뛰기
      </button>
    </div>
  );
}
