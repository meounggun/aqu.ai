"use client";

/* 모바일 랜딩 — 데스크탑 LandingView를 폰 비율에 맞춰 재구성.
   접속할 때마다 항상 먼저 보이며, 환경이 아니라 기능 가치를 앞세운다. */

import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CaretDown } from "@/components/onboarding-icons";

const SECTION_COUNT = 5;

function ScrollHint({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="다음"
      className="absolute bottom-[20px] left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-[4px] opacity-80"
    >
      <span className="text-[13px] tracking-[-0.6px] text-label-2">Scroll</span>
      <span className="animate-bounce">
        <CaretDown className="size-[20px]" />
      </span>
    </button>
  );
}

/** 사이드바 설정 버튼과 같은 톱니바퀴 */
function GearGlyph({ className = "" }: { className?: string }) {
  const pt = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: 8 + r * Math.cos(rad), y: 8 + r * Math.sin(rad) };
  };
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      {Array.from({ length: 8 }, (_, i) => (360 / 8) * i).map((deg) => {
        const a = pt(deg, 5.3);
        const b = pt(deg, 7);
        return (
          <line
            key={deg}
            x1={a.x.toFixed(2)}
            y1={a.y.toFixed(2)}
            x2={b.x.toFixed(2)}
            y2={b.y.toFixed(2)}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        );
      })}
      <circle cx="8" cy="8" r="4.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** 커스텀 덱 한 줄 — 토글 손잡이가 부드럽게 미끄러진다 */
