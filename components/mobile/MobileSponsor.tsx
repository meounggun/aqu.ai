"use client";

/* eslint-disable @next/next/no-img-element */

/* 모바일 후원 — 한 장씩 넘겨보는 카드 캐러셀(좌우 화살표 + 인디케이터). 데스크탑과 동일한 단체 목록 재사용. */

import { useLayoutEffect, useRef, useState } from "react";
import { SPONSORS } from "@/components/SponsorView";
import { CaretDown } from "@/components/onboarding-icons";

const N = SPONSORS.length;

export default function MobileSponsor() {
  const [idx, setIdx] = useState(1); // Charity Water부터 시작 — 데스크탑 첫 화면과 동일
  const cardRef = useRef<HTMLAnchorElement>(null);
  const dirRef = useRef<"next" | "prev">("next");
  const sponsor = SPONSORS[idx];
  const go = (delta: number) => {
    dirRef.current = delta > 0 ? "next" : "prev";
    setIdx((i) => (i + delta + N) % N);
  };
  const goTo = (i: number) => {
    dirRef.current = i > idx || (idx === N - 1 && i === 0) ? "next" : "prev";
    setIdx(i);
  };

  // 카드를 리마운트하지 않고(이미지 재로딩 없이) 방향에 맞춰 슬라이드+페이드로 자연스럽게 이어준다
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const from = dirRef.current === "next" ? 48 : -48;
    el.style.transition = "none";
    el.style.transform = `translateX(${from}px)`;
    el.style.opacity = "0.4";
    void el.offsetWidth;
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease";
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
    });
  }, [idx]);

  return (
    <div className="flex flex-col px-[16px] py-[18px]">
      <h2 className="text-center text-[24px] font-bold leading-[1.3] tracking-[-1.1px] text-white">
        소중한 한 모금을
        <br />
        전해주세요
      </h2>
      <p className="mt-[8px] text-center text-[15px] leading-[1.5] tracking-[-0.6px] text-label">
        수자원 고갈과 환경 변화로 기본권을 위협받는 이웃들에게
        <br />
        깨끗한 물과 안전한 내일을 위해
      </p>

      {/* 화면에 없는 나머지 단체 이미지를 미리 캐시해 넘길 때 로딩으로 인한 깜빡임이 없게 한다 */}
      <div className="absolute size-0 overflow-hidden opacity-0" aria-hidden>
        {SPONSORS.map((s) => (
          <img key={s.image} src={s.image} alt="" />
        ))}
      </div>

      {/* 카드 — 언마운트 없이(이미지 재로딩 없이) src/텍스트만 교체하고 transform+opacity로만 슬라이드한다.
          데스크탑과 마찬가지로 텍스트는 좌상단 정렬 */}
      <a
        ref={cardRef}
        href={sponsor.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mt-[22px] flex aspect-square w-full flex-col items-start gap-[26px] overflow-hidden rounded-[28px] px-[22px] py-[28px]"
      >
        <img
          src={sponsor.image}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-active:scale-105"
        />
        {/* 밝은 사진 위에서도 좌상단 텍스트가 읽히도록 하는 대각선 스크림 */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-transparent" />
        <p className="relative text-[24px] font-semibold tracking-[-0.66px] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
          {sponsor.name}
        </p>
        <p className="relative w-[68%] break-keep text-[17px] font-medium leading-[1.4] tracking-[-0.45px] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
          {sponsor.description}
        </p>
      </a>

      {/* 컨트롤 */}
      <div className="mt-[18px] flex items-center justify-center gap-[22px]">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="이전 단체"
          className="rotate-90 p-[6px] text-label opacity-80 active:opacity-100"
        >
          <CaretDown className="size-[22px]" />
        </button>
        <div className="flex gap-[8px]">
          {SPONSORS.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 단체`}
              className={`size-[7px] rounded-full transition-colors ${i === idx ? "bg-main" : "bg-stroke"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="다음 단체"
          className="-rotate-90 p-[6px] text-label opacity-80 active:opacity-100"
        >
          <CaretDown className="size-[22px]" />
        </button>
      </div>
    </div>
  );
}
