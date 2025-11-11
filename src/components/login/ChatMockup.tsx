'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';


/** ----- Conversation Script ----- */
type Sender = 'customer' | 'expert';
type ScriptMessage = { id: number; text: string; sender: Sender };

const script: ScriptMessage[] = [
  { id: 1, text: 'Hi! I have a question about the requirements', sender: 'customer' },
  { id: 2, text: 'Of course! What would you like to know?', sender: 'expert' },
  { id: 3, text: 'Can you include the statistical analysis?', sender: 'customer' },
  { id: 4, text: "Absolutely! I'll add detailed charts too 📊", sender: 'expert' },
];

// Human-like timing for different actions
const timings = {
  customerMessage: 1200, // customer types faster
  expertTypingStart: 800, // slight pause before expert types
  expertTypingDuration: 1400, // expert "types" for 1.4s
  expertMessage: 200, // message appears quickly after typing
};

/**
 * Build a single step timeline:
 * - Customer messages appear directly
 * - Expert messages are preceded by a "typing" step
 */
type Step =
  | { kind: 'message'; msg: ScriptMessage; delay: number }
  | { kind: 'typing'; who: 'expert'; delay: number };

function buildSteps(messages: ScriptMessage[], includeTyping = true): Step[] {
  const steps: Step[] = [];
  let cumulativeDelay = 0;

  for (const m of messages) {
    if (includeTyping && m.sender === 'expert') {
      // Add typing indicator with delay
      steps.push({ 
        kind: 'typing', 
        who: 'expert', 
        delay: cumulativeDelay + timings.expertTypingStart 
      });
      cumulativeDelay += timings.expertTypingStart + timings.expertTypingDuration;
      
      // Add expert message
      steps.push({ 
        kind: 'message', 
        msg: m, 
        delay: cumulativeDelay + timings.expertMessage 
      });
      cumulativeDelay += timings.expertMessage;
    } else {
      // Customer message
      steps.push({ 
        kind: 'message', 
        msg: m, 
        delay: cumulativeDelay + timings.customerMessage 
      });
      cumulativeDelay += timings.customerMessage;
    }
  }
  return steps;
}

