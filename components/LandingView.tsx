"use client";

/* 랜딩 — 접속할 때마다 항상 먼저 보이는 첫 화면.
   환경 메시지(그건 "우리에 대하여"가 담당)가 아니라 기능 가치를 앞세운다:
   반복 재입력 제거 → 워크스페이스 세팅 → 도우미 공유 → 이미지 카드 → 시작하기.
   세로 스크롤 스냅 구조와 리빌 애니메이션은 OnboardingView와 동일한 규칙을 따른다. */

import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CaretDown } from "./onboarding-icons";

const SECTION_COUNT = 5;

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

/** 사이드바 설정 버튼과 같은 톱니바퀴 — 원 + 균등 배치된 짧은 이빨 8개 */
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

/** 사이드바 커스텀 덱 한 줄 — 토글이 켜지고 꺼질 때 손잡이가 부드럽게 미끄러진다 */
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
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold tracking-[-0.65px] text-white">
          {name}
        </span>
        <span className="block text-[11px] tracking-[-0.55px] text-label">{meta}</span>
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

/* 섹션 2 데모 타임라인 — 700ms짜리 12스텝을 반복한다 */
const BOARD_STEPS = 12;

/** 섹션 2 비주얼 — 사이드바 커스텀 덱/도우미 패널 + 채팅 바 (Figma 930:1012).
   덱을 켜고 끄는 것, 커스텀 덱이 추가·제거되는 것, 도우미 옵션이 하나씩 열리는 것을 자동 반복 재생한다. */
