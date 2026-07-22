/* 우리에 대하여 — 기획서 BX 설계 스토리 (에너지 소모 자각 → 스스로 조절 → 환경 기여 보람) */

const STEPS = [
  {
    no: "1",
    title: "에너지 소모 인식 및 자각",
    body: "사용할 때 줄어드는 물의 양과 흘러가는 시간을 통해 '내가 쓰는 프롬프트가 자원을 소모하는구나'를 자각하도록 돕습니다.",
  },
  {
    no: "2",
    title: "주체적으로 사용 조절",
    body: "하루에 할당된 물의 양을 다 쓰면 사용하지 못하도록 설계해, 사용자가 스스로 물의 양을 조절하며 프롬프트 도우미를 사용하게 됩니다.",
  },
  {
    no: "3",
    title: "환경에 기여했다는 건강한 보람",
    body: "AI 데이터센터와 관련된 환경단체 소식과 연계하고, 절약 기록을 확인하며 지속적인 절수 행동을 유도합니다.",
  },
];

export default function AboutView() {
  return (
    <div className="absolute left-[169px] top-[120px] w-[1580px]">
      <div className="flex items-center gap-[14px]">
        <svg width="26" height="32" viewBox="0 0 20 26" fill="none">
          <path
            d="M10 1C10 1 2 11 2 17a8 8 0 0 0 16 0C18 11 10 1 10 1Z"
            stroke="#498aff"
            strokeWidth="1.6"
          />
        </svg>
        <h2 className="text-[40px] font-medium tracking-[-2px] text-white">우리에 대하여</h2>
      </div>

      <p className="mt-[28px] max-w-[820px] text-[17px] leading-[1.7] tracking-[-0.85px] text-white/85">
        AQU.AI는 라틴어 <span className="text-main">AQUA(물)</span>와{" "}
        <span className="text-main">AI(인공지능)</span>를 결합한 이름입니다. 추상적인 냉각수
        사용량과 담수 문제를 친숙한 &lsquo;일상의 한 잔&rsquo;으로 연결해, 질문의 무게를 줄여
        자연의 시간을 늦추는 일을 함께합니다.
      </p>

      <div className="mt-[56px] grid grid-cols-3 gap-[28px]">
        {STEPS.map((s) => (
          <div key={s.no} className="rounded-[16px] bg-[#242628] p-[28px]">
            <span className="flex size-[40px] items-center justify-center rounded-full bg-main/20 text-[18px] font-semibold text-main">
              {s.no}
            </span>
            <h3 className="mt-[20px] text-[19px] font-semibold tracking-[-0.95px] text-white">
              {s.title}
            </h3>
            <p className="mt-[12px] text-[14px] leading-[1.7] tracking-[-0.7px] text-label">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      <blockquote className="mt-[64px] max-w-[640px] font-serif-kr text-[20px] leading-[1.7] tracking-[-1px] text-white/90">
        &ldquo;우리가 AI에게 던지는 무심한 질문들은 결국 환경의 시간을 가속하는 행위와 같지
        않을까요?&rdquo;
      </blockquote>
    </div>
  );
}
