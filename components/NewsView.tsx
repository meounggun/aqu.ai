/* 뉴스 — 기획서 "시민단체가 바라본 AI 데이터센터의 환경오염" 화면 */

const ARTICLES = [
  {
    tag: "보도자료",
    title: "AI 데이터센터 냉각수, 지역 상수원과 경쟁하다",
    summary:
      "대규모 AI 데이터센터가 들어선 지역에서 냉각수 취수량이 급증하며 지역사회 물 배분 갈등이 확산되고 있습니다.",
    source: "환경 시민단체 뉴스레터",
    accent: "#498aff",
  },
  {
    tag: "뉴스레터",
    title: "생성형 AI 질문 10~50개, 물 500mL를 마신다",
    summary:
      "연구에 따르면 GPT급 모델과의 대화 한 세션이 페트병 하나 분량의 담수를 소모합니다. 짧고 명확한 질문이 곧 절수입니다.",
    source: "AI 윤리 연구 네트워크",
    accent: "#37b581",
  },
  {
    tag: "리포트",
    title: "수도꼭지 뒤의 데이터센터 — 보이지 않는 물 발자국",
    summary:
      "전력뿐 아니라 물까지, AI 인프라의 환경 비용을 시민 관점에서 추적한 연간 리포트가 공개되었습니다.",
    source: "담수 보전 연대",
    accent: "#dcb93a",
  },
];

export default function NewsView() {
  return (
    <div className="absolute left-[169px] top-[120px] w-[1580px]">
      <h2 className="text-[40px] font-medium leading-[1.3] tracking-[-2px] text-white">
        시민단체가 바라본
        <br />
        AI 데이터센터의 환경오염
      </h2>
      <p className="mt-[16px] text-[15px] tracking-[-0.75px] text-label">
        AI의 환경·인권문제를 다루는 각종 시민단체의 뉴스레터 및 보도자료
      </p>

      <div className="mt-[48px] grid grid-cols-3 gap-[28px]">
        {ARTICLES.map((a) => (
          <article
            key={a.title}
            className="group cursor-pointer overflow-hidden rounded-[16px] bg-[#242628] transition-transform hover:-translate-y-[4px]"
          >
            <div
              className="h-[180px] w-full"
              style={{
                background: `linear-gradient(135deg, ${a.accent}33 0%, ${a.accent}0d 55%, transparent 100%), #1f2124`,
              }}
            >
              <span
                className="ml-[20px] mt-[20px] inline-block rounded-[8px] px-[10px] py-[4px] text-[11px] font-semibold tracking-[-0.55px]"
                style={{ background: `${a.accent}2b`, color: a.accent }}
              >
                {a.tag}
              </span>
            </div>
            <div className="p-[24px]">
              <h3 className="text-[18px] font-semibold leading-[1.4] tracking-[-0.9px] text-white">
                {a.title}
              </h3>
              <p className="mt-[12px] text-[13px] leading-[1.6] tracking-[-0.65px] text-label">
                {a.summary}
              </p>
              <p className="mt-[18px] text-[12px] tracking-[-0.6px] text-label/70">{a.source}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-[32px] text-[12px] tracking-[-0.6px] text-label/60">
        * 데모 콘텐츠입니다. 실제 서비스에서는 환경 단체 사이트로 연결됩니다.
      </p>
    </div>
  );
}
