'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FeatureCarousel } from '@/components/login/FeatureCarousel';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [role, setRole] = useState<'customer' | 'expert'>('customer');
  const [showPwd, setShowPwd] = useState(false);
  const [showHelper, setShowHelper] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors({});
  
    // simple client-side checks
    const emailOk = /\S+@\S+\.\S+/.test(email);
    if (!emailOk) {
      setLoading(false);
      setErrors({ email: 'Enter a valid email address.' });
      return;
    }
    if (!password) {
      setLoading(false);
      setErrors({ password: 'Password is required.' });
      return;
    }
  
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) router.push('/dashboard');
    } catch (err: any) {
      // map most auth failures to password line (keeps the form calm)
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('invalid') || msg.includes('password') || msg.includes('credentials')) {
        setErrors({ password: 'Invalid email or password.' });
      } else {
        setError('Sign-in failed. Please try again.'); // optional tiny top message if you still want one
      }
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Header with Logo + CTA */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-2 lg:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="https://myhomeworkhelp.com" className="flex-shrink-0">
            <Image
              src="/icons/mhh-logo.png"
              alt="MyHomeworkHelp"
              width={120}
              height={54}
              className="object-contain"
              priority
            />
          </Link>

          {/* CTA Button */}
          
            <a href="https://myhomeworkhelp.com/submit-homework-form/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm lg:text-base"
          >
            Get Homework Help
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Eyebrow + H1 + Tabs */}
<div className="mb-6">
  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
    Customer & Expert Portal
  </p>
  <h1 className="mt-1 text-3xl font-bold text-slate-900">Sign in</h1>
  <p className="mt-1 text-sm text-slate-600">
    Access your assignments, chat, and support in one place.
  </p>

{/* Animated Toggle */}
<div className="mt-4 relative inline-flex rounded-lg border border-slate-300 p-1 bg-slate-50">
    {/* Sliding background */}
    <motion.div
      className="absolute top-1 bottom-1 rounded-md bg-slate-900"
      initial={false}
      animate={{
        left: role === 'customer' ? '4px' : 'calc(50% + 2px)',
        right: role === 'customer' ? 'calc(50% + 2px)' : '4px',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />
    
    <button
      type="button"
      onClick={() => setRole('customer')}
      className={`relative z-10 w-24 py-2 text-sm font-medium rounded-md transition-colors ${
        role === 'customer'
          ? 'text-white'
          : 'text-slate-700 hover:text-slate-900'
      }`}
      aria-pressed={role === 'customer'}
    >
      Customer
    </button>
    <button
      type="button"
      onClick={() => setRole('expert')}
      className={`relative z-10 w-24 py-2 text-sm font-medium rounded-md transition-colors ${
        role === 'expert'
          ? 'text-white'
          : 'text-slate-700 hover:text-slate-900'
      }`}
      aria-pressed={role === 'expert'}
    >
      Expert
    </button>
  </div>
</div>
            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  autoComplete="email"
                />
                {errors.email && (
  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
)}

              </div>

              <div>
  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
    Password
  </label>
  <div className="relative">
    <input
      id="password"
      type={showPwd ? 'text' : 'password'}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="••••••••"
      className="w-full pr-12 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      required
      autoComplete="current-password"
    />
    <button
      type="button"
      onClick={() => setShowPwd((s) => !s)}
      className="absolute inset-y-0 right-2 my-auto px-2 text-xs text-slate-600 hover:text-slate-800 rounded"
      aria-label={showPwd ? 'Hide password' : 'Show password'}
    >
      {showPwd ? 'Hide' : 'Show'}
    </button>
  </div>
  {errors.email && (
  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
)}
</div>


              <button
  type="submit"
  disabled={loading}
  className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98] inline-flex items-center justify-center gap-2"
>
  <span aria-hidden>🔒</span>
  <span>{loading ? 'Signing In...' : 'Sign In'}</span>
</button>

              </form>

{/* Mini legal + link row with collapsible trigger */}
<div className="mt-3 flex flex-col items-center gap-2">
  <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500">
    <Link href="/forgot-password" className="hover:text-slate-700 underline underline-offset-2">
      Forgot password?
    </Link>
    <span aria-hidden>•</span>
    <a href="https://myhomeworkhelp.com/disclaimer/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline underline-offset-2">
      Terms
    </a>
    <span aria-hidden>•</span>
    <a href="https://myhomeworkhelp.com/money-back-guarantee/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 underline underline-offset-2">
      Refund
    </a>
  </div>
  
  {/* Collapsible trigger */}
  <button
    type="button"
    onClick={() => setShowHelper(!showHelper)}
    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
  >
    {showHelper ? '− Hide help' : '+ New here?'}
  </button>
  
  {/* Collapsible content */}
  <AnimatePresence>
    {showHelper && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden w-full"
      >
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900 font-medium mb-1">
            {role === 'customer' ? "New to MyHomeworkHelp?" : "New expert?"}
          </p>
          
          {role === 'customer' ? (
            <p className="text-xs text-blue-700">
              Customer accounts are created automatically after your first order.{' '}
              
               <a href="https://myhomeworkhelp.com/submit-homework-form/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-blue-800"
              >
                Place an order
              </a>{' '}
              to get started.
            </p>
          ) : (
            <p className="text-xs text-blue-700">
              Expert access is granted after verification. If you've applied, please use your registered email.
              For onboarding, contact{' '}
              
               <a href="https://myhomeworkhelp.com/contact-us/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline hover:text-blue-800"
              >
                support
              </a>.
            </p>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>


            {/* University Social Proof */}
            <div className="mt-10 text-center">
              <p className="text-sm text-slate-700 font-semibold mb-3">
                Trusted by <span className="text-blue-600">200,000+ students</span> from 258 universities worldwide
              </p>
              
              {/* University Logos */}
              <div className="flex items-center justify-center gap-6 opacity-70">
                {/* Harvard Shield */}
                <div className="w-10 h-10 bg-[#A51C30] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">H</span>
                </div>
                
                {/* Yale Shield */}
                <div className="w-10 h-10 bg-[#00356B] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Y</span>
                </div>
                
                {/* Stanford Shield */}
                <div className="w-10 h-10 bg-[#8C1515] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                
                {/* MIT Shield */}
                <div className="w-10 h-10 bg-[#A31F34] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                
                {/* Generic University Shield */}
                <div className="w-10 h-10 bg-[#003262] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">U</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 mt-2">
                ...and many more
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Mockups with Floating CTA */}
         <div className="hidden lg:flex lg:w-1/2 bg-slate-50 items-center justify-center p-0 relative"         >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full h-full max-w-4xl flex flex-col"
          >
            {/* Carousel */}
            <div className="flex-1 flex items-center justify-center" style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
    <FeatureCarousel />
  </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}