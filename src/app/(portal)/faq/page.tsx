'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FAQAccordion } from '@/components/faq/FAQAccordion';
import { customerFAQs, expertFAQs, groupByCategory } from '@/components/faq/faq-data';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QuestionMarkCircleIcon, 
  ChatBubbleLeftRightIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  LifebuoyIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function FAQPage() {
  const [userType, setUserType] = useState<'customer' | 'expert' | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [openFAQs, setOpenFAQs] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function getUserType() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserType(user.user_metadata?.user_type || 'customer');
      }
      setLoading(false);
    }
    getUserType();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  const faqs = userType === 'expert' ? expertFAQs : customerFAQs;
  const groupedFAQs = groupByCategory(faqs);

  // Category icons
  const categoryIcons: Record<string, any> = {
    'Getting Started': ShoppingCartIcon,
    'Chat & Communication': ChatBubbleLeftRightIcon,
    'Privacy & Safety': ShieldCheckIcon, // ✅ Add this
    'Support & Help': LifebuoyIcon,
    'Payments & Feedback': CurrencyDollarIcon,
    'Earnings & Payments': CurrencyDollarIcon,
    'Support & Issues': LifebuoyIcon,
    'Best Practices': LightBulbIcon,
  };
  
  const categoryLabels: Record<string, string> = {
    'Getting Started': 'Basics',
    'Chat & Communication': 'Chat',
    'Privacy & Safety': 'Privacy', // ✅ Add this
    'Support & Help': 'Support',
    'Payments & Feedback': 'Payments',
    'Earnings & Payments': 'Earnings',
    'Support & Issues': 'Support',
    'Best Practices': 'Tips',
  };
  

  // Filter current tab FAQs
  const currentCategory = groupedFAQs[activeTab];
  const filteredFAQs = searchQuery.trim()
    ? currentCategory.items.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentCategory.items;

  const toggleFAQ = (index: number) => {
    const newOpenFAQs = new Set(openFAQs);
    if (newOpenFAQs.has(index)) {
      newOpenFAQs.delete(index);
    } else {
      newOpenFAQs.add(index);
    }
    setOpenFAQs(newOpenFAQs);
  };

  // Reset open FAQs when switching tabs
  const handleTabChange = (index: number) => {
    setActiveTab(index);
    setOpenFAQs(new Set());
    setSearchQuery('');
  };

  // Slide direction for tab content
  const slideDirection = 1; // Always slide left to right for simplicity

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 md:py-12 px-4">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <QuestionMarkCircleIcon className="w-10 h-10 md:w-12 md:h-12" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Frequently Asked Questions
              </h1>
            </div>
            <p className="text-lg md:text-xl text-blue-100">
              {userType === 'expert' 
                ? 'Expert guide to using the platform effectively'
                : 'Customer guide to tracking orders and getting help'
              }
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tabs - Mobile: Horizontal scroll, Desktop: Full width */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {groupedFAQs.map((group, index) => {
              const Icon = categoryIcons[group.category] || QuestionMarkCircleIcon;
              const isActive = activeTab === index;
              
              return (
                <button
                  key={group.category}
                  onClick={() => handleTabChange(index)}
                  className={`
                    relative flex items-center gap-2 px-4 md:px-6 py-4 whitespace-nowrap font-medium transition-colors duration-200
                    ${isActive 
                      ? 'text-blue-600' 
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{categoryLabels[group.category] || group.category}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${currentCategory.category}...`}
            className="w-full pl-12 pr-6 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </motion.div>
      </div>

      {/* FAQ Content with Sliding Animation */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: slideDirection * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection * -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {filteredFAQs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <QuestionMarkCircleIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">
                  No questions found matching "{searchQuery}"
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredFAQs.map((faq, faqIndex) => (
                  <FAQAccordion
                    key={`${activeTab}-${faqIndex}`}
                    question={faq.question}
                    answer={faq.answer}
                    index={faqIndex}
                    isOpen={openFAQs.has(faqIndex)}
                    onToggle={() => toggleFAQ(faqIndex)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Still Need Help Section */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 md:p-8 text-white text-center"
        >
          <LifebuoyIcon className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl md:text-2xl font-bold mb-3">
            Still need help?
          </h3>
          <p className="text-slate-300 mb-6 text-base md:text-lg">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          
            <a href="/support"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            <LifebuoyIcon className="w-5 h-5" />
            Create Support Ticket
          </a>
        </motion.div>
      </div>
    </div>
  );
}