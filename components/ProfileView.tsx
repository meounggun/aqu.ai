"use client";

/* MY PROFILE — 기획서 프로필 화면 스펙:
   일일 냉각수 게이지 / 누적 사용량·비워낸 컵·누적 채팅·도우미 횟수 / 월 달력 / 어제 대비 그래프
   + 날짜 선택(달력 ↔ 기록 리스트 연동) / 연도별 누적 통계 필터 / 프로필 사진 설정
   + 진입 애니메이션
   여백 스케일: 16px(카드 간·섹션 내 기본 간격) / 12px(캡션류 보조 간격) / 4~6px(칩·리스트 촘촘한 간격) */

import { useEffect, useRef, useState } from "react";
import { DAILY_LIMIT } from "@/lib/water";
import {
  type UsageStore,
  availableYears,
  dateKey,
  getDay,
  lastDays,
  monthTotal,
  totals,
} from "@/lib/usage-store";
import { CaretDown } from "./onboarding-icons";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const PHOTO_KEY = "aqu-profile-photo";

function formatDateLabel(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(key).getDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

/* 어제 대비 그래프 아래에 붙는 짧은 격려/팁 메시지 — 추세와 크기에 따라 다르게 보여준다 */
function encouragement(lessThanYesterday: boolean, diffPercent: number): string {
  if (lessThanYesterday) {
    if (diffPercent >= 30) return "훌륭해요! 짧고 명확한 질문이 큰 변화를 만들고 있어요 🌊";
    if (diffPercent > 0) return "좋은 흐름이에요. 이 페이스를 계속 이어가 볼까요?";
    return "어제와 비슷하게 잘 유지하고 있어요. 꾸준함이 중요해요!";
  }
  if (diffPercent >= 30) return "오늘은 사용량이 꽤 늘었어요. 프롬프트 도우미로 질문을 다듬어보세요.";
  if (diffPercent > 0) return "조금 늘었지만 괜찮아요. 다음 질문은 조금만 더 짧게 해볼까요?";
  return "짧고 명확한 질문 하나가 물 한 방울을 지킵니다 💧";
}

function Card({
  className = "",
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`fade-up rounded-[14px] bg-[#242628] p-[20px] ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function ProfileView({ store }: { store: UsageStore }) {
  const today = new Date();
  const todayKey = dateKey(today);
  const [selectedKey, setSelectedKey] = useState(todayKey);

  // 달력에 표시 중인 연/월 — 오늘과 별개로 자유롭게 이동 가능. 연도와 월을 각각 따로 고를 수 있다
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based
  const [openPicker, setOpenPicker] = useState<"year" | "month" | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 누적 통계 카드 — "전체" 또는 특정 연도로 필터링
  const [statsYear, setStatsYear] = useState<number | "all">("all");

  // 프로필 사진 — data URL을 로컬에 저장해 다음 방문에도 유지
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setPhoto(localStorage.getItem(PHOTO_KEY));
    } catch {
      /* 접근 불가/손상된 데이터는 무시 */
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      try {
        localStorage.setItem(PHOTO_KEY, dataUrl);
      } catch {
        /* 저장 공간 부족 등은 무시 — 화면에는 이미 반영됨 */
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!openPicker) return;
    const onOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpenPicker(null);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [openPicker]);

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const years = availableYears(store);
  const yearOptions = Array.from(
    new Set([...years, ...Array.from({ length: 8 }, (_, i) => today.getFullYear() - 6 + i)]),
  ).sort((a, b) => b - a);

  const sum = totals(store, statsYear === "all" ? undefined : statsYear);
  const week = lastDays(store, 7);
  const yesterdayUsed = week[week.length - 2]?.used ?? 0;
  const todayUsed = getDay(store, todayKey).used;
  const maxBar = Math.max(...week.map((d) => d.used), 1);

  // 어제 대비 메시지
  const diffPercent =
    yesterdayUsed > 0 ? Math.round(Math.abs(1 - todayUsed / yesterdayUsed) * 100) : 0;
  const lessThanYesterday = todayUsed <= yesterdayUsed;

  // 보고 있는 달의 사용량 → 2L 생수병 환산 (기획서 문구)
  const bottles = Math.max(1, Math.round(monthTotal(store, new Date(viewYear, viewMonth, 1)) / 2000));

  // 달력 그리드 — 몇 주짜리 달이든(5주/6주) 카드 높이가 흔들리지 않도록 항상 6주(42칸)로 고정한다
  const first = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length < 42) cells.push(null);

  const selected = getDay(store, selectedKey);
  const isSelectedToday = selectedKey === todayKey;

  // 선택한 날짜에 "남은" 냉각수량 — 사용량이 아니라 오늘 더 쓸 수 있는 양을 보여준다
  const remaining = Math.max(DAILY_LIMIT - selected.used, 0);
  const remainingPercent = Math.round((remaining / DAILY_LIMIT) * 100);

  return (
    <div className="absolute left-[140px] top-[60px] flex h-[960px] w-[1640px] flex-col justify-center p-[24px]">
      <h2 className="fade-up shrink-0 text-[20px] font-semibold tracking-[-0.9px] text-white">
        MY PROFILE
      </h2>

      {/* 좌측(프로필+통계)은 세로로 꽉 채우고, 우측은 얇은 사용량 바 + 달력/그래프 */}
      <div className="mt-[16px] grid h-[680px] shrink-0 grid-cols-[280px_1fr] gap-[16px]">
        <div className="flex min-h-0 flex-col gap-[16px]">
          <Card className="flex flex-col items-center justify-center gap-[12px]" delay={0}>
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="프로필 사진 변경"
                className="flex size-[100px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#3a3d40] transition-opacity hover:opacity-85"
              >
                {photo ? (
                  <img src={photo} alt="" className="size-full object-cover" />
                ) : (
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#9a9da1" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="프로필 사진 업로드"
                className="absolute bottom-0 right-0 flex size-[28px] cursor-pointer items-center justify-center rounded-full border-[2.5px] border-[#242628] bg-main text-white transition-transform hover:scale-110"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="text-center">
              <p className="text-[22px] font-semibold tracking-[-1px] text-white">김망고</p>
              <p className="mt-[4px] text-[15px] text-label">sjlkd9972@naver.com</p>
            </div>
          </Card>

          {/* 누적 통계 — 좌측 열 남은 높이를 채우고 항목을 고르게 편다 */}
          <Card className="flex min-h-0 flex-1 flex-col gap-[16px]" delay={120}>
              {/* 연도 필터 — 전체 또는 특정 연도의 누적치만 모아보기 */}
              <div className="chat-scroll-x -mx-[4px] flex shrink-0 gap-[6px] overflow-x-auto px-[4px]">
                <button
                  type="button"
                  onClick={() => setStatsYear("all")}
                  className={`shrink-0 cursor-pointer rounded-full px-[11px] py-[4px] text-[15px] tracking-[-0.6px] transition-colors ${
                    statsYear === "all" ? "bg-main text-white" : "text-label hover:bg-white/10"
                  }`}
                >
                  전체
                </button>
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setStatsYear(y)}
                    className={`shrink-0 cursor-pointer rounded-full px-[11px] py-[4px] text-[15px] tracking-[-0.6px] transition-colors ${
                      statsYear === y ? "bg-main text-white" : "text-label hover:bg-white/10"
                    }`}
                  >
                    {y}년
                  </button>
                ))}
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-evenly">
              {[
                { label: "누적 사용량", value: `${sum.used.toLocaleString()} ml`, highlight: true },
                { label: "비워낸 컵", value: `${sum.cupsEmptied} 개` },
                { label: "누적 채팅", value: `${sum.chats.toLocaleString()} 회` },
                { label: "프롬프트 도우미", value: `${sum.helperUses.toLocaleString()} 회` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-[16px] tracking-[-0.7px] text-label">{row.label}</span>
                  <span
                    className={`text-[17px] font-semibold tracking-[-0.75px] ${
                      row.highlight ? "text-main" : "text-white"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
              </div>
            </Card>

          </div>

          {/* ---------- 우측 ---------- */}
          <div className="flex min-h-0 flex-col gap-[16px]">
            {/* 일일 냉각수 게이지 — 제목 / 남은양·한도 / 가로 바 / 캡션만 담은 얇은 카드 */}
            <Card className="shrink-0" delay={60}>
              <div key={selectedKey} className="fade-up">
                <div className="flex items-baseline justify-between">
                  <p className="text-[18px] font-medium tracking-[-0.8px] text-white">
                    {isSelectedToday ? "오늘 남은 냉각수량" : `${formatDateLabel(selectedKey)} 남은 냉각수량`}
                  </p>
                  <p className="text-[17px] tracking-[-0.75px] text-label">
                    <span className="font-semibold text-main">{remaining.toLocaleString()}</span>
                    /{DAILY_LIMIT.toLocaleString()}ml
                  </p>
                </div>
                <div className="relative mt-[12px] h-[10px] w-full rounded-full bg-[#3a3d40]">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full bg-main transition-[width] duration-500"
                    style={{ width: `${remainingPercent}%` }}
                  />
                  <div
                    className="absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full border-[4px] border-main bg-white transition-[left] duration-500"
                    style={{ left: `calc(${remainingPercent}% - 9px)` }}
                  />
                </div>
                <p className="mt-[10px] text-[15px] tracking-[-0.65px] text-label">
                  {isSelectedToday
                    ? "오늘 하루 더 쓸 수 있는 냉각수량이에요"
                    : `채팅 ${selected.chats}회 · 프롬프트 도우미 ${selected.helperUses}회`}
                </p>
              </div>
            </Card>

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-[16px]">
              {/* 월 달력 — 연도/월을 각각 따로 선택할 수 있다 */}
              <Card className="flex flex-col" delay={180}>
                <p className="text-[17px] leading-[1.6] tracking-[-0.75px] text-white">
                  {viewMonth + 1}월에는{" "}
                  <span className="font-semibold text-main">2L 생수병 {bottles}번</span>을 사용했어요
                  <br />
                  효율적인 사용을 하시는군요!
                </p>
                <div className="mt-[16px] grid grid-cols-7 gap-y-[4px] text-center">
                  <div className="relative col-span-7 mb-[6px] flex items-center justify-center gap-[6px]" ref={pickerRef}>
                    <button
                      type="button"
                      onClick={() => goMonth(-1)}
                      aria-label="이전 달"
                      className="cursor-pointer rounded-full p-[3px] text-label/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <CaretDown className="size-[11px] rotate-90" />
                    </button>

                    {/* 연도 선택 — 독립된 드롭다운 */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenPicker((p) => (p === "year" ? null : "year"))}
                        className={`cursor-pointer rounded-[6px] px-[6px] py-[2px] text-[16px] font-medium transition-colors hover:bg-white/10 ${
                          openPicker === "year" ? "bg-white/10 text-white" : "text-white"
                        }`}
                      >
                        {viewYear}년
                      </button>
                      {openPicker === "year" && (
                        <div className="fade-up absolute left-1/2 top-full z-20 mt-[8px] max-h-[188px] w-[104px] -translate-x-1/2 overflow-y-auto rounded-[10px] border border-white/10 bg-[#2c2e31] p-[6px] shadow-lg">
                          {yearOptions.map((y) => (
                            <button
                              key={y}
                              type="button"
                              onClick={() => {
                                setViewYear(y);
                                setOpenPicker(null);
                              }}
                              className={`block w-full cursor-pointer rounded-[6px] px-[8px] py-[6px] text-center text-[15px] transition-colors ${
                                y === viewYear ? "bg-main font-semibold text-white" : "text-white/80 hover:bg-white/10"
                              }`}
                            >
                              {y}년
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 월 선택 — 독립된 드롭다운 */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenPicker((p) => (p === "month" ? null : "month"))}
                        className={`cursor-pointer rounded-[6px] px-[6px] py-[2px] text-[16px] font-medium transition-colors hover:bg-white/10 ${
                          openPicker === "month" ? "bg-white/10 text-white" : "text-white"
                        }`}
                      >
                        {viewMonth + 1}월
                      </button>
                      {openPicker === "month" && (
                        <div className="fade-up absolute left-1/2 top-full z-20 mt-[8px] w-[172px] -translate-x-1/2 rounded-[10px] border border-white/10 bg-[#2c2e31] p-[10px] shadow-lg">
                          <div className="grid grid-cols-4 gap-[6px]">
                            {MONTHS.map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  setViewMonth(m);
                                  setOpenPicker(null);
                                }}
                                className={`cursor-pointer rounded-[6px] py-[6px] text-[14px] transition-colors ${
                                  m === viewMonth
                                    ? "bg-main font-semibold text-white"
                                    : "text-white/80 hover:bg-white/10"
                                }`}
                              >
                                {m + 1}월
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => goMonth(1)}
                      aria-label="다음 달"
                      className="cursor-pointer rounded-full p-[3px] text-label/70 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <CaretDown className="size-[11px] -rotate-90" />
                    </button>
                  </div>
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="text-[14px] text-label/70">
                      {d}
                    </span>
                  ))}
                </div>
                {/* 카드 남은 높이를 주(週) 행들이 균등하게 나눠 갖게 해 아래쪽이 비어 보이지 않도록 한다 */}
                <div className="mt-[14px] grid flex-1 auto-rows-fr grid-cols-7 text-center">
                  {cells.map((day, i) => {
                    if (day === null) return <span key={`e${i}`} />;
                    const key = dateKey(new Date(viewYear, viewMonth, day));
                    const used = getDay(store, key).used;
                    const isToday = key === todayKey;
                    const isSelected = key === selectedKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedKey(key)}
                        className="flex cursor-pointer flex-col items-center justify-center gap-[2px]"
                      >
                        <span
                          className={`flex size-[26px] items-center justify-center rounded-full text-[15px] transition-all duration-150 hover:scale-110 ${
                            isSelected
                              ? "bg-main font-semibold text-white"
                              : isToday
                                ? "font-semibold text-main ring-1 ring-main"
                                : "text-white/85 hover:bg-white/10"
                          }`}
                        >
                          {day}
                        </span>
                        <span className="h-[14px] text-[12px] leading-[14px] text-main">
                          {used > 0 ? used.toLocaleString() : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* 주간 막대그래프 + 격려 메시지 */}
              <Card className="flex flex-col" delay={240}>
                <p className="text-[17px] tracking-[-0.75px] text-white">
                  어제보다 약{" "}
                  <span className="font-semibold text-main">
                    {diffPercent}% {lessThanYesterday ? "덜" : "더"}
                  </span>{" "}
                  사용했어요
                </p>
                <div className="mt-[16px] flex flex-1 items-end justify-between gap-[14px] px-[8px]">
                  {week.map((d, i) => {
                    const isToday = i === week.length - 1;
                    const isSelected = d.key === selectedKey;
                    const h = Math.max((d.used / maxBar) * 200, d.used > 0 ? 8 : 2);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setSelectedKey(d.key)}
                        className="flex flex-1 cursor-pointer flex-col items-center gap-[8px]"
                      >
                        <span className="text-[14px] text-label">{d.used.toLocaleString()}</span>
                        <div
                          className={`w-full max-w-[44px] rounded-[6px] transition-all duration-300 hover:opacity-80 ${
                            isSelected ? "bg-main" : isToday ? "bg-main/70" : "bg-[#4a4d50]"
                          }`}
                          style={{ height: h }}
                        />
                        <span
                          className={`text-[14px] ${isSelected ? "text-main" : "text-label/70"}`}
                        >
                          {isToday ? "오늘" : d.key.slice(8)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-[16px] shrink-0 rounded-[10px] bg-white/[0.04] px-[12px] py-[10px] text-[15px] leading-[1.5] tracking-[-0.6px] text-label">
                  {encouragement(lessThanYesterday, diffPercent)}
                </p>
              </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
