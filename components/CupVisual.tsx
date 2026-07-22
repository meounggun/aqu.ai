"use client";

import { useEffect, useRef, useState } from "react";
import WaterCup from "@/components/WaterCup";

/** 단계별 전환 영상 — 현재는 1단계(가득 참) 이탈 시 재생할 영상만 보유 */
const STAGE_TRANSITION_VIDEO: Record<number, string> = {
  1: "/assets/cup/stage-1.mp4",
};

/**
 * 기본 화면(메인)에서는 정적 SVG 물컵을 그대로 유지한다.
 * 채팅을 보내 물 사용량이 반영되어 잔여량이 줄어드는 순간에만,
 * 직전 단계에 대응하는 영상을 한 번(루프 없이) 재생하고,
 * 끝나면 다시 SVG로 돌아와 그 상태를 유지한다.
 * 영상 가장자리는 방사형 마스크로 서서히 투명해져, 배경색이 실제 페이지와
 * 미세하게 달라도 경계 없이 자연스럽게 섞인다.
 */
export default function CupVisual({
  remaining,
  stage,
}: {
  remaining: number;
  stage: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevStageRef = useRef(stage);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // 잔여량이 줄어 단계가 진행됐고, 직전 단계용 전환 영상이 있으면 재생 대상으로 지정
  useEffect(() => {
    const prevStage = prevStageRef.current;
    prevStageRef.current = stage;

    if (stage > prevStage) {
      const src = STAGE_TRANSITION_VIDEO[prevStage];
      if (src) setVideoSrc(src);
    }
  }, [stage]);

  // video 엘리먼트가 실제로 DOM에 마운트된 뒤(=videoSrc 렌더 반영 후) 재생 시작
  useEffect(() => {
    if (!videoSrc) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [videoSrc]);

  const playing = videoSrc !== null;

  return (
    <div className="relative size-full">
      <div
        className="absolute inset-0 transition-opacity duration-500 ease-out"
        style={{ opacity: playing ? 0 : 1 }}
      >
        <WaterCup remaining={remaining} stage={stage} />
      </div>
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          onEnded={() => setVideoSrc(null)}
          className="absolute inset-0 size-full object-contain transition-opacity duration-500 ease-out"
          style={{
            opacity: playing ? 1 : 0,
            maskImage: "radial-gradient(circle at 50% 55%, #000 58%, transparent 82%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 55%, #000 58%, transparent 82%)",
          }}
        />
      )}
    </div>
  );
}
