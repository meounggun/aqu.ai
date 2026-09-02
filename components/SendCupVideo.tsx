"use client";

import { useCallback, useEffect, useRef } from "react";

/* 메인 물컵 비주얼.
   영상은 "물이 줄고 그림자가 해시계처럼 도는" 하루가 이어진 연속물이라,
   12단계 냉각수 기준(lib/water.ts STAGE_THRESHOLDS)을 넘어설 때마다 다음 구간 영상으로 넘어간다.
   질문을 계속해도 단계가 그대로면 재생하지 않고, 기준선을 넘은 순간에만 한 번 재생한다.

   STAGE_VIDEOS에 영상을 더 넣으면 자동으로 더 잘게 나뉜다 (지금은 4개라 3단계씩 묶인다). */
const STAGE_VIDEOS = [
  "/assets/cup/1.mp4",
  "/assets/cup/2.mp4",
  "/assets/cup/3.mp4",
  "/assets/cup/4.mp4",
];

/** 12단계를 영상 개수만큼 균등하게 나눠 매핑 (소진 13단계는 마지막 영상) */
const STAGE_COUNT = 12;
function videoIndexForStage(stage: number): number {
  const s = Math.min(Math.max(stage, 1), STAGE_COUNT);
  const per = STAGE_COUNT / STAGE_VIDEOS.length;
  return Math.min(Math.floor((s - 1) / per), STAGE_VIDEOS.length - 1);
}

/** 캔버스 내부 해상도 — 영상이 1440²/960²라 1080이면 확대해도 충분히 선명하다 */
const CANVAS_SIZE = 1080;

/**
 * 단계가 바뀐 순간에만 해당 구간 영상을 처음부터 한 번 재생하고 마지막 프레임에 멈춘다(loop 없음).
 *
 * <video>를 화면에 직접 띄우지 않고 <canvas>에 매 프레임 그려서 보여준다.
 * <video>는 GPU 비디오 합성 경로를 타면서 색이 미세하게 밝아져(#1b1d1f → 약 #18191b)
 * 영상의 사각형 외곽이 배경 위에 드러나는데, 캔버스로 그리면 디코딩된 픽셀이
 * 그대로 일반 페이지 콘텐츠처럼 합성돼 배경 매트가 --bg와 정확히 일치한다.
 */
export default function SendCupVideo({ stage }: { stage: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  /** 새 영상이 로드되면 바로 재생할지 — 단계가 올라 영상이 바뀐 경우에만 true */
  const playOnReadyRef = useRef(false);
  const prevStageRef = useRef(stage);

  const src = STAGE_VIDEOS[videoIndexForStage(stage)];

  const drawFrame = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.readyState < 2) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(v, 0, 0, c.width, c.height);
  }, []);

  // 재생 중에만 매 프레임 그린다 (멈춰 있을 땐 마지막으로 그린 화면이 그대로 남는다)
  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const v = videoRef.current;
      drawFrame();
      if (v && !v.paused && !v.ended) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  const playFromStart = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    // 자동재생이 거부돼도 첫 프레임은 이미 그려져 있으므로 조용히 넘어간다
    void v
      .play()
      .then(startLoop)
      .catch(() => drawFrame());
  }, [startLoop, drawFrame]);

  // 냉각수 기준선을 넘어 단계가 바뀐 순간에만 재생한다
  useEffect(() => {
    const prev = prevStageRef.current;
    if (prev === stage) return;
    prevStageRef.current = stage;

    if (videoIndexForStage(prev) !== videoIndexForStage(stage)) {
      // 다음 구간 영상으로 교체 — 로드가 끝나면 재생
      playOnReadyRef.current = true;
    } else {
      // 같은 구간 안에서 단계만 오른 경우엔 지금 영상을 다시 한 번 보여준다
      playFromStart();
    }
  }, [stage, playFromStart]);

  // 영상이 교체되면 첫 프레임을 그려두고, 단계 상승으로 바뀐 경우에는 이어서 재생한다
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onReady = () => {
      if (playOnReadyRef.current) {
        playOnReadyRef.current = false;
        playFromStart();
      } else {
        v.pause();
        v.currentTime = 0;
      }
    };
    const onSeeked = () => drawFrame();
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("seeked", onSeeked);
    return () => {
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("seeked", onSeeked);
    };
  }, [src, drawFrame, playFromStart]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <div className="relative size-full overflow-hidden rounded-[16px] bg-bg">
      {/* 디코딩은 계속 되어야 하므로 display:none 대신 화면 밖으로 숨긴다 */}
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        aria-hidden
        className="pointer-events-none absolute size-px opacity-0"
      />
      <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="size-full" />
    </div>
  );
}
