"use client";

/* 후원 — Figma 835:1324 "소중한 한 모금을 전해주세요" 실측 재현.
   뉴스(NewsView)와 같은 3장 캐러셀 구조지만, 카드 안 텍스트가 좌상단 정렬이고
   양옆 카드는 딤 처리(bg/72)된다는 점이 다르다. */
/* eslint-disable @next/next/no-img-element */

import { useLayoutEffect, useRef, useState } from "react";
import { CaretDown } from "./onboarding-icons";

export interface Sponsor {
  name: string;
  description: string;
  href: string;
  image: string;
}

/* 6개 단체를 순서대로 이어 붙이고, 중앙(featured) 위치를 한 칸씩 옮기는 캐러셀.
   모바일 후원(MobileSponsor)도 이 배열을 재사용한다. */
export const SPONSORS: Sponsor[] = [
  {
    name: "팀앤팀",
    description: "스스로 고치는 기술과 위생을 선물합니다",
    href: "https://happybean.naver.com/donation/rdonaboxes/H200000008400/story",
    image: "/assets/sponsor/teamandteam-1.jpg",
  },
  {
    name: "Charity Water",
    description: "지구상의 모든 사람에게 깨끗하고 안전한 물을 제공합니다",
    href: "https://www.charitywater.org",
    image: "/assets/sponsor/charity-water.jpg",
  },
  {
    name: "World Vision",
    description: "식수시설, 화장실을 만들고 주민의 운영 역량을 키웁니다",
    href: "https://www.worldvision.or.kr/supportGuide/overseaBusiness",
    image: "/assets/sponsor/world-vision.jpg",
  },
  {
    name: "팀앤팀",
    description: "사라져버린 깨끗한 물, 인도적 위기에 처한 에티오피아",
    href: "https://happybean.naver.com/donation/rdonaboxes/H200000009613/story",
    image: "/assets/sponsor/teamandteam-3.jpg",
  },
  {
    name: "Samaritan’s Purse",
    description: "예수 그리스도의 이름으로 음식, 물, 피난처, 약 및 기타 필요한 것들을 제공합니다",
    href: "https://arc.samaritanspurse.or.kr/what-we-do/international-crisis-response/",
    image: "/assets/sponsor/samaritans-purse.jpg",
  },
  {
    name: "팀앤팀",
    description: "물도 화장실도 없는 감염병 최전선의 비극을 멈춰주세요",
    href: "https://happybean.naver.com/donation/rdonaboxes/H200000008906/story",
    image: "/assets/sponsor/teamandteam-2.jpg",
  },
];

function SideCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex size-[442px] shrink-0 flex-col items-start gap-[54px] overflow-hidden rounded-[41.7px] px-[31px] py-[48px]"
    >
      <img
        src={sponsor.image}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* 가운데 카드보다 뒤로 물러나 보이도록 배경색으로 덮는다 (Figma Rectangle 780/781) */}
      <div className="absolute inset-0 bg-bg/72" />
      <p className="relative text-[30px] font-semibold tracking-[-0.9px] text-white/60">
        {sponsor.name}
      </p>
      <p className="relative w-[200px] break-keep text-[20px] font-medium leading-[1.35] tracking-[-0.6px] text-white/60">
        {sponsor.description}
      </p>
    </a>
  );
}

function FeaturedCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <a
      href={sponsor.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex size-[530px] shrink-0 flex-col items-start gap-[65px] overflow-hidden rounded-[50px] px-[37px] py-[58px]"
    >
      <img
        src={sponsor.image}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* 밝은 사진 위에서도 좌상단 텍스트가 읽히도록 하는 대각선 스크림 (Figma 그라데이션 오버레이와 같은 역할) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/55 via-black/15 to-transparent" />
      <p className="relative text-[36px] font-semibold tracking-[-1.08px] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
        {sponsor.name}
      </p>
      <p className="relative w-[240px] break-keep text-[24px] font-medium leading-[1.35] tracking-[-0.72px] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.6)]">
        {sponsor.description}
      </p>
    </a>
  );
}

