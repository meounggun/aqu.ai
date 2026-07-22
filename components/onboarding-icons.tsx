/* 온보딩 슬라이드용 라인 아이콘 — Figma 인포 시리즈 재현 (흰색 얇은 라인) */

const S = { fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Prompt — 겹친 말풍선 두 개 */
export function PromptIcon() {
  return (
    <svg width="66" height="58" viewBox="0 0 66 58">
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
      <rect x="19" y="24" width="8" height="52" rx="4" fill="#e44a40" />
      <circle cx="23" cy="90" r="12" fill="#e44a40" />
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
      <path d="M190.37,170.62A86.27,86.27,0,0,0,222,102c-1-44.68-36.76-81.51-81.34-83.86A86,86,0,0,0,50,102.51l-22.69,43.6c-.07.13-.13.26-.19.4a14,14,0,0,0,6.61,18l.18.09,24.08,11V208a14,14,0,0,0,14,14h48a6,6,0,0,0,0-12H72a2,2,0,0,1-2-2V171.81a6,6,0,0,0-3.5-5.46L39,153.78a2,2,0,0,1-.93-2.4l23.21-44.61A6,6,0,0,0,62,104a74.05,74.05,0,0,1,60-72.68V50.84a22,22,0,1,0,12,0V30.05c2-.05,4-.05,6,.06A74.29,74.29,0,0,1,206.63,82H184a6,6,0,0,0-4.61,2.16L152.94,115.9a22.06,22.06,0,1,0,9.21,7.69L186.81,94h22.5a72.44,72.44,0,0,1,.67,8.26A74.24,74.24,0,0,1,180.4,163.2a6,6,0,0,0-2.35,5.54l8,64A6,6,0,0,0,192,238a6.3,6.3,0,0,0,.75-.05,6,6,0,0,0,5.21-6.7ZM138,72a10,10,0,1,1-10-10A10,10,0,0,1,138,72Zm6,74a10,10,0,1,1,10-10A10,10,0,0,1,144,146Z" />
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

/** ArrowRight — CTA 버튼 화살표 (Figma ArrowRight, 36px) */
export function ArrowRightIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <path fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M7 18h22M20 8l10 10-10 10" />
    </svg>
  );
}
