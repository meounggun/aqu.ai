"use client";

/* 뉴스 — Figma 835:1324 "시민단체가 바라본 AI데이터센터의 환경오염" 실측 재현 */
/* eslint-disable @next/next/no-img-element */

import { useLayoutEffect, useRef, useState } from "react";
import { CaretDown } from "./onboarding-icons";

export interface Article {
  source: string;
  title: string;
  href: string;
  image: string;
}

/* 6개 기사를 순서대로 이어 붙이고, 중앙(featured) 위치를 한 칸씩 옮기는 캐러셀 — 클릭할 때마다 카드 1장만 교체된다.
   모바일 뉴스(MobileNews)도 이 배열을 재사용한다. */
export const ARTICLES: Article[] = [
  {
    source: "환경운동연합",
    title: "기후부담 가중하는 화석연료\n'AI 데이터센터 특별법안' 폐기하라",
    href: "https://kfem.or.kr/energy/?bmode=view&idx=170826385",
    image: "/assets/news/kfem.jpg",
  },
  {
    source: "그린피스",
    title: "챗GPT·그록·딥시크 경쟁 속 숨겨진 기후 리스크, AI시대의 그림자는?",
    href: "https://www.greenpeace.org/korea/update/33710/blog-ce-2025-chipping-point/",
    image: "/assets/news/greenpeace.jpg",
  },
  {
    source: "레스트 오브 월드",
    title:
      "마이크로소프트가 인도의 작은 마을에 데이터센터를 짓고 있습니다. 주민들은 이들이 산업 폐기물을 무단 투기하고 있다고 주장합니다",
    href: "https://restofworld.org/2024/microsoft-data-center-india-mekaguda-industrial-waste/",
    image: "/assets/news/restofworld.jpg",
  },
  {
    source: "파이낸셜뉴스",
    title: "AI 데이터센터, 수자원 고갈시키나…\n실제 물 소비량, 보고서 12배 이를 수도",
    href: "https://www.fnnews.com/news/202607040406311808",
    image: "/assets/news/fnnews.jpg",
  },
  {
    source: "Tom's Hardware",
    title: "美 신설 AI 데이터센터 809곳 중 3분의 2, 물 부족 가뭄 지역에 들어선다",
    href: "https://www.tomshardware.com/tech-industry/most-new-us-ai-data-centers-are-going-up-on-drought-land",
    image: "/assets/news/tomshardware.jpg",
  },
  {
    source: "ZDNet Korea",
    title: "'전기 먹는 하마' AI 데이터센터,\n물도 많이 먹는다",
    href: "https://zdnet.co.kr/view/?no=20260705082138",
    image: "/assets/news/zdnet.jpg",
  },
];

function SideCard({ article }: { article: Article }) {
  return (
    <a
      href={article.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex size-[442px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[70px]"
    >
      <img
        src={article.image}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/50" />
      <p className="relative whitespace-nowrap text-center text-[24px] tracking-[-1.2px] text-white/60">
        {article.source}
      </p>
      <p className="relative mt-[20px] w-[328px] whitespace-pre-line text-center text-[24px] font-bold leading-[1.5] tracking-[-1.2px] text-white/60">
        {article.title}
      </p>
    </a>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  return (
    <a
      href={article.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex size-[530px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[85px]"
    >
      <img
        src={article.image}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <p className="relative whitespace-nowrap text-center text-[28px] tracking-[-1.4px] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
        {article.source}
      </p>
      <p className="relative mt-[27px] w-[400px] text-center text-[28px] font-bold leading-[1.5] tracking-[-1.4px] text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
        {article.title}
      </p>
    </a>
  );
}

const N = ARTICLES.length;

export default function NewsView() {
  const [center, setCenter] = useState(1); // 그린피스(featured)부터 시작 — 기존 첫 화면 구성과 동일
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

  const left = ARTICLES[(center - 1 + N) % N];
  const featured = ARTICLES[center];
  const right = ARTICLES[(center + 1) % N];

  return (
    <div className="absolute left-[60px] top-0 h-[1080px] w-[1860px]">
      <h2 className="absolute left-1/2 top-[195px] w-[862px] -translate-x-1/2 text-center text-[47px] font-bold leading-[1.2] tracking-[-2.35px] text-white">
        시민단체가 바라본 AI데이터센터의 환경오염
      </h2>
      <p className="absolute left-1/2 top-[281px] -translate-x-1/2 whitespace-nowrap text-[15px] tracking-[-0.75px] text-label">
        오늘 우리가 마주해야할 이슈들을 확인해보세요.
      </p>

      {/* 화면에 없는 나머지 기사 이미지를 미리 캐시해 처음 등장할 때도 깜빡임 없이 표시되게 한다 */}
      <div className="absolute size-0 overflow-hidden opacity-0" aria-hidden>
        {ARTICLES.map((a) => (
          <img key={a.image} src={a.image} alt="" />
        ))}
      </div>

      {/* 카드 크기가 서로 달라(442px/530px) items-center로 세 카드의 수직 중심을 맞춘다.
          클릭할 때마다 center가 1칸씩만 이동 — 카드 3장 중 2장은 그대로 위치만 옮기고 1장만 새로 들어온다.
          컨테이너를 리마운트하지 않고(prop만 교체) transform으로만 슬라이드해 깜빡임을 없앤다 */}
      <div
        ref={rowRef}
        className="absolute left-1/2 top-[364px] flex w-[1502px] -translate-x-1/2 items-center justify-between"
      >
        <SideCard article={left} />
        <FeaturedCard article={featured} />
        <SideCard article={right} />
      </div>

      {/* 화살표 — 카드 그룹의 좌우 바깥 여백 중앙, 세로는 카드 그룹 중심(364 + 530/2)에 정렬 */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="이전 소식"
        className="absolute left-[76px] top-[616px] rotate-90 cursor-pointer opacity-80 transition-opacity hover:opacity-100"
      >
        <CaretDown />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="다음 소식"
        className="absolute left-[1757px] top-[616px] -rotate-90 cursor-pointer opacity-80 transition-opacity hover:opacity-100"
      >
        <CaretDown />
      </button>

      {/* 페이지 인디케이터 — 현재 중앙(featured) 기사 기준 */}
      <div className="absolute left-1/2 top-[970px] flex -translate-x-1/2 gap-[10px]">
        {ARTICLES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번째 소식으로 이동`}
            className={`size-[8px] cursor-pointer rounded-full transition-colors ${
              i === center ? "bg-main" : "bg-stroke"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