const N = SPONSORS.length;

export default function SponsorView() {
  const [center, setCenter] = useState(1); // Charity Water(featured)부터 시작 — Figma 첫 화면과 동일
  const rowRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<"next" | "prev">("next");

  const goPrev = () => {
    dirRef.current = "prev";
    setCenter((c) => (c - 1 + N) % N);
  };
  const goNext = () => {
    dirRef.current = "next";
    setCenter((c) => (c + 1) % N);
  };
  const goTo = (i: number) => {
    dirRef.current = i > center || (center === N - 1 && i === 0) ? "next" : "prev";
    setCenter(i);
  };

  // 컨텐츠는 그대로 두고(언마운트 없이 src/텍스트만 교체) transform+opacity만 밀었다가 되돌려 —
  // 이미지가 다시 로드되며 생기는 화면 깜빡임 없이, 방향성 있는 부드러운 슬라이드 느낌을 준다
  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const from = dirRef.current === "next" ? 64 : -64;
    el.style.transition = "none";
    el.style.transform = `translateX(${from}px)`;
    el.style.opacity = "0.4";
    void el.offsetWidth;
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease";
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
    });
  }, [center]);

  const left = SPONSORS[(center - 1 + N) % N];
  const featured = SPONSORS[center];
  const right = SPONSORS[(center + 1) % N];

  return (
    <div className="absolute left-[60px] top-0 h-[1080px] w-[1860px]">
      <h2 className="absolute left-1/2 top-[165px] -translate-x-1/2 whitespace-nowrap text-center text-[64px] font-bold leading-[94px] tracking-[-1.92px] text-white">
        소중한 한 모금을 전해주세요
      </h2>
      <p className="absolute left-1/2 top-[269px] -translate-x-1/2 whitespace-nowrap text-center text-[24px] leading-[1.5] tracking-[-0.72px] text-white/90">
        수자원 고갈과 환경 변화로 기본권을 위협받는 이웃들에게 깨끗한 물과 안전한 내일을 위해
      </p>

      {/* 화면에 없는 나머지 단체 이미지를 미리 캐시해 처음 등장할 때도 깜빡임 없이 표시되게 한다 */}
      <div className="absolute size-0 overflow-hidden opacity-0" aria-hidden>
        {SPONSORS.map((s) => (
          <img key={s.image} src={s.image} alt="" />
        ))}
      </div>

      {/* 카드 크기가 서로 달라(442px/530px) items-center로 세 카드의 수직 중심을 맞춘다.
          클릭할 때마다 center가 1칸씩만 이동 — 카드 3장 중 2장은 그대로 위치만 옮기고 1장만 새로 들어온다 */}
      <div
        ref={rowRef}
        className="absolute left-1/2 top-[345px] flex w-[1502px] -translate-x-1/2 items-center justify-between"
      >
        <SideCard sponsor={left} />
        <FeaturedCard sponsor={featured} />
        <SideCard sponsor={right} />
      </div>

      {/* 화살표 — 카드 그룹의 좌우 바깥 여백 중앙, 세로는 카드 그룹 중심(345 + 530/2)에 정렬 */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="이전 단체"
        className="absolute left-[79px] top-[597px] rotate-90 cursor-pointer opacity-80 transition-opacity hover:opacity-100"
      >
        <CaretDown />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="다음 단체"
        className="absolute left-[1706px] top-[597px] -rotate-90 cursor-pointer opacity-80 transition-opacity hover:opacity-100"
      >
        <CaretDown />
      </button>

      {/* 페이지 인디케이터 — 현재 중앙(featured) 단체 기준 */}
      <div className="absolute left-1/2 top-[905px] flex -translate-x-1/2 gap-[10px]">
        {SPONSORS.map((s, i) => (
          <button
            key={`${s.name}-${i}`}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번째 단체로 이동`}
            className={`size-[8px] cursor-pointer rounded-full transition-colors ${
              i === center ? "bg-main" : "bg-stroke"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
