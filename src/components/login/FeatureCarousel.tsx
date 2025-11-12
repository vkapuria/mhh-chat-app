'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OrdersMockup } from './OrdersMockup';
import { ChatMockup } from './ChatMockup';
import { SupportMockup } from './SupportMockup';
import { ShoppingBagIcon, ChatBubbleLeftRightIcon, LifebuoyIcon } from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';

type Feature = {
  id: 'orders' | 'chat' | 'support';
  title: string;
  description: string;   // short blurb shown in header
  caption: string;       // ultra-concise line under mockup
  icon: ComponentType<any>;
  component: ComponentType<any>;
};

const features: Feature[] = [
  {
    id: 'orders',
    title: 'Track Your Orders',
    description: 'View your complete order history in one place',
    caption: 'Track order every step—at a glance.',
    icon: ShoppingBagIcon,
    component: OrdersMockup,
  },
  {
    id: 'chat',
    title: 'Chat with Your Expert',
    description: 'Direct messaging in-app with email notifications',
    caption: 'DM your expert instantly.',
    icon: ChatBubbleLeftRightIcon,
    component: ChatMockup,
  },
  {
    id: 'support',
    title: 'VIP Support',
    description: 'Priority ticketing and instant help when you need it',
    caption: 'Priority help, fast resolution.',
    icon: LifebuoyIcon,
    component: SupportMockup,
  },
];

export function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Stable mock data for Orders slide (if needed)
  const stableOrders = useRef(undefined as any).current;

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    clearTimer();
    if (reduceMotion) return; // respect prefers-reduced-motion (pause autoplay)
    // calmer auto-rotate
    timerRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 7000);
  };

  useEffect(() => {
    startTimer();
    // Pause when tab is hidden
    const onVisibility = () => (document.hidden ? clearTimer() : startTimer());
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimer();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const handleDotClick = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    startTimer();
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const threshold = 60;
    if (info.offset.x < -threshold) {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % features.length);
      startTimer();
    } else if (info.offset.x > threshold) {
      setDirection(-1);
      setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
      startTimer();
    }
  };

  const activeFeature = features[activeIndex];
  const ActiveComponent: any = activeFeature.component;
  const Icon = activeFeature.icon;

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col"
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      onTouchStart={clearTimer}
      onTouchEnd={startTimer}
      aria-roledescription="carousel"
      aria-live="polite"
    >
      {/* Title + blurb */}
      <div className="px-2 sm:px-4 mb-0.5">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-500" />
          <div>
            <h3 className="text-slate-900 font-semibold">{activeFeature.title}</h3>
            <p className="text-sm text-slate-600">{activeFeature.description}</p>
          </div>
        </div>
      </div>

      {/* Mockup area */}
      <div className="relative overflow-hidden mt-1 h-[600px]">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            initial={{ opacity: 0, x: reduceMotion ? 0 : direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : direction * -100 }}
            transition={reduceMotion ? { duration: 0.25 } : { duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0"
            drag={reduceMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
          >
            {activeFeature.id === 'orders' ? (
              <ActiveComponent orders={stableOrders} />
            ) : (
              <ActiveComponent />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Concise caption under mockup */}
      <p className="mt-1 px-4 text-center text-[14px] text-slate-600 leading-tight">
        {activeFeature.caption}
      </p>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-2 pb-1">
        {features.map((feature, index) => (
          <button
            key={feature.id}
            onClick={() => handleDotClick(index)}
            className="relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
            aria-label={`Go to ${feature.title}`}
            aria-current={index === activeIndex ? 'true' : 'false'}
          >
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'bg-blue-600 w-8' : 'bg-slate-300 w-2 group-hover:bg-slate-400'
              }`}
            />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {feature.title}
            </div>
          </button>
        ))}
      </div>

      {/* Compact trust bullets */}
      <ul className="mt-0.5 mb-1 flex items-center justify-center gap-3 text-[14px] text-slate-600">
        <li className="flex items-center gap-1.5"><span aria-hidden>💬</span> Real-time chat</li>
        <li className="flex items-center gap-1.5"><span aria-hidden>⏱️</span> On-time Delivery</li>
        <li className="flex items-center gap-1.5"><span aria-hidden>💯</span> 100% Satisfaction Guarantee policy</li>
      </ul>
    </div>
  );
}