function DeckRow({
  name,
  meta,
  color,
  on,
}: {
  name: string;
  meta: string;
  color: string;
  on: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-[9px] rounded-[10px] border px-[10px] py-[8px] transition-colors duration-300 ${
        on ? "border-main bg-main/20" : "border-stroke"
      }`}
    >
      <span className="size-[8px] shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[12px] font-semibold tracking-[-0.6px] text-white">
          {name}
        </span>
        <span className="block text-[10px] tracking-[-0.5px] text-label">{meta}</span>
      </span>
      <span
        className={`flex h-[18px] w-[32px] shrink-0 items-center rounded-full px-[2px] transition-colors duration-300 ${
          on ? "bg-main" : "bg-white/20"
        }`}
      >
        <span
          className="size-[14px] rounded-full bg-white transition-transform duration-300"
          style={{ transform: on ? "translateX(14px)" : "translateX(0)" }}
        />
      </span>
    </div>
  );
}

const BOARD_STEPS = 12;

/** 섹션 2 비주얼 — 커스텀 덱을 켜고 끄고, 추가·제거하고, 도우미 옵션이 열리는 과정을 자동 반복 재생 */
function BoardVisual() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % BOARD_STEPS), 700);
    return () => clearInterval(t);
  }, []);

  const deck1On = step >= 1 && step < 10;
  const deck2On = step >= 2 && step < 10;
  const menuOpen = step >= 3 && step <= 6;
  const picked = step >= 5 && step <= 6;
  const extraVisible = step >= 7 && step <= 9;
  const extraLeaving = step === 9;

  const categories = ["요약", "톤", "코드", "검토", "번역", "표", "예시", "쉽게"];
  const options = [
    { label: "한 줄 요약", saving: 85 },
    { label: "3줄 요약", saving: 70 },
  ];

  return (
    <div className="flex w-full flex-col gap-[14px] rounded-[16px] border border-stroke bg-gray-box/40 p-[16px]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-[-0.55px] text-label">커스텀 덱</p>
        <GearGlyph className="size-[14px] text-label" />
      </div>

      <div className="flex flex-col gap-[7px]">
        <DeckRow name="10년 차 UI 디자이너 덱" meta="디자인 · -62%" color="#f97583" on={deck1On} />
        <DeckRow
          name="카피라이터 300자 덱"
          meta="글쓰기/카피 · -58%"
          color="#ffb648"
          on={deck2On}
        />
        {extraVisible && (
          <div
            className={`transition-all duration-300 ${
              extraLeaving ? "-translate-x-[8px] scale-[0.96] opacity-0" : ""
            }`}
          >
            <div className="fade-up" style={{ animationDuration: "0.3s" }}>
              <DeckRow name="회의록 정리 덱" meta="기획/문서 · -55%" color="#a78bfa" on />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.08] pt-[12px]">
        <p className="mb-[8px] text-left text-[11px] font-semibold tracking-[-0.55px] text-label">
          프롬프트 도우미
        </p>
        <div className="grid grid-cols-2 gap-[6px]">
          {categories.map((label) => {
            const isSummary = label === "요약";
            const active = isSummary && menuOpen;
            return (
              <div key={label} className="relative">
                <span
                  className={`flex h-[36px] items-center justify-center rounded-[10px] border text-[12px] font-semibold tracking-[-0.6px] text-white transition-colors duration-300 ${
                    active ? "border-white/70 bg-main" : "border-main bg-main"
                  }`}
                >
                  {label}
                </span>
                {isSummary && menuOpen && (
                  <div
                    className="fade-up absolute left-0 top-[42px] z-10 w-[150px] rounded-[10px] bg-main py-[5px] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                    style={{ animationDuration: "0.2s" }}
                  >
                    {options.map((opt, i) => (
                      <span
                        key={opt.label}
                        className={`fade-up flex items-center justify-between px-[11px] py-[7px] text-[12px] tracking-[-0.6px] text-white ${
                          picked && i === 0 ? "bg-white/20 font-semibold" : ""
                        }`}
                        style={{ animationDuration: "0.22s", animationDelay: `${i * 110}ms` }}
                      >
                        <span className="whitespace-nowrap">{opt.label}</span>
                        <span className="ml-[8px] shrink-0 text-[11px] font-semibold text-white/75">
                          -{opt.saving}%
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ShareVisual() {
  const colors = ["#f97583", "#5b8cff", "#ffb648", "#4fd1c5", "#a78bfa", "#9aa0a6"];
  const cards = [
    { name: "10년 차 UI 디자이너 덱", by: "물방울요정" },
    { name: "React + Tailwind 코드 덱", by: "냉각수마스터" },
    { name: "카피라이터 300자 덱", by: "그린유저" },
    { name: "회의록 정리 도우미", by: "펑치 유" },
    { name: "번역 · 자연스러운 톤", by: "냉각수마스터" },
    { name: "장단점 표 정리", by: "물방울요정" },
  ];
  return (
    <div className="grid w-full grid-cols-2 gap-[10px]">
      {cards.map((c, i) => (
        <div
          key={c.name}
          className="flex flex-col gap-[8px] rounded-[14px] border border-stroke bg-gray-box/40 p-[12px] text-left"
        >
          <span className="size-[18px] rounded-[6px]" style={{ backgroundColor: colors[i % colors.length] }} />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold tracking-[-0.6px] text-white">{c.name}</p>
            <p className="mt-[2px] text-[10px] tracking-[-0.5px] text-label">by {c.by}</p>
          </div>
          <span className="w-fit rounded-full bg-main px-[10px] py-[4px] text-[10px] font-semibold tracking-[-0.5px] text-white">
            Snap
          </span>
        </div>
      ))}
    </div>
  );
}

function CardExportVisual() {
  const rows = [72, 56, 66, 48];
  return (
    <div className="flex w-full flex-col gap-[7px] rounded-[14px] bg-[#242628] p-[14px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
      {rows.map((w, i) => (
        <span key={i} className="flex gap-[6px]">
          <span className="h-[10px] w-[46px] rounded-[3px] bg-white/25" />
          <span className="h-[10px] rounded-[3px] bg-white/18" style={{ width: w }} />
        </span>
      ))}
      <span className="mt-[4px] w-fit rounded-full bg-main/20 px-[10px] py-[4px] text-[11px] font-semibold tracking-[-0.55px] text-main">
        이미지로 복사됨
      </span>
    </div>
  );
}

export default function MobileLanding({
  onStart,
  onAbout,
}: {
  onStart: () => void;
  onAbout: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const goTo = (i: number) =>
    scrollRef.current?.scrollTo({
      top: Math.min(i, SECTION_COUNT - 1) * scrollRef.current.clientHeight,
      behavior: "smooth",
    });
  const nextFrom = (i: number) => () => goTo(i + 1);

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
      {/* 1. 히어로 */}
      <section className={section}>
        <p className="ob-reveal text-[14px] tracking-[-0.7px] text-label-2">
          AI에게 매번 같은 말을 입력하느라 지치셨나요?
        </p>
        <h1 className="ob-reveal ob-d1 mt-[14px] text-[30px] font-bold leading-[1.28] tracking-[-1.5px] text-white">
          나만의 <span className="text-main">AI 워크스페이스</span>를 만들어보세요
        </h1>
        <p className="ob-reveal ob-d2 mt-[16px] text-[14px] leading-[1.65] tracking-[-0.7px] text-white/80">
          매번 재입력하지 마세요. 내 작업 스타일에 맞춘 프롬프트 도우미를 통해 단 한 번의 대화로
          정밀한 답변이 완성됩니다.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="ob-reveal ob-d3 mt-[28px] flex h-[50px] items-center gap-[10px] rounded-full bg-main pl-[24px] pr-[20px] text-[16px] font-semibold tracking-[-0.8px] text-white"
        >
          워크스페이스 시작하기
          <ArrowRightIcon className="size-[20px]" />
        </button>
        <ScrollHint onClick={nextFrom(0)} />
      </section>

      {/* 2. 하나의 보드에서 세팅 */}
      <section className={section}>
        <h2 className="ob-reveal text-[24px] font-bold leading-[1.35] tracking-[-1.2px] text-white">
          세팅부터 아카이빙까지,
          <br />
          <span className="text-main">하나의 보드</span>에서.
        </h2>
        <p className="ob-reveal ob-d1 mt-[14px] text-[13px] leading-[1.65] tracking-[-0.65px] text-white/80">
          매 대화마다 조건을 타이핑할 필요 없이 프롬프트 도우미를 통해 나만의 작업 환경을 신속하게
          세팅합니다.
        </p>
        <p className="ob-reveal ob-d1 mt-[6px] text-[12px] leading-[1.6] tracking-[-0.6px] text-white/60">
          필요한 프롬프트 도우미를 선택만 하세요.
        </p>
        <div className="ob-reveal ob-d2 mt-[22px] w-full">
          <BoardVisual />
        </div>
        <ScrollHint onClick={nextFrom(1)} />
      </section>

      {/* 3. 프롬프트 도우미 공유 */}
      <section className={section}>
        <h2 className="ob-reveal text-[24px] font-bold leading-[1.35] tracking-[-1.2px] text-white">
          프롬프트 도우미 <span className="text-main">공유</span>
        </h2>
        <p className="ob-reveal ob-d1 mt-[14px] text-[13px] leading-[1.65] tracking-[-0.65px] text-white/80">
          나만의 프롬프트 도우미를 공유하고 발전시켜 더 똑똑하게 사용해요
        </p>
        <div className="ob-reveal ob-d2 mt-[26px] w-full">
          <ShareVisual />
        </div>
        <ScrollHint onClick={nextFrom(2)} />
      </section>

      {/* 4. 이미지 카드 내보내기 */}
      <section className={section}>
        <h2 className="ob-reveal text-[21px] font-bold leading-[1.4] tracking-[-1.05px] text-white">
          AI가 만들어준 표,
          <br />
          한번에 복사하기 힘드셨나요?
        </h2>
        <p className="ob-reveal ob-d1 mt-[14px] text-[13px] leading-[1.65] tracking-[-0.65px] text-white/80">
          완성된 <span className="text-main">&lsquo;이미지 카드&rsquo;</span> 형태로 빠르게 복사하여
          붙여넣을 수 있습니다.
        </p>
        <div className="ob-reveal ob-d2 mt-[24px] w-full">
          <CardExportVisual />
        </div>
        <ScrollHint onClick={nextFrom(3)} />
      </section>

      {/* 5. CTA */}
      <section className={section}>
        {/* 물컵 일러스트 — 이미지 배경이 앱 배경과 같아 자연스럽게 이어진다 (Figma 930:959) */}
        <div className="ob-reveal relative size-[180px] shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/cup-1.png"
            alt=""
            className="absolute left-1/2 top-1/2 w-[372px] max-w-none -translate-x-1/2 -translate-y-1/2"
          />
        </div>
        <p className="ob-reveal ob-d1 mt-[4px] text-[13px] leading-[1.7] tracking-[-0.65px] text-label-2">
          AI를 효율적으로 쓴다는 것은 단순히 시간만 아끼는 것이 아닙니다.
        </p>
        <p className="ob-reveal ob-d2 mt-[8px] text-[24px] font-bold leading-[1.45] tracking-[-1.2px] text-white">
          내 시간과 지구의 자원을 동시에 아껴보세요.
        </p>
        <p className="ob-reveal ob-d3 mt-[20px] text-[15px] font-bold tracking-[-0.75px] text-main">
          지금, 당신만의 AI 워크스페이스를 만들어보세요.
        </p>
        <div className="ob-reveal ob-d3 mt-[30px] flex w-full flex-col gap-[10px]">
          <button
            type="button"
            onClick={onStart}
            className="ob-cta flex h-[50px] items-center justify-center gap-[10px] rounded-full bg-main text-[16px] font-semibold tracking-[-0.8px] text-white"
          >
            메인 화면으로
            <ArrowRightIcon className="size-[20px]" />
          </button>
          <button
            type="button"
            onClick={onAbout}
            className="flex h-[50px] items-center justify-center rounded-full border-2 border-white/70 text-[15px] font-medium tracking-[-0.75px] text-white active:bg-white active:text-bg"
          >
            우리에 대하여
          </button>
        </div>
      </section>
    </div>
  );
}
