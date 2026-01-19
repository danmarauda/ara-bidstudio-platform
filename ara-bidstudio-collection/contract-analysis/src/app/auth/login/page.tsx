'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real implementation, this would redirect to WorkOS SSO
      // or handle email/password authentication
      console.log('Login attempt with email:', email);
      
      // For now, we'll simulate a successful login
      setTimeout(() => {
        setIsLoading(false);
        // Redirect to documents page
        window.location.href = '/documents';
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };
  
  const handleSSOLogin = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would redirect to WorkOS SSO URL
      console.log('SSO login requested');
      
      // For now, we'll simulate SSO and redirect to documents page
      setTimeout(() => {
        setIsLoading(false);
        window.location.href = '/documents';
      }, 1000);
    } catch (error) {
      console.error('SSO login error:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contract Analysis Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Sign in to your account
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Input
              label="Email address"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          
          <div>
            <Input
              label="Password"
              id="password"
              type="password"
              required
              className="w-full"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Remember me
              </label>
            </div>
            
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={handleSSOLogin}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Redirecting to SSO...' : 'Sign in with SSO'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}