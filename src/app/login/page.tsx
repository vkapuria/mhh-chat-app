'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FeatureCarousel } from '@/components/login/FeatureCarousel';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
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
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg text-sm lg:text-base"
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
            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer & Expert Portal</h1>
              <p className="text-sm text-slate-600">
                Sign in to track orders, chat with experts, and manage support tickets
              </p>
            </div>

            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-1">Don't have an account?</p>
              <p className="text-xs text-blue-700">
                Accounts are automatically created for all paying customers and verified experts.{' '}
                <a 
                  href="https://myhomeworkhelp.com/submit-homework-form/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-blue-800"
                >
                  Place an order
                </a> to get started!
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

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
                  className="w-full px-4 py-3 border-2 border-slate-400 hover:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-slate-400 hover:border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
  type="submit"
  disabled={loading}
  className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.98]"
>
  {loading ? 'Signing In...' : 'Sign In'}
</button>
<div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
  <span>🔒 SSL Secure</span>
  <span>•</span>
  <span>Data Privacy Protected</span>
</div>
              </form>

              {/* Forgot Password & Support Links */}
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                    Forgot your password?
                  </Link>
                  {' • '}
                  Need help?{' '}
                  <a href="https://myhomeworkhelp.com/contact/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
                    Contact Support
                  </a>
                </p>
              </div>

            {/* Social Proof */}
            <div className="mt-12 text-center">
              <p className="text-xs text-slate-500">
                Join <span className="font-bold text-slate-700">2,500+ students</span> already using our portal
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Mockups with Floating CTA */}
         <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 items-center justify-center p-0 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full h-full max-w-4xl flex flex-col"
          >
            {/* Carousel */}
            <div className="flex-1 flex items-center justify-center" style={{ transform: 'scale(0.90)', transformOrigin: 'center' }}>
    <FeatureCarousel />
  </div>


            {/* Floating CTA Below Mockups */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-2 flex flex-col items-center gap-3"
            >
              <p className="text-sm text-slate-700 font-medium">
                Ready to get started?
              </p>
              
                <a href="https://myhomeworkhelp.com/submit-homework-form/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-base"
              >
                Get Homework Help Now →
              </a>
              <p className="text-xs text-slate-500">
                Your account will be created automatically
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}