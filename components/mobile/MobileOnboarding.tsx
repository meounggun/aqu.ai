"use client";

/* 모바일 온보딩 — 데스크탑 5단계를 세로 스크롤 스냅으로 재구성(폰 비율에 맞춘 크기/간격).
   소개("우리에 대하여") 화면에서도 재사용된다. */

import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CaretDown,
  ChipIcon,
  EvaporateIcon,
  HeadCircuitIcon,
  PromptIcon,
  SnowflakeIcon,
  ThermoIcon,
} from "@/components/onboarding-icons";

const SECTION_COUNT = 5;

function ScrollHint({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="다음"
      className="absolute bottom-[20px] left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-[4px] opacity-80"
    >
      <span className="text-[15px] tracking-[-0.6px] text-label-2">Scroll</span>
      <span className="animate-bounce">
        <CaretDown className="size-[20px]" />
      </span>
    </button>
  );
}

/** 모바일용 소형 순환 다이어그램 — 데스크탑 WaterCycle을 폰 폭에 맞춰 축소 배치 */
function MiniWaterCycle() {
  const R = 118;
  const C = 150;
  const nodes = [
    { key: "Prompt", angle: -90, icon: <PromptIcon /> },
    { key: "Processing", angle: -18, icon: <ChipIcon /> },
    { key: "Heat", angle: 54, icon: <ThermoIcon /> },
    { key: "Cooling", angle: 126, icon: <SnowflakeIcon /> },
    { key: "Disappear", angle: 198, icon: <EvaporateIcon /> },
  ];
  const pos = (deg: number, radius = R) => {
    const r = (deg * Math.PI) / 180;
    return { x: C + radius * Math.cos(r), y: C + radius * Math.sin(r) };
  };
  return (
    <div className="relative" style={{ width: 300, height: 300 }}>
      <svg width="300" height="300" viewBox="0 0 300 300" className="absolute inset-0">
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length];
          let a2 = next.angle;
          if (a2 < n.angle) a2 += 360;
          const mid = (n.angle + a2) / 2;
          const p = pos(mid, R);
          return (
            <g key={n.key} transform={`translate(${p.x} ${p.y}) rotate(${mid})`}>
              <path d="M0 4 L-5 -3 L5 -3 Z" fill="rgba(255,255,255,0.45)" />
            </g>
          );
        })}
        {/* 순환 흐름을 나타내는 빛나는 점 */}
        <g>
          <circle cx={C} cy={C - R} r="9" fill="#8ff3e6" opacity="0.25" />
          <circle cx={C} cy={C - R} r="4" fill="#c8faf2" />
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from={`0 ${C} ${C}`}
            to={`360 ${C} ${C}`}
            dur="9s"
            repeatCount="indefinite"
          />
        </g>
      </svg>
      {nodes.map((n) => {
        const p = pos(n.angle);
        return (
          <div
            key={n.key}
            className="absolute"
            style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
          >
            <div className="absolute left-1/2 top-1/2 size-[62px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg blur-[8px]" />
            {/* 아이콘 원본 크기가 제각각이라(46~112px) scale로만 축소하면 레이아웃 박스는 그대로 남아
                라벨 위치가 아이콘과 겹친다 — 고정 크기 박스를 기준으로 라벨을 아이콘 바로 아래 붙인다 */}
            <div className="relative flex h-[60px] w-[60px] items-center justify-center">
              <div className="scale-[0.5]">{n.icon}</div>
              <span className="absolute left-1/2 top-full mt-[4px] -translate-x-1/2 whitespace-nowrap text-[13px] tracking-[-0.5px] text-white">
                {n.key}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MobileOnboarding({
  onFinish,
  showBack = false,
}: {
  onFinish: () => void;
  showBack?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const goTo = (i: number) =>
    scrollRef.current?.scrollTo({ top: Math.min(i, SECTION_COUNT - 1) * scrollRef.current.clientHeight, behavior: "smooth" });
  const nextFrom = (i: number) => () => goTo(i + 1);

  // 스크롤-스냅이 거의 다 정착했을 때 리빌 애니메이션을 재생 — 너무 낮으면 스크롤 중에 시작해 눈에 안 띈다
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    setReady(true);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.setAttribute("data-inview", "true");
          else e.target.removeAttribute("data-inview");
        });
      },
      { root, threshold: 0.92 },
    );
    root.querySelectorAll("section").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const section =
    "relative flex min-h-[100dvh] w-full snap-start flex-col items-center justify-center px-[28px] text-center";

  return (
    <div
      ref={scrollRef}
      className={`chat-scroll app-enter h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto scroll-smooth bg-bg ${
        ready ? "ob-ready" : ""
      }`}
    >
      {showBack && (
        <button
          type="button"
          onClick={onFinish}
          aria-label="닫기"
          className="fixed left-[16px] top-[16px] z-30 flex size-[38px] items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm active:bg-white/20"
        >
          <CaretDown className="size-[20px] rotate-90" />
        </button>
      )}
      {/* 1. 물방울 인트로 */}
      <section className={section}>
        <button
          type="button"
          onClick={nextFrom(0)}
          aria-label="시작하기"
          className="group relative flex cursor-pointer flex-col items-center ob-drop-enter"
        >
          <svg width="78" height="116" viewBox="0 0 98 146" className="relative drop-shadow-[0_0_20px_rgba(73,138,255,0.25)]">
            <path
              d="M49 6 C49 6 93 82 93 96 A44 44 0 1 1 5 96 C5 82 49 6 49 6 Z"
              stroke="#ffffff"
              strokeWidth="5"
              className="fill-none"
            />
            <text x="49" y="107" textAnchor="middle" className="fill-white font-semibold" style={{ fontSize: 40 }}>
              AI
            </text>
          </svg>
          <span className="mt-[6px] text-[16px] tracking-[-0.7px] text-label">click here!</span>
        </button>
        <p className="ob-intro-text mt-[40px] text-[18px] leading-[1.6] tracking-[-0.8px] text-label-2">
          일상의 편리함이 되어준 인공지능은 보이지 않는 곳에서 수자원을 위협하고 있습니다.
        </p>
      </section>

      {/* 2. AI USE WATER */}
      <section className={section}>
        <h2 className="ob-reveal text-[30px] font-bold tracking-[-1.5px]">
          <span className="text-main">AI</span> <span className="text-white/90">USE WATER</span>
        </h2>
        <p className="ob-reveal ob-d1 mt-[16px] text-[16px] leading-[1.6] tracking-[-0.7px] text-white/90">
          AI데이터센터는 장비 부식을 막기 위해 한정된 담수만 고집하며, 챗봇이 답변할 때마다 막대한 열을
          식히기 위해 많은 담수를 냉각수로 증발시킵니다.
        </p>
        <div className="ob-reveal ob-d2 mt-[28px]">
          <MiniWaterCycle />
        </div>
        <ScrollHint onClick={nextFrom(1)} />
      </section>

      {/* 3. HeadCircuit 질문 — 글로우는 아이콘 박스 자체의 box-shadow라 항상 정확히 중앙에 맞는다 */}
      <section className={section}>
        <div className="ob-glow flex size-[240px] scale-[0.75] items-center justify-center rounded-full">
          <div className="ob-breathe relative">
            <HeadCircuitIcon />
          </div>
        </div>
        <p className="ob-reveal ob-d1 mt-[16px] text-[18px] leading-[1.7] tracking-[-0.8px] text-white/90">
          빠른 발전 속에서 우리는 <span className="text-[#75a7ff]">어떤 태도</span>로 마주해야 할까요?
          <br />
          우리가 던지는 <span className="text-[#75a7ff]">무심한 질문들</span>은 결국{" "}
          <span className="text-[#75a7ff]">환경의 시간을 가속하는 행위</span>와 같지 않을까요?
        </p>
        <ScrollHint onClick={nextFrom(2)} />
      </section>

      {/* 4. MORE FAST, LESS ENERGY */}
      <section className={section}>
        <h2 className="ob-reveal text-[26px] font-bold leading-[1.2] tracking-[-1.3px] text-main">
          MORE FAST,
          <br />
          LESS ENERGY
        </h2>
        <p className="ob-reveal ob-d1 mt-[16px] text-[16px] leading-[1.6] tracking-[-0.7px] text-white/90">
          정제된 대화 방식은 더 빠르게 목적을 얻게 하고, 적은 소모로 자연의 시간 가속을 늦춰 메말라가는
          담수를 보호합니다.
        </p>
        {/* 바깥 컨테이너는 ob-reveal로 감싸지 않는다 — 감싸면 컨테이너 페이드와 말풍선 개별
            애니메이션의 opacity가 곱연산되어 잘 안 보이게 된다 */}
        <div className="mt-[32px] flex items-start justify-center gap-[26px]">
          {/* BEFORE */}
          <div className="flex flex-col items-center gap-[10px]">
            <span className="text-[15px] tracking-[-0.6px] text-label-2">BEFORE</span>
            <div className="flex h-[200px] w-[128px] flex-col gap-[8px] overflow-hidden rounded-[12px] bg-stroke p-[12px]">
              <span className="ob-bubble h-[16px] w-[62px] self-end rounded-[6px] bg-main" style={{ animationDelay: "0ms" }} />
              <span className="ob-bubble h-[40px] w-[80px] rounded-[6px] bg-label" style={{ animationDelay: "110ms" }} />
              <span className="ob-bubble h-[9px] w-[78px] self-end rounded-[6px] bg-main" style={{ animationDelay: "220ms" }} />
              <span className="ob-bubble h-[30px] w-[66px] rounded-[6px] bg-label" style={{ animationDelay: "330ms" }} />
              <span className="ob-bubble h-[16px] w-[62px] self-end rounded-[6px] bg-main" style={{ animationDelay: "440ms" }} />
              <span className="ob-bubble h-[36px] w-[88px] rounded-[6px] bg-label" style={{ animationDelay: "550ms" }} />
            </div>
          </div>
          {/* AFTER */}
          <div className="flex flex-col items-center gap-[10px]">
            <span className="text-[15px] tracking-[-0.6px] text-label-2">AFTER</span>
            <div className="flex h-[110px] w-[128px] flex-col gap-[10px] overflow-hidden rounded-[12px] bg-stroke p-[12px]">
              <span className="ob-bubble h-[26px] w-[62px] self-end rounded-[6px] bg-main" style={{ animationDelay: "0ms" }} />
              <span className="ob-bubble h-[42px] w-[80px] rounded-[6px] bg-label" style={{ animationDelay: "110ms" }} />
            </div>
          </div>
        </div>
        <ScrollHint onClick={nextFrom(3)} />
      </section>

      {/* 5. CTA */}
      <section className={section}>
        <p className="ob-reveal text-[22px] font-normal leading-[1.7] tracking-[-1px] text-white/90">
          당신의 작은 움직임 하나가 고갈되어 가는 수자원의 시간을 늦추는 위대한 힘이 됩니다.
          <br />
          함께 디지털 연산을 제어하는 한 걸음에 동참해 주세요.
        </p>
        <div className="ob-reveal ob-d1 mt-[36px]">
          <button
            type="button"
            onClick={onFinish}
            className="ob-cta flex h-[50px] cursor-pointer items-center gap-[10px] rounded-full border-2 border-white pl-[22px] pr-[24px] text-[19px] font-medium tracking-[-0.85px] text-white transition-colors active:bg-white active:text-bg"
          >
            함께하러 가기
            <ArrowRightIcon className="size-[22px]" />
          </button>
        </div>
      </section>
    </div>
  );
}
