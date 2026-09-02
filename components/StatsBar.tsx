/* 하단 우측 통계 영역 — 실시간 물 사용량 / 오늘의 냉각수 잔여량 (Figma 228:327~349) */
/* eslint-disable @next/next/no-img-element */

import type { UsageFlag } from "@/lib/water";

const SLIDER_MAX_ML = 500; // 슬라이더가 가득 차는 기준량

export default function StatsBar({
  liveUsage,
  remaining,
  flags = [],
  savingPercent = 0,
}: {
  liveUsage: number;
  remaining: number;
  flags?: UsageFlag[];
  savingPercent?: number;
}) {
  const fillPx = Math.min(liveUsage / SLIDER_MAX_ML, 1) * 158;

  return (
    <>
      {/* 실시간 물 사용량 */}
      <p className="absolute left-[1141px] top-[893px] w-[143px] text-[14px] tracking-[-0.7px] text-label [text-shadow:0_4px_4px_rgba(0,0,0,0.25)]">
        실시간 물 사용량
      </p>
      <div className="absolute left-[1141px] top-[917px] flex items-end whitespace-nowrap">
        <span className="text-[45px] font-light leading-[1.21] tracking-[-2.25px] text-main">
          {liveUsage.toLocaleString()}
        </span>
        <span className="ml-[5px] pb-[7px] text-[24px] font-thin text-label">ml</span>
      </div>
      {/* 슬라이더 */}
      <div className="absolute left-[1143px] top-[992px] h-[3px] w-[158px] rounded-[20px] bg-[#d9d9d9]" />
      <div
        className="absolute left-[1143px] top-[992px] h-[3px] rounded-[20px] bg-main transition-[width] duration-300"
        style={{ width: fillPx }}
      />
      <div
        className="absolute top-[989px] size-[9px] rounded-full bg-main transition-[left] duration-300"
        style={{ left: 1139 + fillPx }}
      />
      {/* 냉각수 증가 원인 / 절감 배지 (기획서 "불필요한 냉각수 증가 원인") */}
      {(flags.length > 0 || savingPercent > 0) && (
        <div className="absolute left-[1141px] top-[1003px] flex w-[180px] flex-wrap gap-[4px]">
          {flags.map((f) => (
            <span
              key={f.label}
              className="whitespace-nowrap rounded-[6px] bg-[#e04432]/20 px-[6px] py-[2px] text-[10px] tracking-[-0.5px] text-[#f36a55]"
            >
              {f.label} +{f.percent}%
            </span>
          ))}
          {savingPercent > 0 && (
            <span className="whitespace-nowrap rounded-[6px] bg-main/20 px-[6px] py-[2px] text-[10px] tracking-[-0.5px] text-main">
              도우미 절감 -{savingPercent}%
            </span>
          )}
        </div>
      )}

      {/* 구분선 — 두 항목 사이 정중앙 하나만 */}
      <div className="absolute left-[1463px] top-[892px] h-[114px] w-px bg-stroke/60" />

      {/* 오늘의 냉각수 잔여량 */}
      <p className="absolute left-[1509px] top-[893px] w-[160px] text-[14px] tracking-[-0.7px] text-label [text-shadow:0_4px_4px_rgba(0,0,0,0.25)]">
        오늘의 냉각수 잔여량
      </p>
      <div className="absolute left-[1509px] top-[917px] flex items-end whitespace-nowrap">
        <span className="text-[45px] font-light leading-[1.21] tracking-[-2.25px] text-white">
          {remaining.toLocaleString()}
        </span>
        <span className="ml-[5px] pb-[7px] text-[24px] font-thin text-label">ml</span>
      </div>
      <div className="absolute left-[1509px] top-[988px] flex items-center gap-[2.5px] whitespace-nowrap text-[12px] tracking-[-0.6px]">
        <span className="font-thin text-label">어제보다</span>
        <span className="font-bold text-main">18%</span>
        <span className="font-thin text-label">절약</span>
      </div>
    </>
  );
}
