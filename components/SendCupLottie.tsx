"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";

export interface SendCupLottieHandle {
  /** 처음부터 한 번(루프 없이) 재생 */
  play: () => void;
}

/**
 * 메인 물컵 옆에 떠 있는 보조 비주얼.
 * 평소엔 첫 프레임에서 정지해 있다가, 사용자가 전송(화살표) 버튼을 누르는 순간에만
 * 처음부터 끝까지 한 번 재생되고 마지막 프레임에 멈춘다.
 * 프레임 배경(rgb 29,29,29)이 앱 배경(--bg)과 사실상 동일해 카드 배경도 --bg로 맞춰
 * 경계 없이 자연스럽게 섞이도록 한다.
 */
const SendCupLottie = forwardRef<SendCupLottieHandle>(function SendCupLottie(_props, ref) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch("/assets/cup/send-cup-lottie.json")
      .then((r) => r.json())
      .then(setAnimationData)
      .catch(() => {});
  }, []);

  // 데이터가 로드되면 첫 프레임에서 바로 정지시켜 둔다 (자동재생 방지)
  useEffect(() => {
    if (animationData) lottieRef.current?.goToAndStop(0, true);
  }, [animationData]);

  useImperativeHandle(ref, () => ({
    play: () => {
      lottieRef.current?.goToAndPlay(0, true);
    },
  }));

  return (
    <div className="flex size-full items-center justify-center overflow-hidden rounded-[16px] bg-bg">
      {animationData && (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          onComplete={() => lottieRef.current?.goToAndStop(120, true)}
          className="size-full"
        />
      )}
    </div>
  );
});

export default SendCupLottie;
