"use client";

/* 모바일 프로필 — 세로 스택. 프로필/통계 카드 · 선택 게이지 · 년월 선택 달력 · 날짜별 기록 · 주간 그래프 */

import { useEffect, useRef, useState } from "react";
import { DAILY_LIMIT } from "@/lib/water";
import {
  type UsageStore,
  availableYears,
  dateKey,
  getDay,
  historyList,
  lastDays,
  monthTotal,
  totals,
} from "@/lib/usage-store";
import { CaretDown } from "@/components/onboarding-icons";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const PHOTO_KEY = "aqu-profile-photo";

function formatDateLabel(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(key).getDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

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

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-[14px] bg-[#242628] p-[18px] ${className}`}>{children}</div>;
}

export default function MobileProfile({ store }: { store: UsageStore }) {
  const today = new Date();
  const todayKey = dateKey(today);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [openPicker, setOpenPicker] = useState<"year" | "month" | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [statsYear, setStatsYear] = useState<number | "all">("all");

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
        /* 저장 공간 부족 등은 무시 */
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    if (!openPicker) return;
    const onOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpenPicker(null);
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
  const diffPercent =
    yesterdayUsed > 0 ? Math.round(Math.abs(1 - todayUsed / yesterdayUsed) * 100) : 0;
  const lessThanYesterday = todayUsed <= yesterdayUsed;
  const bottles = Math.max(1, Math.round(monthTotal(store, new Date(viewYear, viewMonth, 1)) / 2000));

  const first = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const history = historyList(store);
  const selected = getDay(store, selectedKey);
  const isSelectedToday = selectedKey === todayKey;
  const remaining = Math.max(DAILY_LIMIT - selected.used, 0);
  const remainingPercent = Math.round((remaining / DAILY_LIMIT) * 100);

  return (
    <div className="flex flex-col gap-[16px] px-[16px] py-[18px]">
      {/* 프로필 카드 */}
      <Card className="flex items-center gap-[16px]">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="프로필 사진 변경"
            className="flex size-[64px] items-center justify-center overflow-hidden rounded-full bg-[#3a3d40]"
          >
            {photo ? (
              <img src={photo} alt="" className="size-full object-cover" />
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9a9da1" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="프로필 사진 업로드"
            className="absolute bottom-0 right-0 flex size-[22px] items-center justify-center rounded-full border-2 border-[#242628] bg-main text-white"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h3l2-3h8l2 3h3v13H3z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
        <div>
          <p className="text-[20px] font-semibold tracking-[-0.9px] text-white">김망고</p>
          <p className="mt-[2px] text-[15px] text-label">sjlkd9972@naver.com</p>
        </div>
      </Card>

      {/* 연도 필터 */}
      <div className="chat-scroll-x flex gap-[6px] overflow-x-auto pb-[6px]">
        <button
          type="button"
          onClick={() => setStatsYear("all")}
          className={`shrink-0 rounded-full px-[12px] py-[5px] text-[15px] tracking-[-0.6px] transition-colors ${
            statsYear === "all" ? "bg-main text-white" : "bg-[#242628] text-label"
          }`}
        >
          전체
        </button>
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setStatsYear(y)}
            className={`shrink-0 rounded-full px-[12px] py-[5px] text-[15px] tracking-[-0.6px] transition-colors ${
              statsYear === y ? "bg-main text-white" : "bg-[#242628] text-label"
            }`}
          >
            {y}년
          </button>
        ))}
      </div>

      {/* 통계 2×2 */}
      <div className="grid grid-cols-2 gap-[10px]">
        {[
          { label: "누적 사용량", value: `${sum.used.toLocaleString()} ml`, highlight: true },
          { label: "비워낸 컵", value: `${sum.cupsEmptied} 개` },
          { label: "누적 채팅", value: `${sum.chats.toLocaleString()} 회` },
          { label: "프롬프트 도우미", value: `${sum.helperUses.toLocaleString()} 회` },
        ].map((row) => (
          <Card key={row.label} className="flex flex-col gap-[6px]">
            <span className="text-[15px] tracking-[-0.6px] text-label">{row.label}</span>
            <span
              className={`text-[19px] font-semibold tracking-[-0.85px] ${
                row.highlight ? "text-main" : "text-white"
              }`}
            >
              {row.value}
            </span>
          </Card>
        ))}
      </div>

      {/* 선택 날짜에 남은 냉각수량 게이지 — 크게 강조 */}
      <Card>
        <div key={selectedKey} className="fade-up">
          <div className="flex items-center justify-between">
            <p className="text-[17px] font-medium tracking-[-0.75px] text-white">
              {isSelectedToday ? "오늘 남은 냉각수량" : `${formatDateLabel(selectedKey)} 남은 냉각수량`}
            </p>
            <p className="text-[15px] text-label">한도 {DAILY_LIMIT.toLocaleString()}ml</p>
          </div>
          <div className="mt-[16px] flex items-end gap-[6px]">
            <span className="text-[38px] font-bold leading-none tracking-[-1.5px] text-white">
              {remaining.toLocaleString()}
            </span>
            <span className="pb-[4px] text-[17px] tracking-[-0.75px] text-label">ml 남음</span>
            <span className="ml-auto pb-[6px] text-[16px] font-semibold tracking-[-0.7px] text-main">
              {remainingPercent}%
            </span>
          </div>
          <div className="relative mt-[16px] h-[10px] w-full rounded-full bg-[#3a3d40]">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-main transition-[width] duration-500"
              style={{ width: `${remainingPercent}%` }}
            />
            <div
              className="absolute top-1/2 size-[17px] -translate-y-1/2 rounded-full border-[3.5px] border-main bg-white transition-[left] duration-500"
              style={{ left: `calc(${remainingPercent}% - 8.5px)` }}
            />
          </div>
          <p className="mt-[12px] text-[15px] tracking-[-0.6px] text-label">
            {isSelectedToday
              ? "오늘 하루 더 쓸 수 있는 냉각수량이에요"
              : `채팅 ${selected.chats}회 · 도우미 ${selected.helperUses}회`}
          </p>
        </div>
      </Card>

      {/* 달력 */}
      <Card>
        <p className="text-[16px] leading-[1.6] tracking-[-0.7px] text-white">
          {viewMonth + 1}월에는 <span className="font-semibold text-main">2L 생수병 {bottles}번</span>을
          사용했어요
        </p>
        <div className="relative mt-[16px] mb-[10px] flex items-center justify-center gap-[6px]" ref={pickerRef}>
          <button
            type="button"
            onClick={() => goMonth(-1)}
            aria-label="이전 달"
            className="rounded-full p-[3px] text-label/70 active:bg-white/10"
          >
            <CaretDown className="size-[12px] rotate-90" />
          </button>

          {/* 연도 선택 — 독립된 드롭다운 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenPicker((p) => (p === "year" ? null : "year"))}
              className={`rounded-[6px] px-[6px] py-[3px] text-[16px] font-medium active:bg-white/10 ${
                openPicker === "year" ? "bg-white/10 text-white" : "text-white"
              }`}
            >
              {viewYear}년
            </button>
            {openPicker === "year" && (
              <div className="fade-up absolute left-1/2 top-full z-20 mt-[8px] max-h-[176px] w-[96px] -translate-x-1/2 overflow-y-auto rounded-[10px] border border-white/10 bg-[#2c2e31] p-[6px] shadow-lg">
                {yearOptions.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewYear(y);
                      setOpenPicker(null);
                    }}
                    className={`block w-full rounded-[6px] px-[8px] py-[6px] text-center text-[15px] ${
                      y === viewYear ? "bg-main font-semibold text-white" : "text-white/80 active:bg-white/10"
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
              className={`rounded-[6px] px-[6px] py-[3px] text-[16px] font-medium active:bg-white/10 ${
                openPicker === "month" ? "bg-white/10 text-white" : "text-white"
              }`}
            >
              {viewMonth + 1}월
            </button>
            {openPicker === "month" && (
              <div className="fade-up absolute left-1/2 top-full z-20 mt-[8px] w-[164px] -translate-x-1/2 rounded-[10px] border border-white/10 bg-[#2c2e31] p-[10px] shadow-lg">
                <div className="grid grid-cols-4 gap-[6px]">
                  {MONTHS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setViewMonth(m);
                        setOpenPicker(null);
                      }}
                      className={`rounded-[6px] py-[7px] text-[15px] ${
                        m === viewMonth ? "bg-main font-semibold text-white" : "text-white/80 active:bg-white/10"
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
            className="rounded-full p-[3px] text-label/70 active:bg-white/10"
          >
            <CaretDown className="size-[12px] -rotate-90" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-[8px] text-center">
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-[14px] text-label/70">
              {d}
            </span>
          ))}
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
                className="flex flex-col items-center gap-[2px]"
              >
                <span
                  className={`flex size-[28px] items-center justify-center rounded-full text-[15px] ${
                    isSelected
                      ? "bg-main font-semibold text-white"
                      : isToday
                        ? "font-semibold text-main ring-1 ring-main"
                        : "text-white/85"
                  }`}
                >
                  {day}
                </span>
                <span className="h-[13px] text-[11px] leading-[13px] text-main">
                  {used > 0 ? used.toLocaleString() : ""}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 주간 그래프 */}
      <Card>
        <p className="text-[16px] tracking-[-0.7px] text-white">
          어제보다 약{" "}
          <span className="font-semibold text-main">
            {diffPercent}% {lessThanYesterday ? "덜" : "더"}
          </span>{" "}
          사용했어요
        </p>
        <div className="mt-[16px] flex h-[150px] items-end justify-between gap-[8px]">
          {week.map((d, i) => {
            const isToday = i === week.length - 1;
            const isSelected = d.key === selectedKey;
            const h = Math.max((d.used / maxBar) * 116, d.used > 0 ? 6 : 2);
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedKey(d.key)}
                className="flex flex-1 flex-col items-center gap-[6px]"
              >
                <span className="text-[13px] text-label">{d.used.toLocaleString()}</span>
                <div
                  className={`w-full max-w-[34px] rounded-[5px] transition-all duration-300 ${
                    isSelected ? "bg-main" : isToday ? "bg-main/70" : "bg-[#4a4d50]"
                  }`}
                  style={{ height: h }}
                />
                <span className={`text-[13px] ${isSelected ? "text-main" : "text-label/70"}`}>
                  {isToday ? "오늘" : d.key.slice(8)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-[12px] rounded-[10px] bg-white/[0.04] px-[12px] py-[10px] text-[14px] leading-[1.5] tracking-[-0.55px] text-label">
          {encouragement(lessThanYesterday, diffPercent)}
        </p>
      </Card>

      {/* 날짜별 기록 */}
      <Card>
        <p className="text-[16px] font-medium tracking-[-0.7px] text-white">날짜별 사용 기록</p>
        <div className="mt-[16px] flex flex-col gap-[4px]">
          {history.length === 0 && <p className="py-[6px] text-[15px] text-label">아직 기록이 없어요</p>}
          {history.map((d) => {
            const isSelected = d.key === selectedKey;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => setSelectedKey(d.key)}
                className={`flex items-center justify-between rounded-[10px] px-[12px] py-[11px] text-left transition-colors ${
                  isSelected ? "bg-main/20 ring-1 ring-inset ring-main" : "bg-white/[0.03]"
                }`}
              >
                <div>
                  <p className="text-[15px] tracking-[-0.65px] text-white/90">{formatDateLabel(d.key)}</p>
                  <p className="mt-[2px] text-[14px] tracking-[-0.55px] text-label">
                    채팅 {d.chats}회 · 도우미 {d.helperUses}회
                  </p>
                </div>
                <span className={`text-[16px] font-semibold tracking-[-0.7px] ${isSelected ? "text-white" : "text-main"}`}>
                  {d.used.toLocaleString()}ml
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
