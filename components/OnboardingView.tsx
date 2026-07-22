"use client";

/* 온보딩 — Figma 인포1~5 재현 (세로 스크롤 스냅).
   1. 물방울 인트로 → 2. AI USE WATER 순환도 → 3. HeadCircuit 질문
   → 4. MORE FAST, LESS ENERGY(BEFORE/AFTER) → 5. 함께하러 가기(CTA) */

import { useRef } from "react";
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
      <span className="text-[16px] tracking-[-0.8px] text-label-2">Scroll</span>
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
              <path d="M0 -7 L-6 6 L6 6 Z" fill="rgba(255,255,255,0.45)" />
            </g>
          );
        })}
      </svg>
      {nodes.map((n) => {
        const p = pos(n.angle);
        return (
          <div
            key={n.key}
            className="absolute flex flex-col items-center gap-[10px]"
            style={{ left: p.x, top: p.y, transform: "translate(-50%, -50%)" }}
          >
            <div className="relative flex h-[112px] w-[130px] items-center justify-center">
              {/* 배경 마스크 — 아이콘 뒤로 원이 비치지 않도록 */}
              <div className="absolute left-1/2 top-1/2 size-[128px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg blur-[10px]" />
              <div className="relative flex items-center justify-center">{n.icon}</div>
            </div>
            <span className="text-[16px] tracking-[-0.8px] text-white">{n.key}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingView({ onFinish }: { onFinish: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({
      top: Math.min(index, SECTION_COUNT - 1) * 1080,
      behavior: "smooth",
    });
  };
  const nextFrom = (i: number) => () => goTo(i + 1);

  const sectionClass =
    "relative flex h-[1080px] w-full snap-start flex-col items-center justify-center px-[60px] text-center";

  return (
    <div
      ref={scrollRef}
      className="chat-scroll absolute left-[60px] top-0 h-[1080px] w-[1860px] snap-y snap-mandatory overflow-y-auto scroll-smooth"
    >
      {/* 1. 물방울 인트로 */}
      <section className={sectionClass}>
        <button
          type="button"
          onClick={nextFrom(0)}
          aria-label="시작하기"
          className="group flex cursor-pointer flex-col items-center"
        >
          <svg width="98" height="146" viewBox="0 0 98 146" className="drop-shadow-[0_0_24px_rgba(73,138,255,0.25)] transition-transform duration-300 group-hover:-translate-y-[6px]">
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
          <span className="mt-[6px] text-[16px] tracking-[-0.8px] text-label transition-colors group-hover:text-white">
            click here!
          </span>
        </button>
        <p className="mt-[52px] text-[20px] tracking-[-1px] text-label-2">
          일상의 편리함이 되어준 인공지능은 보이지 않는 곳에서 수자원을 위협하고 있습니다.
        </p>
      </section>

      {/* 2. AI USE WATER */}
      <section className={sectionClass}>
        <h2 className="text-[50px] font-bold tracking-[-2.5px]">
          <span className="text-main">AI</span> <span className="text-white/90">USE WATER</span>
        </h2>
        <p className="mt-[28px] max-w-[1267px] text-[20px] leading-[1.5] tracking-[-1px] text-white/90">
          AI 작동에 필수적인 인프라 AI데이터센터는 장비의 부식을 막기 위해, 인간의 생존에 필요한
          한정된 자원인 담수만을 고집하며 우리가 마실 물까지 빼앗고 있습니다. 챗봇이 답변을 생성할
          때마다 데이터 센터에 막대한 양의 열이 발생하고 열을 식히기 위해 많은 양의 담수가 냉각수로
          사용되어 증발됩니다.
        </p>
        <div className="mt-[36px]">
          <WaterCycle />
        </div>
        <ScrollHint onClick={nextFrom(1)} />
      </section>

      {/* 3. HeadCircuit 질문 */}
      <section className={sectionClass}>
        <HeadCircuitIcon />
        <p className="mt-[77px] text-[20px] leading-[1.6] tracking-[-1px] text-white/90">
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
        <h2 className="text-[50px] font-bold tracking-[-2.5px] text-main">MORE FAST, LESS ENERGY</h2>
        <p className="mt-[20px] max-w-[1180px] text-[20px] leading-[1.5] tracking-[-0.9px] text-white/90">
          우리는 인공지능의 빠른 발전 뒤에 존재하는 막대한 양의 담수 소모를 정제된 대화 방식을 통해
          제어합니다. 정제된 대화방식은 우리가 더 빠르게 목적을 얻을 수 있게 만들고, 적은 소모 방식을
          통해 자연의 시간 가속을 늦춰 메말라가는 담수를 보호하고자 합니다.
        </p>

        <div className="mt-[52px] flex items-start gap-[70px]">
          {/* BEFORE */}
          <div className="flex flex-col items-center gap-[14px]">
            <span className="text-[16px] tracking-[-0.8px] text-label-2">BEFORE</span>
            <div className="relative h-[483px] w-[330px] rounded-[16px] bg-stroke">
              <Bubble tone="blue" left={161.58} top={17.45} w={155.5} h={44} />
              <Bubble tone="gray" left={15.93} top={69.79} w={182} h={104} />
              <Tail left={12.14} top={154.75} />
              <Bubble tone="blue" left={119.1} top={188.13} w={198} h={20} />
              <Bubble tone="gray" left={15.93} top={216.95} w={160} h={79} />
              <Tail left={12.14} top={278.4} />
              <Bubble tone="blue" left={161.58} top={310.26} w={155.5} h={42} />
              <Bubble tone="gray" left={16.69} top={361.08} w={222} h={97} />
              <Tail left={12.14} top={440.74} />
            </div>
          </div>
          {/* AFTER */}
          <div className="flex flex-col items-center gap-[14px]">
            <span className="text-[16px] tracking-[-0.8px] text-label-2">AFTER</span>
            <div className="relative h-[221px] w-[330px] rounded-[16px] bg-stroke">
              <Bubble tone="blue" left={160.06} top={15.17} w={155.5} h={64.5} />
              <Bubble tone="gray" left={14.41} top={89.51} w={182} h={104} />
              <Tail left={10} top={174.68} />
            </div>
          </div>
        </div>
        <ScrollHint onClick={nextFrom(3)} />
      </section>

      {/* 5. CTA */}
      <section className={sectionClass}>
        <p className="max-w-[1259px] text-[32px] font-medium leading-[1.7] tracking-[-1.6px] text-white/90">
          당신의 작은 움직임 하나가 모여 고갈되어 가는 수자원의 시간을 늦추는 위대한 힘이 됩니다.
          <br />
          함께 디지털 연산을 제어하는 한 걸음에 동참해 주세요.
        </p>
        <button
          type="button"
          onClick={onFinish}
          className="mt-[52px] flex h-[69px] cursor-pointer items-center gap-[16px] rounded-[19px] border-[2.7px] border-white pl-[29px] pr-[30px] text-[29px] font-medium tracking-[-1.45px] text-white transition-colors hover:bg-white hover:text-bg"
        >
          함께하러 가기
          <ArrowRightIcon />
        </button>
      </section>
    </div>
  );
}

/* MORE FAST 슬라이드 말풍선 — Figma 절대좌표 그대로 재현 */
function Bubble({
  tone,
  left,
  top,
  w,
  h,
}: {
  tone: "blue" | "gray";
  left: number;
  top: number;
  w: number;
  h: number;
}) {
  return (
    <div
      className={`absolute rounded-[13px] ${tone === "blue" ? "bg-main" : "bg-label"}`}
      style={{ left, top, width: w, height: h }}
    />
  );
}

/* 회색(수신) 말풍선의 꼬리 장식 — 실제 채팅 말풍선 꼬리 형태(둥근 몸통 + 뾰족한 끝) */
function Tail({ left, top }: { left: number; top: number }) {
  return (
    <svg
      className="absolute"
      style={{ left, top }}
      width="16"
      height="16"
      viewBox="0 0 16 16"
    >
      <path d="M16 0C16 8.5 11 14.5 0 16C7.5 13 9 7 9 0Z" className="fill-label" />
    </svg>
  );
}
