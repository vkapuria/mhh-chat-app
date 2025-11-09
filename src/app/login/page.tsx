'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackUserLogin } from '@/lib/analytics';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Form submitted');
    setError('');
    setLoading(true);
  
    console.log('🔵 Calling login with:', email);
    const result = await login(email, password);
    console.log('🔵 Login result:', result);
  
    if (result.error) {
      console.log('🔴 Login error:', result.error);
      setError(result.error);
      setLoading(false);
    } else {
      console.log('🟢 Login successful, getting user metadata');
      // Get user metadata from Supabase directly
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🟢 User data:', user);
      const userType = user?.user_metadata?.user_type;
      console.log('🟢 User type:', userType);
      
      // Track user login
      if (user) {
        trackUserLogin({
          userType: userType || 'customer',
          userId: user.id,
        });
      }
      
      if (userType === 'admin') {
        console.log('🟢 Redirecting to /admin');
        window.location.href = '/admin';
      } else {
        console.log('🟢 Redirecting to /');
        window.location.href = '/dashboard';
      }
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const slideInFromLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const slideInFromRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.6 + i * 0.1,
        duration: 0.4,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Login Form */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideInFromLeft}
        className="w-full lg:w-[45%] flex items-center justify-center p-6 bg-white"
      >
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <Image 
                src="/icons/mhh-logo.png" 
                alt="MyHomeworkHelp Logo" 
                width={150}
                height={70}
                className="w-15 h-15"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-1 text-sm text-gray-600">
              Sign in to access your orders and support
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.form 
            variants={containerVariants}
            onSubmit={handleSubmit} 
            className="space-y-4"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 text-base"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 text-base"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="flex items-center justify-end text-sm">
              <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Forgot your password?
              </a>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button 
                type="submit" 
                className="w-full h-11 text-base bg-indigo-600 hover:bg-indigo-700" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>
          </motion.form>

          <motion.div variants={itemVariants} className="text-center text-sm text-gray-500">
            <p>Need help? <a href="mailto:support@myhomeworkhelp.com" className="text-indigo-600 hover:text-indigo-500 font-medium">Contact Support</a></p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Welcome Visual */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideInFromRight}
        className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 items-center justify-center p-8"
      >
        <div className="max-w-xl w-full space-y-6">
          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <Image 
              src="/images/chat-portal.png" 
              alt="MyHomeworkHelp Portal" 
              width={200}
              height={200}
              className="w-200px h-auto max-w-md mx-auto"
              priority
            />
          </motion.div>

          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center space-y-2"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome to MyHomeworkHelp
            </h2>
            <p className="text-base text-gray-600">
              Your academic success hub
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-3">
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={featureVariants}
              className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/80"
            >
              <div className="flex-shrink-0 w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Track Your Orders</h3>
                <p className="text-xs text-gray-600">View your complete order history in one place</p>
              </div>
            </motion.div>

            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={featureVariants}
              className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/80"
            >
              <div className="flex-shrink-0 w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">💬</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Chat with Your Expert</h3>
                <p className="text-xs text-gray-600">Direct messaging in-app and email notifications</p>
              </div>
            </motion.div>

            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={featureVariants}
              className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/80"
            >
              <div className="flex-shrink-0 w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎫</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">VIP Support</h3>
                <p className="text-xs text-gray-600">Get help instantly with our priority ticketing system</p>
              </div>
            </motion.div>
          </div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center pt-2"
          >
            <p className="text-sm text-gray-500">
              Join <span className="font-semibold text-indigo-600">500+ students</span> already using our portal
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}