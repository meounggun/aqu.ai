"use client";

/* eslint-disable @next/next/no-img-element */

/* 모바일 뉴스 — 한 장씩 넘겨보는 카드 캐러셀(좌우 화살표 + 인디케이터). 데스크탑과 동일한 기사 재사용. */

import { useLayoutEffect, useRef, useState } from "react";
import { ARTICLES } from "@/components/NewsView";
import { CaretDown } from "@/components/onboarding-icons";

const N = ARTICLES.length;

export default function MobileNews() {
  const [idx, setIdx] = useState(0);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const dirRef = useRef<"next" | "prev">("next");
  const article = ARTICLES[idx];
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
      <h2 className="text-center text-[22px] font-bold leading-[1.3] tracking-[-1.1px] text-white">
        시민단체가 바라본
        <br />
        AI데이터센터의 환경오염
      </h2>
      <p className="mt-[8px] text-center text-[12px] tracking-[-0.6px] text-label">
        오늘 우리가 마주해야할 이슈들을 확인해보세요.
      </p>

      {/* 화면에 없는 나머지 기사 이미지를 미리 캐시해 넘길 때 로딩으로 인한 깜빡임이 없게 한다 */}
      <div className="absolute size-0 overflow-hidden opacity-0" aria-hidden>
        {ARTICLES.map((a) => (
          <img key={a.image} src={a.image} alt="" />
        ))}
      </div>

      {/* 카드 — 언마운트 없이(이미지 재로딩 없이) src/텍스트만 교체하고 transform+opacity로만 슬라이드한다 */}
      <a
        ref={cardRef}
        href={article.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative mt-[22px] flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-[28px]"
      >
        <img
          src={article.image}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-active:scale-105"
        />
        <div className="absolute inset-0 bg-black/50" />
        <p className="relative text-center text-[16px] tracking-[-0.8px] text-white/80 [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
          {article.source}
        </p>
        <p className="relative mt-[14px] w-[75%] whitespace-pre-line text-center text-[18px] font-bold leading-[1.5] tracking-[-0.9px] text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]">
          {article.title}
        </p>
      </a>

      {/* 컨트롤 */}
      <div className="mt-[18px] flex items-center justify-center gap-[22px]">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="이전 소식"
          className="rotate-90 p-[6px] text-label opacity-80 active:opacity-100"
        >
          <CaretDown className="size-[22px]" />
        </button>
        <div className="flex gap-[8px]">
          {ARTICLES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 소식`}
              className={`size-[7px] rounded-full transition-colors ${i === idx ? "bg-main" : "bg-stroke"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="다음 소식"
          className="-rotate-90 p-[6px] text-label opacity-80 active:opacity-100"
        >
          <CaretDown className="size-[22px]" />
        </button>
      </div>
    </div>
  );
}
