'use client';

import { useRef, useEffect, useState } from 'react';
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
  const [isPlaying, setIsPlaying] = useState(autoplay);

  useEffect(() => {
    if (hover && lottieRef.current) {
      // If hover mode, start paused
      lottieRef.current.pause();
      setIsPlaying(false);
    }
  }, [hover]);

  const handleInteraction = () => {
    if (hover && lottieRef.current && !isPlaying) {
      lottieRef.current.stop(); // Reset to beginning
      lottieRef.current.play();
      setIsPlaying(true);
      
      // If not looping, reset playing state when animation completes
      if (!loop) {
        setTimeout(() => {
          setIsPlaying(false);
        }, 1000); // Adjust based on animation duration
      }
    }
  };

  const handleMouseEnter = () => {
    handleInteraction();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse events on touch devices
    handleInteraction();
  };

  const handleMouseLeave = () => {
    // Only stop if looping, otherwise let it finish
    if (hover && lottieRef.current && loop) {
      lottieRef.current.stop();
      setIsPlaying(false);
    }
  };

  return (
    <div 
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
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