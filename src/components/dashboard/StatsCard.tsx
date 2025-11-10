'use client';

import { motion, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lottie wrapper (SSR-safe via dynamic import)
const LottieIcon = dynamic(
  () => import('@/components/ui/LottieIcon').then((mod) => mod.LottieIcon),
  { ssr: false }
);

interface StatsCardProps {
  title: string;
  value: number;

  /** Optional icon (used only if no Lottie) */
  icon?: React.ReactNode;

  /** Primary Lottie JSON */
  lottieAnimation?: any;

  /** Desktop/primary link */
  link: string;

  /** Small red badge (e.g., unread count) */
  badge?: number;

  /** Secondary line under the value (desktop view) */
  subtitle?: string;

  /** Skeleton flag */
  loading?: boolean;

  /** Accent color for left border and title */
  accentColor?: string;

  // ── Mobile dual-stat props (right-hand mini-stat) ──
  secondaryTitle?: string;
  secondaryValue?: number;
  secondarySubtitle?: string;
  secondaryLottieAnimation?: any;
  secondaryLink?: string; // link for the right mini-stat (falls back to `link`)
}

/** AnimatedCounter: 0 → value in ~400ms (on every change) */
function AnimatedCounter({
  value,
  duration = 0.4,
  className = '',
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    controlsRef.current?.stop();
    controlsRef.current = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controlsRef.current?.stop();
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}

export function StatsCard({
  title,
  value,
  icon,
  lottieAnimation,
  link,
  badge,
  subtitle,
  loading = false,
  accentColor,
  secondaryTitle,
  secondaryValue,
  secondarySubtitle,
  secondaryLottieAnimation,
  secondaryLink,
}: StatsCardProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
    );
  }

  return (
    <div
      className="w-full bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3 text-left transition-all group relative overflow-hidden border-l-[4px]"
      aria-label={`${title} - ${value}`}
      style={{ borderLeftColor: accentColor || '#e5e7eb' }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* ───────────────── Desktop/Tablet (hidden on mobile) ───────────────── */}
      <motion.button
        onClick={() => router.push(link)}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative items-center gap-4 hidden sm:flex w-full text-left"
      >
        {/* LEFT: Icon / Lottie */}
        <div className="flex-shrink-0">
          {lottieAnimation ? (
            <div className="w-16 h-16 flex items-center justify-center">
              <LottieIcon
                animationData={lottieAnimation}
                className="w-16 h-16 pointer-events-none"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-200 transition-all">
              <div className="scale-150">{icon}</div>
            </div>
          )}
        </div>

        {/* RIGHT: Textual content */}
        <div className="flex-1 min-w-0">
          {/* Title + Badge */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              className="text-sm font-medium group-hover:text-slate-900 transition-colors"
              style={{ color: accentColor || '#475569' }} // slate-600 fallback
            >
              {title}
            </h3>

            {badge !== undefined && badge > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-red-500 text-white text-xs font-bold rounded-full"
              >
                {badge > 99 ? '99+' : badge}
              </motion.span>
            )}
          </div>

          {/* Main Value (animated) */}
          <div className="mb-1">
            <span className="text-3xl font-bold text-slate-900">
              <AnimatedCounter value={value} duration={0.4} />
            </span>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors mb-2">
              {subtitle}
            </p>
          )}

          {/* Arrow indicator */}
          <div className="flex items-center text-xs font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
            <span>View all</span>
            <svg
              className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </motion.button>

      {/* ───────────────── Mobile two-up (ONLY on mobile) ───────────────── */}
      {secondaryTitle !== undefined && secondaryValue !== undefined && (
        <div className="sm:hidden mt-1">
          <div className="flex items-stretch">
            {/* LEFT mini-stat (primary → link) */}
            <motion.button
              onClick={() => router.push(link)}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex flex-col items-center justify-start pr-3 cursor-pointer focus:outline-none"
            >
              {/* Lottie */}
              <div className="w-14 h-14 mb-2 flex items-center justify-center">
                {lottieAnimation ? (
                  <LottieIcon
                    animationData={lottieAnimation}
                    className="w-14 h-14 pointer-events-none"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <div className="scale-125">{icon}</div>
                  </div>
                )}
              </div>

              {/* Title & value */}
              <div
                className="text-xs font-medium"
                style={{ color: accentColor || '#475569' }}
              >
                {title}
              </div>
              <div className="text-2xl font-bold text-slate-900 leading-tight">
                <AnimatedCounter value={value} duration={0.4} />
              </div>

              {/* Tiny link hint */}
              <div className="text-[11px] font-medium text-slate-400 mt-1">
                View all
                <svg className="inline w-3 h-3 ml-0.5 align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {subtitle && (
                <div className="text-[11px] text-slate-500 mt-1">{subtitle}</div>
              )}
            </motion.button>

            {/* Divider */}
            <div className="w-px bg-slate-200 mx-1" />

            {/* RIGHT mini-stat (secondary → secondaryLink || link) */}
            <motion.button
              onClick={() => router.push(secondaryLink || link)}
              whileTap={{ scale: 0.98 }}
              className="flex-1 flex flex-col items-center justify-start pl-3 cursor-pointer focus:outline-none"
            >
              {/* Lottie */}
              <div className="w-14 h-14 mb-2 flex items-center justify-center">
                {secondaryLottieAnimation ? (
                  <LottieIcon
                    animationData={secondaryLottieAnimation}
                    className="w-14 h-14 pointer-events-none"
                  />
                ) : null}
              </div>

              {/* Title & value */}
              <div
                className="text-xs font-medium"
                style={{ color: accentColor || '#475569' }}
              >
                {secondaryTitle}
              </div>
              <div className="text-2xl font-bold text-slate-900 leading-tight">
                <AnimatedCounter value={secondaryValue} duration={0.4} />
              </div>

              {/* Tiny link hint */}
              <div className="text-[11px] font-medium text-slate-400 mt-1">
                View all
                <svg className="inline w-3 h-3 ml-0.5 align-[-1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {secondarySubtitle && (
                <div className="text-[11px] text-slate-500 mt-1">
                  {secondarySubtitle}
                </div>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