/** ----- Message Bubble ----- */
function MessageBubble({
  msg,
  isCustomer,
  isMobile,
  showReadReceipt = false,
}: {
  msg: ScriptMessage;
  isCustomer: boolean;
  isMobile: boolean;
  showReadReceipt?: boolean;
}) {
  const label = isCustomer ? 'You' : 'Victor M.';
  return (
    <div
      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
      aria-label={`${label} says: ${msg.text}`}
    >
      <div className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} ${isMobile ? 'max-w-[75%]' : 'max-w-[65%]'}`}>
        <span className={`${isMobile ? 'text-[10px]' : 'text-[11px]'} text-slate-500 mb-0.5 px-1`} aria-hidden="true">
          {label}
        </span>
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 26, mass: 0.8 }}
          className={`rounded-2xl ${isMobile ? 'px-3 py-1.5' : 'px-4 py-2'} will-change-transform ${
            isCustomer ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'
          }`}
        >
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} leading-snug`}>
            {msg.text}
          </p>
        </motion.div>

        {/* Read receipt - only shown when prop is true */}
        {isCustomer && showReadReceipt && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="flex items-center gap-1 mt-1"
          >
            <Image 
              src="/icons/read.svg" 
              alt="" 
              width={isMobile ? 12 : 14} 
              height={isMobile ? 12 : 14}
              className="text-blue-600"
            />
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-blue-600 font-medium`}>
              Read
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** ----- Typing Indicator ----- */
function TypingIndicator({ isMobile = false }: { isMobile?: boolean }) {
  const dotSize = isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const pad = isMobile ? 'px-3 py-2' : 'px-4 py-3';
  return (
    <div className="flex justify-start" aria-label="Expert is typing" aria-live="polite">
      <div className={`bg-slate-100 rounded-2xl ${pad}`}>
        <div className="flex gap-1">
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.span
              key={i}
              className={`${dotSize} bg-slate-400 rounded-full`}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: d }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** ----- Main Component ----- */
export function ChatMockup() {
  const reduceMotion = useReducedMotion();

  /** Build steps based on motion preference */
  const steps = useMemo(
    () => buildSteps(script, !reduceMotion),
    [reduceMotion]
  );

  /** Persist progress across carousel remounts */
  const persisted = typeof window !== 'undefined'
    ? (window as any).__MHH_CHAT_STEP__
    : undefined;

  const [stepIndex, setStepIndex] = useState<number>(typeof persisted === 'number' ? persisted : 0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const timeoutRefs = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  /** Timeline with human-like delays */
  useEffect(() => {
    // Clear any existing timeouts
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];

    if (reduceMotion) {
      // Reveal all at once for reduced motion users
      setStepIndex(steps.length);
      if (typeof window !== 'undefined') (window as any).__MHH_CHAT_STEP__ = steps.length;
      return;
    }

    // Schedule each step with its specific delay
    steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setStepIndex(index + 1);
        if (typeof window !== 'undefined') (window as any).__MHH_CHAT_STEP__ = index + 1;
      }, step.delay);
      
      timeoutRefs.current.push(timeout);
    });

    // Cleanup function
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, [steps, reduceMotion]);

  /** Auto-scroll to bottom on new step */
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [stepIndex]);

  // Derived UI state
  const visibleSteps = steps.slice(0, stepIndex);
  const shownMessages = visibleSteps.filter((s) => s.kind === 'message') as Array<Extract<Step, { kind: 'message' }>>;
  const lastCustomerId = [...script].reverse().find((m) => m.sender === 'customer')?.id;
  const expertHasReplied = shownMessages.some((s) => s.msg.sender === 'expert' && s.msg.id > (lastCustomerId ?? 0));
  const showReadOnLastCustomer =
    expertHasReplied &&
    shownMessages.some((s) => s.msg.id === lastCustomerId);

  /** Shared render for the chat panel (desktop/mobile) */
  const renderTranscript = (isMobile: boolean) => (
    <div
      ref={listRef}
      className={`${isMobile ? 'p-2 space-y-2 h-[320px]' : 'p-3 space-y-2 h-44'} overflow-y-auto bg-white`}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence mode="popLayout">
        {visibleSteps.map((step, idx) => {
          if (step.kind === 'typing') {
            return (
              <motion.div
                key={`typing-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
              >
                <TypingIndicator isMobile={isMobile} />
              </motion.div>
            );
          }
          
          const m = step.msg;
          const isCustomer = m.sender === 'customer';
          const shouldShowRead = isCustomer && m.id === lastCustomerId && showReadOnLastCustomer;
          
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble 
                msg={m} 
                isCustomer={isCustomer} 
                isMobile={isMobile}
                showReadReceipt={shouldShowRead}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      {/* Desktop View - Browser Frame */}
      <div className="hidden md:block w-full max-w-3xl border border-slate-400 rounded-xl">
        {/* Browser Chrome */}
        <div className="bg-gradient-to-b from-slate-200 to-slate-100 rounded-t-xl px-4 py-2 border-b border-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 shadow-inner">
              <ShieldCheckIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-600">chat.myhomeworkhelp.com/messages</span>
            </div>
          </div>
        </div>

        {/* Browser Content */}
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-1.5 border-b border-green-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-green-700">Expert Online</span>
            </div>
          </div>

          <div className="bg-slate-50 px-6 py-2 border-b border-slate-200">
            <h2 className="text-base font-semibold text-slate-900">Marketing Analysis Report</h2>
            <p className="text-xs text-slate-600">Chatting with Victor M.</p>
          </div>

          {/* Messages */}
          {renderTranscript(false)}

          {/* Input */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                disabled
                aria-disabled="true"
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-transform active:scale-[0.98] will-change-transform"
                aria-disabled="true"
              >
                Send
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 text-center">
              This is a demo conversation. Buttons are non-interactive.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile View - Phone Frame */}
      <div className="md:hidden w-full max-w-[280px] mx-auto">
        {/* Phone Frame */}
        <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
          {/* Notch */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-5 bg-slate-900 rounded-b-2xl flex items-center justify-center gap-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
              <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
            </div>
          </div>

          {/* Screen */}
          <div className="bg-white rounded-[2rem] overflow-hidden">
            {/* Status Bar */}
            <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between text-[10px] font-medium">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-1 h-2 bg-slate-900 rounded-sm" />
                  <div className="w-1 h-2.5 bg-slate-900 rounded-sm" />
                  <div className="w-1 h-3 bg-slate-900 rounded-sm" />
                  <div className="w-1 h-3.5 bg-slate-900 rounded-sm" />
                </div>
              </div>
            </div>

            {/* Chat Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 border-b border-green-200">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-700">Expert Online</span>
              </div>
            </div>

            {/* Messages */}
            {renderTranscript(true)}

            {/* Input Bar */}
            <div className="px-3 py-2 border-t border-slate-200 bg-white">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Type message..."
                  className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  disabled
                  aria-disabled="true"
                />
                <button
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium transition-transform active:scale-[0.98] will-change-transform"
                  aria-disabled="true"
                >
                  Send
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500 text-center">
                Demo only. Actions are disabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}