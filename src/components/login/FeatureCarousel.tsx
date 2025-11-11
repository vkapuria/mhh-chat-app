'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OrdersMockup } from './OrdersMockup';
import { ChatMockup } from './ChatMockup';
import { SupportMockup } from './SupportMockup';
import { ShoppingBagIcon, ChatBubbleLeftRightIcon, LifebuoyIcon } from '@heroicons/react/24/outline';

// Generate stable orders once here and pass down (prevents re-mount pop)
import type { ComponentType } from 'react';

type Feature = {
  id: 'orders' | 'chat' | 'support';
  title: string;
  description: string;
  icon: ComponentType<any>;
  component: ComponentType<any>;
};

const features: Feature[] = [
  {
    id: 'orders',
    title: 'Track Your Orders',
    description: 'View your complete order history in one place',
    icon: ShoppingBagIcon,
    component: OrdersMockup,
  },
  {
    id: 'chat',
    title: 'Chat with Your Expert',
    description: 'Direct messaging in-app with email notifications',
    icon: ChatBubbleLeftRightIcon,
    component: ChatMockup,
  },
  {
    id: 'support',
    title: 'VIP Support',
    description: 'Priority ticketing and instant help when you need it',
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

  // Prepare stable mock data for Orders slide only (passed as prop)
  const stableOrders = useRef(undefined as any).current;

  const startTimer = () => {
    // INTENTIONAL: 60s interval
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 60000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, []);

  const handleDotClick = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    // restart interval for predictability
    startTimer();
  };

  // drag/swipe
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
        onMouseEnter={stopTimer}
        onMouseLeave={startTimer}
        onTouchStart={stopTimer}
        onTouchEnd={startTimer}
        aria-roledescription="carousel"
        aria-live="polite"
        >
        {/* Feature Title - Simple & Clean */}
        <div className="px-2 sm:px-4 mb-1">
            <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-slate-500" />
          <div>
            <h3 className="text-slate-900 font-semibold">{activeFeature.title}</h3>
            <p className="text-sm text-slate-600">{activeFeature.description}</p>
          </div>
        </div>
      </div>

      {/* Mockup area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            initial={{ opacity: 0, x: reduceMotion ? 0 : direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : direction * -100 }}
            transition={
              reduceMotion
                ? { duration: 0.25 }
                : { duration: 0.5, ease: 'easeInOut' }
            }
            className="absolute inset-0"
            drag={reduceMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
          >
            {/* Pass stable orders only to OrdersMockup; others ignore props */}
            {activeFeature.id === 'orders' ? (
              <ActiveComponent orders={stableOrders} />
            ) : (
              <ActiveComponent />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-6 pb-4">
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
    </div>
  );
}
