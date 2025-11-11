'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useMemo } from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';


type Order = {
  title: string;
  subject: string;
  id: string;
  status: 'In Progress' | 'Completed';
  date: string;
  dateLabel: 'Due:' | 'Delivered on:';
  isCompleted: boolean;
};

type OrdersMockupProps = {
  orders?: Order[]; // parent can pass stable data (recommended)
};

const orderPool = [
  { title: 'Research Project on Islamic Art', subject: 'Theology' },
  { title: 'Organizational Strategy Consulting', subject: 'Business Management' },
  { title: 'Financial Statement Analysis Report', subject: 'Accounting' },
  { title: 'Data Structures Implementation', subject: 'Computer Science' },
  { title: 'Clinical Psychology Case Study', subject: 'Psychology' },
  { title: 'Renaissance Art History Essay', subject: 'Art History' },
  { title: 'Quantum Mechanics Problem Set', subject: 'Physics' },
  { title: 'Marketing Campaign Strategy', subject: 'Marketing' },
  { title: 'Constitutional Law Research Paper', subject: 'Law' },
  { title: 'Organic Chemistry Lab Report', subject: 'Chemistry' },
  { title: 'International Relations Analysis', subject: 'Political Science' },
  { title: 'Machine Learning Algorithm Design', subject: 'Data Science' },
  { title: 'Supply Chain Optimization Study', subject: 'Operations Management' },
  { title: 'Environmental Impact Assessment', subject: 'Environmental Science' },
  { title: 'Victorian Literature Essay', subject: 'English Literature' },
  { title: 'Statistical Data Analysis Project', subject: 'Statistics' },
  { title: 'Human Resource Management Plan', subject: 'HR Management' },
  { title: 'Microeconomics Market Analysis', subject: 'Economics' },
  { title: 'Software Engineering Design Doc', subject: 'Software Engineering' },
  { title: 'Nursing Care Plan Development', subject: 'Nursing' },
  { title: 'Critical Analysis of Modern Poetry', subject: 'Critical Writing' },
  { title: 'Argumentative Essay on Climate Change', subject: 'Essay Writing' },
  { title: 'Discussion Board: Ethics in AI', subject: 'Discussion Board' },
  { title: 'Persuasive Essay on Social Media Impact', subject: 'Essay Writing' },
  { title: 'Critical Review of Healthcare Policy', subject: 'Critical Writing' },
];

// utilities for local fallback generation (kept for robustness)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededPick<T>(arr: T[], rand: () => number) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 3);
}

function generateTaskId(rand: () => number) {
  const year = new Date().getFullYear(); // consistency polish
  const num = Math.floor(1000 + rand() * 9000);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const suffix = letters[Math.floor(rand() * letters.length)] + letters[Math.floor(rand() * letters.length)];
  return `MHH-${year}-${num}${suffix}`;
}

