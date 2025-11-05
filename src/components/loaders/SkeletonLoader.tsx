'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingMessage {
  text: string;
  icon: string;
}

interface SkeletonLoaderProps {
  messages: LoadingMessage[];
  children: React.ReactNode;
}

export function SkeletonLoader({ messages, children }: SkeletonLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState<LoadingMessage | null>(null);

  useEffect(() => {
    // Pick random message on mount
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);
  }, [messages]);

  if (!currentMessage) return null;

  const words = currentMessage.text.split(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Loading Message with Stagger Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          {/* Icon with Pulse */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Image
              src={currentMessage.icon}
              alt="Loading"
              width={48}
              height={48}
              className="w-8 h-8 md:w-12 md:h-12 text-blue-600"
            />
          </motion.div>

          {/* Stagger Words */}
          <div className="flex gap-2 text-xl font-medium text-blue-700">
            {words.map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Skeleton Content */}
        {children}
      </div>
    </div>
  );
}

// Shimmer Card Component
export function ShimmerCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-blue-100 overflow-hidden ${className}`}>
      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent animate-shimmer" />
        <div className="p-6 space-y-3">
          <div className="h-4 bg-blue-100 rounded w-3/4" />
          <div className="h-4 bg-blue-100 rounded w-1/2" />
          <div className="h-8 bg-blue-100 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

// Shimmer List Item
export function ShimmerListItem() {
  return (
    <div className="bg-white rounded-lg border border-blue-100 p-4 mb-3 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 to-transparent animate-shimmer" />
      <div className="space-y-2 relative z-10">
        <div className="h-5 bg-blue-100 rounded w-3/4" />
        <div className="h-4 bg-blue-100 rounded w-1/2" />
        <div className="h-3 bg-blue-100 rounded w-2/3" />
      </div>
    </div>
  );
}