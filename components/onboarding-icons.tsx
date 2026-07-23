/* 온보딩 슬라이드용 라인 아이콘 — Figma 인포 시리즈 재현 (흰색 얇은 라인) */

const S = { fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Prompt — 겹친 말풍선 두 개 */
export function PromptIcon() {
  return (
    <svg width="109" height="96" viewBox="0 0 66 58">
      <path {...S} d="M6 4h40a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H24l-9 8v-8H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z" />
      <path {...S} fill="#1b1d1f" d="M28 20h32a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4h-7v7l-8-7H28a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z" />
    </svg>
  );
}

/** AI Processing — 반도체 칩 (핀 + AI) */
export function ChipIcon() {
  const pins = [0, 1, 2, 3];
  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      {pins.map((i) => {
        const x = 34 + i * 15;
        return (
          <g key={i} {...S}>
            <line x1={x} y1="10" x2={x} y2="22" />
            <line x1={x} y1="90" x2={x} y2="102" />
          </g>
        );
      })}
      {pins.map((i) => {
        const y = 34 + i * 15;
        return (
          <g key={`h${i}`} {...S}>
            <line x1="10" y1={y} x2="22" y2={y} />
            <line x1="90" y1={y} x2="102" y2={y} />
          </g>
        );
      })}
      <rect {...S} x="22" y="22" width="68" height="68" rx="6" />
      <text
        x="56"
        y="66"
        textAnchor="middle"
        fill="#fff"
        style={{ fontSize: 30, fontWeight: 500, fontFamily: "var(--font-inter)" }}
      >
        AI
      </text>
    </svg>
  );
}

/** Heat — 온도계 (빨간 눈금/전구) */
export function ThermoIcon() {
  return (
    <svg width="46" height="112" viewBox="0 0 46 112">
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        d="M16 16a7 7 0 0 1 14 0v54a15 15 0 1 1-14 0V16Z"
      />
      <rect x="19" y="24" width="8" height="50" rx="4" fill="#e44a40" />
      <circle cx="23" cy="83" r="10" fill="#e44a40" />
    </svg>
  );
}

/** Cooling — 눈송이 */
export function SnowflakeIcon() {
  const arms = [0, 60, 120, 180, 240, 300];
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <g {...S} transform="translate(48 48)">
        {arms.map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1="0" y1="0" x2="0" y2="-42" />
            <line x1="0" y1="-14" x2="-9" y2="-23" />
            <line x1="0" y1="-14" x2="9" y2="-23" />
            <line x1="0" y1="-28" x2="-8" y2="-36" />
            <line x1="0" y1="-28" x2="8" y2="-36" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Disappear — 증발(위 물결) + 담수(아래 파란 물결) */
export function EvaporateIcon() {
  return (
    <svg width="90" height="120" viewBox="0 0 90 120">
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        {[18, 34, 50, 66].map((x) => (
          <path
            key={x}
            stroke="#fff"
            d={`M${x} 58 q-6 -10 0 -20 q6 -10 0 -20`}
          />
        ))}
        <path stroke="#498aff" d="M8 82 q10 -8 20 0 t20 0 t20 0 t14 0" />
        <path stroke="#498aff" d="M8 98 q10 -8 20 0 t20 0 t20 0 t14 0" />
      </g>
    </svg>
  );
}

/** HeadCircuit — 옆모습 머리 + 회로 (Phosphor HeadCircuit) */
export function HeadCircuitIcon() {
  return (
    <svg width="112" height="112" viewBox="0 0 256 256" fill="#fff">
      <path d="M188.25,169.77A84.3,84.3,0,0,0,220,102c-1-43.64-35.9-79.62-79.45-81.91A84,84,0,0,0,52,103L29.1,147c-.05.09-.09.18-.13.27a12,12,0,0,0,5.66,15.46l.13.06L60,174.38V208a12,12,0,0,0,12,12h48a4,4,0,0,0,0-8H72a4,4,0,0,1-4-4V171.81a4,4,0,0,0-2.34-3.64l-27.5-12.59a4,4,0,0,1-1.88-5l23.27-44.72A4.11,4.11,0,0,0,60,104a76,76,0,0,1,64-75V52.4a20,20,0,1,0,8,0V28.11a78.35,78.35,0,0,1,8.11,0c33.13,1.74,60.72,25,69.2,55.89H184a4,4,0,0,0-3.07,1.44l-27.46,33a20.12,20.12,0,1,0,6.13,5.13L185.87,92H211a75.9,75.9,0,0,1-29.44,72.8,4,4,0,0,0-1.57,3.7l8,64a4,4,0,0,0,4,3.5l.5,0A4,4,0,0,0,196,231.5ZM140,72a12,12,0,1,1-12-12A12,12,0,0,1,140,72Zm4,76a12,12,0,1,1,12-12A12,12,0,0,1,144,148Z" />
    </svg>
  );
}

/** CaretDown — 아래 방향 쉐브론 */
export function CaretDown({ className = "" }: { className?: string }) {
  return (
    <svg width="27" height="27" viewBox="0 0 27 27" className={className}>
      <path fill="none" stroke="#e9e9e9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="M6 10l7.5 7.5L21 10" />
    </svg>
  );
}

/** ArrowRight — CTA 버튼 화살표 (Figma ArrowRight, 기본 36px) */
export function ArrowRightIcon({ className = "size-[36px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36">
      <path fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M7 18h22M20 8l10 10-10 10" />
    </svg>
  );
}
