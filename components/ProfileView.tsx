"use client";

/* MY PROFILE — 기획서 프로필 화면 스펙:
   일일 냉각수 게이지 / 누적 사용량·비워낸 컵·누적 채팅·도우미 횟수 / 월 달력 / 어제 대비 그래프 */

import { DAILY_LIMIT } from "@/lib/water";
import {
  type UsageStore,
  dateKey,
  getDay,
  lastDays,
  monthTotal,
  totals,
} from "@/lib/usage-store";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-[14px] bg-[#242628] p-[24px] ${className}`}>{children}</div>
  );
}

export default function ProfileView({ store }: { store: UsageStore }) {
  const today = new Date();
  const todayUsed = getDay(store, dateKey(today)).used;
  const sum = totals(store);
  const week = lastDays(store, 7);
  const yesterdayUsed = week[week.length - 2]?.used ?? 0;
  const maxBar = Math.max(...week.map((d) => d.used), 1);

  // 어제 대비 메시지
  const diffPercent =
    yesterdayUsed > 0 ? Math.round(Math.abs(1 - todayUsed / yesterdayUsed) * 100) : 0;
  const lessThanYesterday = todayUsed <= yesterdayUsed;

  // 이번 달 사용량 → 2L 생수병 환산 (기획서 문구)
  const month = today.getMonth() + 1;
  const bottles = Math.max(1, Math.round(monthTotal(store) / 2000));

  // 달력 그리드
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(first.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="absolute left-[140px] top-[60px] h-[940px] w-[1660px] rounded-[16px] border border-white/15 p-[36px]">
      <h2 className="text-[18px] font-semibold tracking-[-0.9px] text-white">MY PROFILE</h2>

      <div className="mt-[24px] grid grid-cols-[300px_1fr] gap-[24px]">
        {/* ---------- 좌측: 프로필 카드 ---------- */}
        <div className="flex flex-col gap-[16px]">
          <Card className="flex flex-col items-center gap-[14px] pb-[28px]">
            <div className="flex size-[120px] items-center justify-center rounded-full bg-[#3a3d40]">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#9a9da1" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[20px] font-semibold tracking-[-1px] text-white">김망고</p>
              <p className="mt-[4px] text-[13px] text-label">sjlkd9972@naver.com</p>
            </div>
          </Card>

          <Card className="flex flex-col gap-[16px]">
            {[
              { label: "누적 사용량", value: `${sum.used.toLocaleString()} ml`, highlight: true },
              { label: "비워낸 컵", value: `${sum.cupsEmptied} 개` },
              { label: "누적 채팅", value: `${sum.chats.toLocaleString()} 회` },
              { label: "프롬프트 도우미", value: `${sum.helperUses.toLocaleString()} 회` },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-[14px] tracking-[-0.7px] text-label">{row.label}</span>
                <span
                  className={`text-[15px] font-semibold tracking-[-0.75px] ${
                    row.highlight ? "text-main" : "text-white"
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* ---------- 우측 ---------- */}
        <div className="flex flex-col gap-[24px]">
          {/* 일일 냉각수 사용량 게이지 */}
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-medium tracking-[-0.75px] text-white">일일 냉각수 사용량</p>
              <p className="text-[14px] text-label">
                <span className="font-semibold text-main">{todayUsed.toLocaleString()}</span>
                /{DAILY_LIMIT.toLocaleString()}ml
              </p>
            </div>
            <div className="relative mt-[14px] h-[6px] w-full rounded-full bg-[#3a3d40]">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-main transition-[width] duration-500"
                style={{ width: `${Math.min(todayUsed / DAILY_LIMIT, 1) * 100}%` }}
              />
              <div
                className="absolute top-1/2 size-[14px] -translate-y-1/2 rounded-full border-[3px] border-main bg-white transition-[left] duration-500"
                style={{ left: `calc(${Math.min(todayUsed / DAILY_LIMIT, 1) * 100}% - 7px)` }}
              />
            </div>
            <p className="mt-[10px] text-[12px] tracking-[-0.6px] text-label">
              오늘 하루 나의 냉각수량을 확인하세요
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-[24px]">
            {/* 월 달력 */}
            <Card>
              <p className="text-[15px] leading-[1.6] tracking-[-0.75px] text-white">
                {month}월에는 <span className="font-semibold text-main">2L 생수병 {bottles}번</span>을
                사용했어요
                <br />
                효율적인 사용을 하시는군요!
              </p>
              <div className="mt-[18px] grid grid-cols-7 gap-y-[10px] text-center">
                <p className="col-span-7 mb-[6px] text-[14px] font-medium text-white">
                  {today.getFullYear()}년 {month}월
                </p>
                {WEEKDAYS.map((d) => (
                  <span key={d} className="text-[11px] text-label/70">
                    {d}
                  </span>
                ))}
                {cells.map((day, i) => {
                  if (day === null) return <span key={`e${i}`} />;
                  const key = dateKey(new Date(today.getFullYear(), today.getMonth(), day));
                  const used = getDay(store, key).used;
                  const isToday = day === today.getDate();
                  return (
                    <div key={key} className="flex flex-col items-center gap-[2px]">
                      <span
                        className={`flex size-[26px] items-center justify-center rounded-full text-[12px] ${
                          isToday ? "bg-main font-semibold text-white" : "text-white/85"
                        }`}
                      >
                        {day}
                      </span>
                      <span className="h-[12px] text-[9px] text-main">
                        {used > 0 ? used.toLocaleString() : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 주간 막대그래프 */}
            <Card>
              <p className="text-[15px] tracking-[-0.75px] text-white">
                어제보다 약{" "}
                <span className="font-semibold text-main">
                  {diffPercent}% {lessThanYesterday ? "덜" : "더"}
                </span>{" "}
                사용했어요
              </p>
              <div className="mt-[24px] flex h-[300px] items-end justify-between gap-[14px] px-[8px]">
                {week.map((d, i) => {
                  const isToday = i === week.length - 1;
                  const h = Math.max((d.used / maxBar) * 240, d.used > 0 ? 8 : 2);
                  return (
                    <div key={d.key} className="flex flex-1 flex-col items-center gap-[8px]">
                      <span className="text-[11px] text-label">{d.used.toLocaleString()}</span>
                      <div
                        className={`w-full max-w-[44px] rounded-[6px] transition-[height] duration-500 ${
                          isToday ? "bg-main" : "bg-[#4a4d50]"
                        }`}
                        style={{ height: h }}
                      />
                      <span className="text-[11px] text-label/70">
                        {isToday ? "오늘" : d.key.slice(8)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
