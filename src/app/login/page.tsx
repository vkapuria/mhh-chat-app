'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { trackUserLogin } from '@/lib/analytics';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your orders and messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
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
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Need help? Contact your administrator</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}