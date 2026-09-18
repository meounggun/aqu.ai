"use client";

import { useCallback, useEffect, useRef } from "react";

/* 메인 물컵 비주얼.
   영상은 "물이 줄고 그림자가 해시계처럼 도는" 하루가 이어진 연속물이라,
   12단계 냉각수 기준(lib/water.ts STAGE_THRESHOLDS)을 넘어설 때마다 다음 구간 영상으로 넘어간다.
   질문을 계속해도 단계가 그대로면 재생하지 않고, 기준선을 넘은 순간에만 한 번 재생한다.

   영상이 12개라 12단계와 1:1로 대응한다 (n단계 → n.mp4, 소진 13단계는 마지막 영상). */
const STAGE_VIDEOS = Array.from({ length: 12 }, (_, i) => `/assets/cup/${i + 1}.mp4`);

/** 내용이 실제로 끝나는 시점(초) — 끝에 빈 프레임이 붙어 있는 영상만 적어둔다.
    3.mp4는 4.1초부터 끝(5.04초)까지 프레임이 완전히 비어 있어서, 그대로 끝까지 재생하면
    마지막 프레임에 멈추는 순간 컵이 통째로 사라진다. 여기 적힌 시점에서 멈춰 세운다. */
const PLAYABLE_END: Record<string, number> = {
  "/assets/cup/3.mp4": 4,
};

/** 배경이 사이트 배경색(#1b1d1f)이 아니라 검정(#000)으로 렌더된 영상.
    그대로 그리면 컵 주변에 검은 사각형이 드러나므로, 그릴 때 배경색을 먼저 깔고
    영상을 lighten(채널별 최댓값)으로 얹어 검정만 배경색으로 바꾼다.
    배경색보다 밝은 컵·물·그림자는 원본 그대로 남는다.
    원본을 #1b1d1f 배경으로 다시 뽑으면 이 목록에서 빼면 된다. */
const BLACK_BG_VIDEOS = new Set(["/assets/cup/10.mp4"]);
const BG = "#1b1d1f";

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
    if (BLACK_BG_VIDEOS.has(src)) {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = "lighten";
      ctx.drawImage(v, 0, 0, c.width, c.height);
      ctx.globalCompositeOperation = "source-over";
      return;
    }
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(v, 0, 0, c.width, c.height);
  }, [src]);

  // 재생 중에만 매 프레임 그린다 (멈춰 있을 땐 마지막으로 그린 화면이 그대로 남는다)
  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const v = videoRef.current;
      const stop = PLAYABLE_END[src];
      // 빈 프레임 구간에 들어서기 전에 멈춘다 — 그리지 않고 빠져나가야 한 프레임도 깜빡이지 않는다
      if (v && stop !== undefined && v.currentTime >= stop) {
        v.pause();
        v.currentTime = stop; // seeked 이벤트가 마지막 성한 프레임을 다시 그려준다
        rafRef.current = null;
        return;
      }
      drawFrame();
      if (v && !v.paused && !v.ended) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [drawFrame, src]);

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
