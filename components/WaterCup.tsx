"use client";

import { DAILY_LIMIT, getPalette } from "@/lib/water";

/**
 * 냉각수 잔여량 물컵 오브제 (PRD §2-3, §5-1)
 * Figma 1단계 렌더(물컵-01)를 SVG로 재현 — 잔여량에 따라 수위·색상이
 * 12단계로 변하고, 그림자가 시계처럼 단계에 비례해 회전한다.
 */
export default function WaterCup({
  remaining,
  stage,
}: {
  remaining: number;
  stage: number;
}) {
  const palette = getPalette(stage);
  const fraction = Math.max(0, Math.min(1, remaining / DAILY_LIMIT));

  // 컵 지오메트리 (viewBox 800×800, Figma 배치 기준)
  const CX = 400;
  const RX = 106; // 컵 반지름
  const RY = 25; // 타원 눌림
  const TOP_Y = 218; // 컵 입구 중심
  const BOT_Y = 552; // 컵 바닥 중심
  const WATER_TOP_FULL = TOP_Y + 14; // 가득 찼을 때 수면
  const WATER_RX = RX - 7;
  const WATER_RY = RY - 3;

  const waterY = BOT_Y - (BOT_Y - WATER_TOP_FULL) * fraction;
  const empty = fraction <= 0.001;

  // 단계에 비례해 컵 그림자가 시계 방향으로 회전 (PRD §6-2)
  const angle = ((stage - 1) / 12) * Math.PI * 2 - Math.PI / 2;
  const shadowDx = Math.cos(angle) * 70;
  const shadowDy = Math.sin(angle) * 16;

  const transition = { transition: "all 0.9s cubic-bezier(0.4, 0, 0.2, 1)" } as const;

  return (
    <svg viewBox="0 0 800 800" width={800} height={800} aria-label={`냉각수 잔여량 ${remaining}mL`}>
      <defs>
        {/* 물 기둥 그라디언트 */}
        <linearGradient id="waterBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.top} style={{ transition: "stop-color .9s" }} />
          <stop offset="0.55" stopColor={palette.mid} style={{ transition: "stop-color .9s" }} />
          <stop offset="0.86" stopColor={palette.deep} style={{ transition: "stop-color .9s" }} />
          <stop offset="1" stopColor={palette.glow} style={{ transition: "stop-color .9s" }} />
        </linearGradient>
        {/* 바닥 글로우 */}
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={palette.glow} stopOpacity="0.95" style={{ transition: "stop-color .9s" }} />
          <stop offset="1" stopColor={palette.glow} stopOpacity="0" style={{ transition: "stop-color .9s" }} />
        </radialGradient>
        {/* 컵 입구 림 */}
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8e6da" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#8d8c86" stopOpacity="0.55" />
          <stop offset="1" stopColor="#d8d2b8" stopOpacity="0.8" />
        </linearGradient>
        {/* 유리 측면 하이라이트 */}
        <linearGradient id="glassSide" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.12" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="0.88" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.24" />
        </linearGradient>
        {/* 물 표면 */}
        <linearGradient id="surface" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.surface} style={{ transition: "stop-color .9s" }} />
          <stop offset="1" stopColor={palette.mid} style={{ transition: "stop-color .9s" }} />
        </linearGradient>
        <linearGradient id="streak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.25" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="0.85" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="glowBlur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        {/* 물 클리핑: 수면부터 바닥까지 */}
        <clipPath id="waterClip">
          <path
            d={`M ${CX - WATER_RX} ${WATER_TOP_FULL}
                L ${CX - WATER_RX} ${BOT_Y}
                A ${WATER_RX} ${WATER_RY + 4} 0 0 0 ${CX + WATER_RX} ${BOT_Y}
                L ${CX + WATER_RX} ${WATER_TOP_FULL}
                Z`}
          />
        </clipPath>
      </defs>

      {/* 단계에 따라 도는 그림자 */}
      <ellipse
        cx={CX + shadowDx}
        cy={BOT_Y + 34 + shadowDy}
        rx={150}
        ry={30}
        fill="#000"
        opacity={empty ? 0.35 : 0.55}
        filter="url(#softBlur)"
        style={transition}
      />

      {/* 물: 클립 안에서 y가 수위에 따라 이동 */}
      <g clipPath="url(#waterClip)">
        <rect
          x={CX - WATER_RX}
          y={waterY}
          width={WATER_RX * 2}
          height={BOT_Y + WATER_RY + 8 - waterY}
          fill="url(#waterBody)"
          opacity={empty ? 0 : 1}
          style={transition}
        />
        {/* 바닥 글로우 */}
        <ellipse
          cx={CX}
          cy={BOT_Y - 4}
          rx={WATER_RX * 0.96}
          ry={30}
          fill="url(#glow)"
          opacity={empty ? 0 : 0.9}
          style={transition}
        />
        {/* 세로 하이라이트 줄기 */}
        {[-62, -24, 26, 64].map((dx, i) => (
          <rect
            key={i}
            x={CX + dx}
            y={waterY + 26}
            width={i % 2 === 0 ? 2.4 : 3.2}
            height={BOT_Y - waterY - 40}
            fill="url(#streak)"
            opacity={empty ? 0 : 0.5}
            style={transition}
          />
        ))}
      </g>

      {/* 수면 타원 */}
      <ellipse
        cx={CX}
        cy={waterY}
        rx={WATER_RX}
        ry={WATER_RY}
        fill="url(#surface)"
        opacity={empty ? 0 : 1}
        style={transition}
      />
      {/* 수면 반사광 */}
      <ellipse
        cx={CX - 20}
        cy={waterY - 2}
        rx={WATER_RX * 0.62}
        ry={WATER_RY * 0.5}
        fill="#ffffff"
        opacity={empty ? 0 : 0.14}
        style={transition}
      />

      {/* 유리컵 몸통 (빈 부분 포함, 항상 표시) */}
      <path
        d={`M ${CX - RX} ${TOP_Y}
            L ${CX - RX} ${BOT_Y}
            A ${RX} ${RY + 5} 0 0 0 ${CX + RX} ${BOT_Y}
            L ${CX + RX} ${TOP_Y}`}
        fill="url(#glassSide)"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="2"
      />
      {/* 바닥 글로우 림 */}
      <path
        d={`M ${CX - RX} ${BOT_Y}
            A ${RX} ${RY + 5} 0 0 0 ${CX + RX} ${BOT_Y}`}
        fill="none"
        stroke={palette.glow}
        strokeWidth="4"
        opacity={empty ? 0.15 : 0.75}
        filter="url(#glowBlur)"
        style={transition}
      />

      {/* 컵 입구 림 */}
      <ellipse cx={CX} cy={TOP_Y} rx={RX} ry={RY} fill="none" stroke="url(#rim)" strokeWidth="3" />
      <ellipse
        cx={CX}
        cy={TOP_Y}
        rx={RX - 4}
        ry={RY - 2}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="2"
      />
    </svg>
  );
}
