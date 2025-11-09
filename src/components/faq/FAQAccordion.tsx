'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQAccordionProps {
  question: string;
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQAccordion({ question, answer, index, isOpen, onToggle }: FAQAccordionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      {/* Question Button */}
      <button
        onClick={onToggle}
        className={`
          w-full px-6 py-4 flex items-center justify-between gap-4 text-left transition-all duration-200
          ${isOpen ? 'bg-slate-800 text-white' : 'bg-white text-slate-900 hover:bg-slate-50'}
        `}
      >
        <span className={`font-semibold flex-1 ${isOpen ? 'text-white' : 'text-slate-900'}`}>
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDownIcon className={`w-5 h-5 ${isOpen ? 'text-white' : 'text-slate-600'}`} />
        </motion.div>
      </button>

      {/* Answer Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 bg-white border-t border-slate-200">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}