function getRandomDate(rand: () => number) {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const randomTime = sixMonthsAgo.getTime() + rand() * (now.getTime() - sixMonthsAgo.getTime());
  const d = new Date(randomTime);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statusColors = {
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  Completed: 'bg-green-100 text-green-700 border-green-200',
} as const;

export function OrdersMockup({ orders }: OrdersMockupProps) {
  const reduceMotion = useReducedMotion();

  // Fallback: if parent didn’t pass orders, generate with a *stable* seed tied to first mount of app session
  const fallbackOrders = useMemo<Order[]>(() => {
    if (orders && orders.length) return orders;
    // stable-ish seed based on first render time (window.crypto for better distribution if available)
    const seed = typeof window !== 'undefined'
      ? (window as any).__MHH_SEED__ ?? ((window as any).__MHH_SEED__ = Math.floor(Math.random() * 1e9))
      : 42;
    const rand = mulberry32(seed);

    const picked = seededPick(orderPool, rand);
    const statuses: Array<'In Progress' | 'Completed' | 'In Progress'> = ['In Progress', 'Completed', 'In Progress'];

    return picked.map((p, i) => {
      const status = statuses[i];
      const date = getRandomDate(rand);
      return {
        title: p.title,
        subject: p.subject,
        id: generateTaskId(rand),
        status,
        date,
        dateLabel: status === 'Completed' ? 'Delivered on:' : 'Due:',
        isCompleted: status === 'Completed',
      };
    });
  }, [orders]);

  const data = orders && orders.length ? orders : fallbackOrders;

  // motion variants for smoother, springy entrance
  const itemVariants = {
    hidden: (i: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : i % 2 === 0 ? -40 : 40,
      filter: 'blur(2px)',
    }),
    show: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: reduceMotion
        ? { duration: 0.2 }
        : { type: 'spring', stiffness: 260, damping: 24, mass: 0.8 },
    },
  };

  const listTransition = reduceMotion
    ? { staggerChildren: 0.10 }
    : { staggerChildren: 0.40, delayChildren: 0.20 };


  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      {/* Desktop: Browser frame */}
      <div className="hidden md:block w-full max-w-3xl border border-slate-400 rounded-xl">
        {/* Safari chrome */}
        <div className="bg-gradient-to-b from-slate-200 to-slate-100 rounded-t-xl px-4 py-2.5 border-b border-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 bg-white rounded-md px-3 py-1.5 flex items-center gap-2 shadow-inner">
              <ShieldCheckIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-600">chat.myhomeworkhelp.com/support</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 overflow-hidden">
          <div className="px-2 py-1">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Orders</h2>
                <p className="text-xs text-slate-600">Track all your assignments</p>
              </div>
              <Image
                src="/icons/mhh-logo.png"
                alt="MyHomeworkHelp"
                width={80}
                height={40}
                className="object-contain"
              />
            </div>

            {/* Orders with staggered, springy entrance */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{}}
              transition={listTransition}
              className="space-y-2.5"
            >
              {data.map((order, index) => (
                <motion.div
                  key={order.id}
                  custom={index}
                  variants={itemVariants as any}
                  className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:-translate-y-0.5 hover:scale-[1.003] hover:border-slate-300 transition-transform will-change-transform"
                >
                  <div className="flex items-start gap-4">
                    {/* Left (70%) */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm mb-1.5 leading-tight line-clamp-2">
                        {order.title}
                      </h3>

                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="text-[10px] text-slate-600 font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                          {order.id}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-white">
                          {order.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                        >
                          {order.status}
                        </span>
                        <span className="text-xs text-slate-600">
                          {order.dateLabel}{' '}
                          <span className="font-medium">{order.date}</span>
                        </span>
                      </div>
                    </div>

                    {/* Right (INTENTIONAL 40%) */}
                    <div className="flex flex-col gap-2 w-[40%] shrink-0">
                      <button
                        disabled={order.isCompleted}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 ${
                          order.isCompleted
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:translate-y-[-1px]'
                        }`}
                        aria-disabled={order.isCompleted}
                      >
                        <Image
                          src="/icons/chat-bubble.svg"
                          alt="Chat"
                          width={14}
                          height={14}
                          className={order.isCompleted ? 'opacity-50' : ''}
                        />
                        Chat with Expert
                      </button>

                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-slate-900 border border-slate-300 hover:translate-y-[-1px] active:scale-[0.98] transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300">
                        <Image src="/icons/lifesaver.svg" alt="Support" width={14} height={14} />
                        Create Help Ticket
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile: phone frame */}
      <div className="md:hidden w-full max-w-[300px] mx-auto">
        <div className="bg-slate-900 rounded-[2.5rem] p-3 shadow-2xl">
          {/* notch */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-5 bg-slate-900 rounded-b-2xl flex items-center justify-center gap-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
              <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
            </div>
          </div>

          <div className="bg-white rounded-[2rem] overflow-hidden">
            {/* status bar */}
            <div className="bg-slate-50 px-3 py-1.5 flex items-center justify-between text-[11px] font-medium">
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

            {/* app */}
            <div className="p-1 h-[360px] overflow-y-auto">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">My Orders</h2>
                  <p className="text-[12px] text-slate-600">Track assignments</p>
                </div>
                <Image src="/icons/mhh-logo.png" alt="MHH" width={50} height={25} className="object-contain" />
              </div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{}}
                transition={listTransition}
                className="space-y-2"
              >
                {data.map((order, index) => (
                  <motion.div
                    key={order.id}
                    custom={index}
                    variants={{
                        hidden: (i: number) => ({
                          opacity: 0,
                          x: reduceMotion ? 0 : i % 2 === 0 ? -30 : 30,
                          filter: 'blur(2px)',
                        }),
                        show: {
                          opacity: 1,
                          x: 0,
                          filter: 'blur(0px)',
                          transition: reduceMotion
                            ? { duration: 0.2 }
                            : { type: 'spring' as const, stiffness: 260, damping: 24, mass: 0.8 },
                        },
                      }}
                    className="bg-slate-50 rounded-lg p-2.5 border border-slate-200"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-[13px] leading-tight mb-1 line-clamp-2">
                          {order.title}
                        </h3>

                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-600 font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                            {order.id}
                          </span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-900 text-white">
                            {order.subject}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                          <span className="text-[11px] text-slate-600">{order.date}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          disabled={order.isCompleted}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-transform active:scale-[0.98] ${
                            order.isCompleted ? 'bg-slate-300 text-slate-500' : 'bg-slate-900 text-white'
                          }`}
                        >
                          <Image src="/icons/chat-bubble.svg" alt="Chat" width={12} height={12} className={order.isCompleted ? 'opacity-50' : ''} />
                          Chat
                        </button>
                        <button className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-transform active:scale-[0.98]">
                          <Image src="/icons/lifesaver.svg" alt="Support" width={12} height={12} />
                          Help
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="border-t border-slate-200 px-4 py-2 flex items-center justify-around bg-white">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 bg-blue-600 rounded-lg" />
                <span className="text-[11px] text-blue-600 font-medium">Orders</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 bg-slate-300 rounded-lg" />
                <span className="text-[11px] text-slate-400">Messages</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-5 bg-slate-300 rounded-lg" />
                <span className="text-[11px] text-slate-400">Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