function BoardVisual() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % BOARD_STEPS), 700);
    return () => clearInterval(t);
  }, []);

  // 켜고 끄고 → 옵션 열기 → 덱 추가 → 덱 제거 순으로 진행
  const deck1On = step >= 1 && step < 10;
  const deck2On = step >= 2 && step < 10;
  const menuOpen = step >= 3 && step <= 6;
  const picked = step >= 5 && step <= 6;
  const extraVisible = step >= 7 && step <= 9;
  const extraLeaving = step === 9;

  const helperGrid = ["요약", "톤", "코드", "검토", "번역", "표", "예시", "쉽게"];
  const chips = ["요약", "번역", "코드", "톤", "검토", "쉽게", "예시", "표"];
  const options = [
    { label: "한 줄 요약", saving: 85 },
    { label: "3줄 요약", saving: 70 },
  ];

  return (
    <div className="flex items-center gap-[76px]">
      {/* 사이드바 패널 */}
      <div className="w-[268px] shrink-0 rounded-[16px] bg-gray-box px-[15px] py-[16px] text-left">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold tracking-[-0.6px] text-label">커스텀 덱</p>
          <GearGlyph className="size-[15px] text-label" />
        </div>

        <div className="mt-[11px] flex flex-col gap-[7px]">
          <DeckRow
            name="10년 차 UI 디자이너 덱"
            meta="디자인 · -62%"
            color="#f97583"
            on={deck1On}
          />
          <DeckRow
            name="카피라이터 300자 덱"
            meta="글쓰기/카피 · -58%"
            color="#ffb648"
            on={deck2On}
          />
          {/* 추가·제거 — 들어올 땐 fade-up, 빠질 땐 바깥 래퍼가 접히며 사라진다 */}
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

        <div className="mt-[14px] border-t border-white/[0.08] pt-[13px]">
          <p className="mb-[10px] text-[12px] font-semibold tracking-[-0.6px] text-label">
            프롬프트 도우미
          </p>
          <div className="grid grid-cols-2 gap-[9px]">
            {helperGrid.map((label) => (
              <span
                key={label}
                className="flex h-[32px] items-center justify-center rounded-[10px] bg-main text-[13px] font-semibold tracking-[-0.65px] text-white"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 채팅 바 — 도우미 칩과, 하나씩 열리는 세부 옵션 */}
      <div className="flex items-center gap-[20px]">
        <div className="flex shrink-0 items-center gap-[9px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/helper-bar-icon.svg" alt="" className="w-[15px] opacity-90" />
          <span className="whitespace-nowrap text-[17px] tracking-[-0.85px] text-white/90">
            프롬프트 도우미
          </span>
        </div>

        <div className="flex items-center gap-[10px]">
          {chips.map((label) => {
            const isSummary = label === "요약";
            const active = isSummary && menuOpen;
            return (
              <div key={label} className="relative">
                <span
                  className={`flex h-[34px] w-[74px] items-center justify-center rounded-[10px] border text-[14px] font-semibold tracking-[-0.7px] text-white transition-colors duration-300 ${
                    active ? "border-main bg-main" : "border-stroke"
                  }`}
                >
                  {label}
                </span>

                {isSummary && menuOpen && (
                  <div
                    className="fade-up absolute bottom-[44px] left-0 w-[152px] rounded-[10px] bg-main py-[6px] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                    style={{ animationDuration: "0.2s" }}
                  >
                    {options.map((opt, i) => (
                      <span
                        key={opt.label}
                        className={`fade-up flex items-center justify-between px-[13px] py-[8px] text-[13px] tracking-[-0.65px] text-white ${
                          picked && i === 0 ? "bg-white/20 font-semibold" : ""
                        }`}
                        style={{ animationDuration: "0.22s", animationDelay: `${i * 110}ms` }}
                      >
                        <span className="whitespace-nowrap">{opt.label}</span>
                        <span className="ml-[8px] shrink-0 text-[12px] font-semibold text-white/75">
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

/** 섹션 3 비주얼 — 마켓에 올라온 도우미/덱 카드가 7·6·5장씩 쌓이고 아래로 갈수록 배경에 잠긴다 (Figma 930:983) */
function ShareVisual() {
  const colors = ["#f97583", "#5b8cff", "#ffb648", "#4fd1c5", "#a78bfa", "#9aa0a6"];
  const cards = [
    { name: "10년 차 UI 디자이너 덱", by: "물방울요정" },
    { name: "React + Tailwind 코드 덱", by: "냉각수마스터" },
    { name: "카피라이터 300자 덱", by: "그린유저" },
    { name: "회의록 정리 도우미", by: "펑치 유" },
    { name: "기획서 3단 구조 덱", by: "물방울요정" },
    { name: "한 줄 요약 도우미", by: "그린유저" },
    { name: "번역 · 자연스러운 톤", by: "냉각수마스터" },
    { name: "논문 리서치 정리 덱", by: "펑치 유" },
    { name: "장단점 표 정리", by: "물방울요정" },
    { name: "SNS 카피 30자 덱", by: "그린유저" },
    { name: "코드 리뷰 체크리스트", by: "냉각수마스터" },
    { name: "면접 답변 다듬기", by: "펑치 유" },
    { name: "이메일 정중한 톤 덱", by: "물방울요정" },
    { name: "데이터 표 요약 도우미", by: "그린유저" },
    { name: "블로그 서론 3안", by: "냉각수마스터" },
    { name: "학습 계획 정리 덱", by: "펑치 유" },
    { name: "제품 소개 카피 덱", by: "물방울요정" },
    { name: "버그 리포트 정리", by: "그린유저" },
  ];
  const rows = [cards.slice(0, 7), cards.slice(7, 13), cards.slice(13, 18)];

  return (
    <div className="relative">
      <div className="flex flex-col gap-[16px]">
        {rows.map((row, r) => (
          <div key={r} className="flex justify-center gap-[16px]">
            {row.map((c, i) => (
              <div
                key={c.name}
                className="flex w-[186px] flex-col gap-[10px] rounded-[16px] border border-stroke bg-gray-box/40 p-[16px]"
              >
                <span
                  className="size-[20px] rounded-[7px]"
                  style={{ backgroundColor: colors[(r * 7 + i) % colors.length] }}
                />
                <div className="text-center">
                  <p className="truncate text-[13px] font-semibold tracking-[-0.65px] text-white">
                    {c.name}
                  </p>
                  <p className="mt-[3px] text-[11px] tracking-[-0.55px] text-label">by {c.by}</p>
                </div>
                <span className="w-fit rounded-full bg-main px-[12px] py-[5px] text-[11px] font-semibold tracking-[-0.55px] text-white">
                  Snap
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* 아래쪽 카드가 배경으로 잠기는 그라데이션 (Figma Rectangle 870) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px] bg-gradient-to-b from-transparent to-bg" />
    </div>
  );
}

/** 섹션 4 비주얼 — 완성된 이미지 카드만 보여준다 (Figma 930:972) */
function CardExportVisual() {
  return (
    <div className="flex w-[330px] flex-col gap-[10px] rounded-[16px] bg-[#242628] p-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
      {[100, 78, 92, 64].map((w, i) => (
        <span key={i} className="flex gap-[8px]">
          <span className="h-[13px] w-[64px] rounded-[4px] bg-white/25" />
          <span className="h-[13px] rounded-[4px] bg-white/18" style={{ width: w }} />
        </span>
      ))}
      <span className="mt-[6px] w-fit rounded-full bg-main/20 px-[12px] py-[5px] text-[12px] font-semibold tracking-[-0.6px] text-main">
        이미지로 복사됨
      </span>
    </div>
  );
}

export default function LandingView({
  onStart,
  onAbout,
}: {
  onStart: () => void;
  onAbout: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({
      top: Math.min(index, SECTION_COUNT - 1) * 1080,
      behavior: "smooth",
    });
  };
  const nextFrom = (i: number) => () => goTo(i + 1);

  // 스크롤 스냅이 거의 정착했을 때 리빌 재생 (OnboardingView와 동일한 임계값)
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
      className={`chat-scroll absolute inset-0 h-[1080px] w-[1920px] snap-y snap-mandatory overflow-y-auto scroll-smooth bg-bg ${
        ready ? "ob-ready" : ""
      }`}
    >
      {/* 1. 히어로 */}
      <section className={sectionClass}>
        <p className="ob-reveal text-[22px] tracking-[-1.1px] text-label-2">
          AI에게 매번 같은 말을 입력하느라 지치셨나요?
        </p>
        <h1 className="ob-reveal ob-d1 mt-[22px] text-[62px] font-bold leading-[1.18] tracking-[-3.1px] text-white">
          나만의 <span className="text-main">AI 워크스페이스</span>를<br />
          만들어보세요
        </h1>
        <p className="ob-reveal ob-d2 mt-[30px] max-w-[880px] text-[20px] leading-[1.6] tracking-[-1px] text-white/80">
          매번 재입력하지 마세요. 내 작업 스타일에 맞춘 프롬프트 도우미를 통해 단 한 번의 대화로
          정밀한 답변이 완성됩니다.
        </p>
        <div className="ob-reveal ob-d3 mt-[44px]">
          <button
            type="button"
            onClick={onStart}
            className="flex h-[58px] cursor-pointer items-center gap-[12px] rounded-full bg-main pl-[30px] pr-[26px] text-[19px] font-semibold tracking-[-0.95px] text-white transition-opacity hover:opacity-90"
          >
            워크스페이스 시작하기
            <ArrowRightIcon className="size-[22px]" />
          </button>
        </div>
        <ScrollHint onClick={nextFrom(0)} />
      </section>

      {/* 2. 하나의 보드에서 세팅 */}
      <section className={sectionClass}>
        <h2 className="ob-reveal text-[46px] font-bold leading-[1.25] tracking-[-2.3px] text-white">
          세팅부터 아카이빙까지, <span className="text-main">하나의 보드</span>에서.
        </h2>
        <p className="ob-reveal ob-d1 mt-[24px] max-w-[900px] text-[19px] leading-[1.6] tracking-[-0.95px] text-white/80">
          매 대화마다 조건을 타이핑할 필요 없이 프롬프트 도우미를 통해 나만의 작업 환경을 신속하게
          세팅합니다.
        </p>
        <p className="ob-reveal ob-d1 mt-[6px] text-[16px] leading-[1.6] tracking-[-0.8px] text-white/60">
          필요한 프롬프트 도우미를 선택만 하세요.
        </p>
        <div className="ob-reveal ob-d2 mt-[46px]">
          <BoardVisual />
        </div>
        <ScrollHint onClick={nextFrom(1)} />
      </section>

      {/* 3. 프롬프트 도우미 공유 */}
      <section className={sectionClass}>
        <h2 className="ob-reveal text-[46px] font-bold leading-[1.25] tracking-[-2.3px] text-white">
          프롬프트 도우미 <span className="text-main">공유</span>
        </h2>
        <p className="ob-reveal ob-d1 mt-[24px] max-w-[900px] text-[19px] leading-[1.6] tracking-[-0.95px] text-white/80">
          나만의 프롬프트 도우미를 공유하고 발전시켜 더 똑똑하게 사용해요
        </p>
        <div className="ob-reveal ob-d2 mt-[52px]">
          <ShareVisual />
        </div>
        <ScrollHint onClick={nextFrom(2)} />
      </section>

      {/* 4. 이미지 카드 내보내기 */}
      <section className={sectionClass}>
        <h2 className="ob-reveal text-[40px] font-bold leading-[1.3] tracking-[-2px] text-white">
          AI가 만들어준 표, 한번에 복사하기 힘드셨나요?
        </h2>
        <p className="ob-reveal ob-d1 mt-[22px] max-w-[860px] text-[19px] leading-[1.6] tracking-[-0.95px] text-white/80">
          완성된 <span className="text-main">&lsquo;이미지 카드&rsquo;</span> 형태로 빠르게 복사하여
          붙여넣을 수 있습니다.
        </p>
        <div className="ob-reveal ob-d2 mt-[52px]">
          <CardExportVisual />
        </div>
        <ScrollHint onClick={nextFrom(3)} />
      </section>

      {/* 5. CTA */}
      <section className={sectionClass}>
        {/* 물컵 일러스트 — 이미지 배경이 앱 배경과 같아 자연스럽게 이어진다 (Figma 930:959) */}
        <div className="ob-reveal relative size-[300px] shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/cup-1.png"
            alt=""
            className="absolute left-1/2 top-1/2 w-[620px] max-w-none -translate-x-1/2 -translate-y-1/2"
          />
        </div>
        <p className="ob-reveal ob-d1 mt-[6px] max-w-[1000px] text-[20px] leading-[1.7] tracking-[-1px] text-label-2">
          AI를 효율적으로 쓴다는 것은 단순히 시간만 아끼는 것이 아닙니다.
        </p>
        <p className="ob-reveal ob-d2 mt-[8px] max-w-[1100px] text-[46px] font-bold leading-[1.4] tracking-[-2.3px] text-white">
          내 시간과 지구의 자원을 동시에 아껴보세요.
        </p>
        <p className="ob-reveal ob-d3 mt-[38px] text-[23px] font-bold tracking-[-1.15px] text-main">
          지금, 당신만의 AI 워크스페이스를 만들어보세요.
        </p>
        <div className="ob-reveal ob-d3 mt-[26px] flex items-center gap-[16px]">
          <button
            type="button"
            onClick={onAbout}
            className="flex h-[56px] cursor-pointer items-center rounded-full border-2 border-white/70 px-[28px] text-[18px] font-medium tracking-[-0.9px] text-white transition-colors hover:bg-white hover:text-bg"
          >
            우리에 대하여
          </button>
          <button
            type="button"
            onClick={onStart}
            className="ob-cta flex h-[56px] cursor-pointer items-center gap-[12px] rounded-full bg-main pl-[30px] pr-[26px] text-[18px] font-semibold tracking-[-0.9px] text-white transition-opacity hover:opacity-90"
          >
            메인 화면으로
            <ArrowRightIcon className="size-[22px]" />
          </button>
        </div>
      </section>
    </div>
  );
}
