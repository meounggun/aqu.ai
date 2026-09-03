"use client";

/* 온보딩 — Figma 인포1~5 재현 (세로 스크롤 스냅).
   1. 물방울 인트로 → 2. AI USE WATER 순환도 → 3. HeadCircuit 질문
   → 4. MORE FAST, LESS ENERGY(BEFORE/AFTER) → 5. 함께하러 가기(CTA) */

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
} from "./onboarding-icons";

const SECTION_COUNT = 5;

/** 하단 Scroll 인디케이터 */
function ScrollHint({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="다음"
      className="absolute bottom-[24px] left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-[6px] opacity-[0.76] transition-opacity hover:opacity-100"
    >
      <span className="text-[18px] tracking-[-0.8px] text-label-2">Scroll</span>
      <span className="animate-bounce">
        <CaretDown />
      </span>
    </button>
  );
}

/** AI USE WATER 순환 다이어그램 — Figma 실측: 원 반지름 253px, 아이콘 5개 + 장식용 포인트 5개 */
function WaterCycle() {
  const R = 253;
  const C = 330;
  // Prompt(top) → Processing → Heat → Cooling → Disappear (시계방향, Figma 좌표 역산 각도)
  const nodes = [
    { key: "Prompt", angle: -89, icon: <PromptIcon /> },
    { key: "Processing", angle: -14, icon: <ChipIcon /> },
    { key: "Heat", angle: 50, icon: <ThermoIcon /> },
    { key: "Cooling", angle: 129, icon: <SnowflakeIcon /> },
    { key: "Disappear", angle: 197, icon: <EvaporateIcon /> },
  ];
  const pos = (deg: number, radius = R) => {
    const r = (deg * Math.PI) / 180;
    return { x: C + radius * Math.cos(r), y: C + radius * Math.sin(r) };
  };

  return (
    <div className="relative" style={{ width: 660, height: 660 }}>
      <svg width="660" height="660" viewBox="0 0 660 660" className="absolute inset-0">
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        {/* Figma 실측: 원 주변 작은 장식 삼각 포인트 5개(방향 화살표 아님) — 아이콘 사이 중간각, 원의 선 중앙에 위치 */}
        {nodes.map((n, i) => {
          const next = nodes[(i + 1) % nodes.length];
          let a2 = next.angle;
          if (a2 < n.angle) a2 += 360;
          const mid = (n.angle + a2) / 2;
          const p = pos(mid, R);
          return (
            <g key={n.key} transform={`translate(${p.x} ${p.y}) rotate(${mid})`}>
              <path d="M0 5 L-6 -4 L6 -4 Z" fill="rgba(255,255,255,0.45)" />
            </g>
          );
        })}
        {/* 순환의 흐름을 나타내는 빛나는 점 — 원을 따라 시계방향으로 계속 돈다 */}
        <g>
          <circle cx={C} cy={C - R} r="12" fill="#8ff3e6" opacity="0.25" />
          <circle cx={C} cy={C - R} r="5.5" fill="#c8faf2" />
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
          // 아이콘 박스 자체(라벨 제외)를 원 위의 좌표에 정확히 중앙 정렬 — 아이콘 중심이 원의 선을 통과한다
          <div
            key={n.key}
            className="absolute flex h-[112px] w-[130px] items-center justify-center"
            style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
          >
            {/* 배경 마스크 — 아이콘 뒤로 원이 비치지 않도록 */}
            <div className="absolute left-1/2 top-1/2 size-[128px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg blur-[10px]" />
            <div className="relative flex items-center justify-center">{n.icon}</div>
            <span className="absolute left-1/2 top-full mt-[10px] -translate-x-1/2 whitespace-nowrap text-[18px] tracking-[-0.8px] text-white">
              {n.key}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingView({ onFinish }: { onFinish: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({
      top: Math.min(index, SECTION_COUNT - 1) * 1080,
      behavior: "smooth",
    });
  };
  const nextFrom = (i: number) => () => goTo(i + 1);

  // 스크롤-스냅이 거의 다 정착했을 때(섹션이 화면 대부분을 채웠을 때) 리빌 애니메이션을 재생한다.
  // threshold를 낮게 잡으면 스크롤이 아직 진행 중일 때 애니메이션이 시작해버려 눈에 안 띄게 끝나버린다.
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

  const sectionClass =
    "relative flex h-[1080px] w-full snap-start flex-col items-center justify-center px-[60px] text-center";

  return (
    <div
      ref={scrollRef}
      className={`chat-scroll absolute left-[60px] top-0 h-[1080px] w-[1860px] snap-y snap-mandatory overflow-y-auto scroll-smooth ${
        ready ? "ob-ready" : ""
      }`}
    >
      {/* 1. 물방울 인트로 */}
      <section className={sectionClass}>
        <button
          type="button"
          onClick={nextFrom(0)}
          aria-label="시작하기"
          className="group relative flex cursor-pointer flex-col items-center ob-drop-enter"
        >
          <svg width="98" height="146" viewBox="0 0 98 146" className="relative drop-shadow-[0_0_24px_rgba(73,138,255,0.25)] transition-transform duration-300 group-hover:-translate-y-[6px]">
            <path
              d="M49 6 C49 6 93 82 93 96 A44 44 0 1 1 5 96 C5 82 49 6 49 6 Z"
              stroke="#ffffff"
              strokeWidth="5"
              className="fill-none transition-colors duration-300 group-hover:fill-[var(--main)]/50"
            />
            <text x="49" y="107" textAnchor="middle" className="fill-white font-semibold" style={{ fontSize: 40, fontFamily: "var(--font-inter)" }}>
              AI
            </text>
          </svg>
          <span className="mt-[6px] text-[18px] tracking-[-0.8px] text-label transition-colors group-hover:text-white">
            click here!
          </span>
        </button>
        <p className="ob-intro-text mt-[52px] text-[22px] tracking-[-1px] text-label-2">
          일상의 편리함이 되어준 인공지능은 보이지 않는 곳에서 수자원을 위협하고 있습니다.
        </p>
      </section>

      {/* 2. AI USE WATER */}
      <section className={sectionClass}>
        <h2 className="ob-reveal text-[50px] font-bold tracking-[-2.5px]">
          <span className="text-main">AI</span> <span className="text-white/90">USE WATER</span>
        </h2>
        <p className="ob-reveal ob-d1 mt-[28px] max-w-[1267px] text-[22px] leading-[1.5] tracking-[-1px] text-white/90">
          AI 작동에 필수적인 인프라 AI데이터센터는 장비의 부식을 막기 위해, 인간의 생존에 필요한
          한정된 자원인 담수만을 고집하며 우리가 마실 물까지 빼앗고 있습니다.
          <br />
          챗봇이 답변을 생성할 때마다 데이터 센터에 막대한 양의 열이 발생하고 열을 식히기 위해 많은
          양의 담수가 냉각수로 사용되어 증발됩니다.
        </p>
        <div className="ob-reveal ob-d2 mt-[36px]">
          <WaterCycle />
        </div>
        <ScrollHint onClick={nextFrom(1)} />
      </section>

      {/* 3. HeadCircuit 질문 — 글로우는 아이콘 박스 자체의 box-shadow라 항상 정확히 중앙에 맞는다 */}
      <section className={sectionClass}>
        <div className="ob-glow flex size-[240px] items-center justify-center rounded-full">
          <div className="ob-breathe relative">
            <HeadCircuitIcon />
          </div>
        </div>
        <p className="ob-reveal ob-d1 mt-[24px] text-[22px] leading-[1.6] tracking-[-1px] text-white/90">
          늘어나는 AI 기술과 인프라, 빠른 발전 속에서 우리는{" "}
          <span className="text-[#75a7ff]">어떤 태도</span>로 마주해야 할까요?
          <br />
          우리가 AI에게 던지는 <span className="text-[#75a7ff]">무심한 질문들</span>은 결국{" "}
          <span className="text-[#75a7ff]">환경의 시간을 가속하는 행위</span>와 같지 않을까요?
        </p>
        <ScrollHint onClick={nextFrom(2)} />
      </section>

      {/* 4. MORE FAST, LESS ENERGY */}
      <section className={sectionClass}>
        <h2 className="ob-reveal text-[50px] font-bold tracking-[-2.5px] text-main">MORE FAST, LESS ENERGY</h2>
        <p className="ob-reveal ob-d1 mt-[20px] max-w-[1180px] text-[22px] leading-[1.5] tracking-[-0.9px] text-white/90">
          우리는 인공지능의 빠른 발전 뒤에 존재하는 막대한 양의 담수 소모를 정제된 대화 방식을 통해
          제어합니다. 정제된 대화방식은 우리가 더 빠르게 목적을 얻을 수 있게 만들고, 적은 소모 방식을
          통해 자연의 시간 가속을 늦춰 메말라가는 담수를 보호하고자 합니다.
        </p>

        <div className="mt-[52px] flex items-start gap-[70px]">
          {/* BEFORE — 말풍선이 위에서 아래로 순서대로 내려오며 채워지는 애니메이션.
              바깥 컨테이너는 ob-reveal로 감싸지 않는다 — 감싸면 컨테이너 자체의 페이드와
              말풍선 개별 애니메이션이 겹쳐 opacity가 곱연산되어 잘 안 보이게 된다 */}
          <div className="flex flex-col items-center gap-[14px]">
            <span className="text-[18px] tracking-[-0.8px] text-label-2">BEFORE</span>
            <div className="relative h-[483px] w-[330px] overflow-hidden rounded-[16px] bg-stroke">
              <Bubble tone="blue" left={161.58} top={17.45} w={155.5} h={44} order={0} />
              <Bubble tone="gray" left={15.93} top={69.79} w={182} h={104} order={1} />
              <Bubble tone="blue" left={119.1} top={188.13} w={198} h={20} order={2} />
              <Bubble tone="gray" left={15.93} top={216.95} w={160} h={79} order={3} />
              <Bubble tone="blue" left={161.58} top={310.26} w={155.5} h={42} order={4} />
              <Bubble tone="gray" left={16.69} top={361.08} w={222} h={97} order={5} />
            </div>
          </div>
          {/* AFTER */}
          <div className="flex flex-col items-center gap-[14px]">
            <span className="text-[18px] tracking-[-0.8px] text-label-2">AFTER</span>
            <div className="relative h-[221px] w-[330px] overflow-hidden rounded-[16px] bg-stroke">
              <Bubble tone="blue" left={160.06} top={15.17} w={155.5} h={64.5} order={0} />
              <Bubble tone="gray" left={14.41} top={89.51} w={182} h={104} order={1} />
            </div>
          </div>
        </div>
        <ScrollHint onClick={nextFrom(3)} />
      </section>

      {/* 5. CTA */}
      <section className={sectionClass}>
        <p className="ob-reveal max-w-[1259px] text-[32px] font-normal leading-[1.7] tracking-[-1.6px] text-white/90">
          당신의 작은 움직임 하나가 모여 고갈되어 가는 수자원의 시간을 늦추는 위대한 힘이 됩니다.
          <br />
          함께 디지털 연산을 제어하는 한 걸음에 동참해 주세요.
        </p>
        <div className="ob-reveal ob-d1 mt-[52px]">
          <button
            type="button"
            onClick={onFinish}
            className="ob-cta flex h-[54px] cursor-pointer items-center gap-[12px] rounded-full border-2 border-white pl-[24px] pr-[26px] text-[22px] font-medium tracking-[-1px] text-white transition-colors hover:bg-white hover:text-bg"
          >
            함께하러 가기
            <ArrowRightIcon className="size-[24px]" />
          </button>
        </div>
      </section>
    </div>
  );
}

/* MORE FAST 슬라이드 말풍선 — Figma 절대좌표 그대로 재현. 꼬리 없는 둥근 사각형.
   order로 순서를 매겨 위→아래로 하나씩 내려오며 채워지는 애니메이션을 준다 */
function Bubble({
  tone,
  left,
  top,
  w,
  h,
  order,
}: {
  tone: "blue" | "gray";
  left: number;
  top: number;
  w: number;
  h: number;
  order: number;
}) {
  return (
    <div
      className={`ob-bubble absolute rounded-[13px] ${tone === "blue" ? "bg-main" : "bg-label"}`}
      style={{ left, top, width: w, height: h, animationDelay: `${order * 110}ms` }}
    />
  );
}
