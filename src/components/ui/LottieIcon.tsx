'use client';

import { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

interface LottieIconProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  hover?: boolean;
}

export function LottieIcon({ 
  animationData,
  className = "w-6 h-6", 
  loop = true, 
  autoplay = true,
  hover = false 
}: LottieIconProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (hover && lottieRef.current) {
      lottieRef.current.pause();
    }
  }, [hover]);

  const handleMouseEnter = () => {
    if (hover && lottieRef.current) {
      lottieRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (hover && lottieRef.current) {
      lottieRef.current.stop();
    }
  };

  return (
    <div 
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
      />
    </div>
  );
}