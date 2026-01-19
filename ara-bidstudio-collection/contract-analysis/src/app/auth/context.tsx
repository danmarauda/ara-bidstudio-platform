'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);
  
  const checkSession = async () => {
    try {
      // In a real implementation, this would check Convex for a valid session
      // and set the user state accordingly
      console.log('Checking for existing session...');
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would:
      // 1. Call Convex mutation to authenticate user
      // 2. Create session in Convex database
      // 3. Set user state
      console.log('Login attempt:', email);
      
      // For now, we'll simulate a successful login
      setUser({
        id: 'user_123',
        email,
        name: 'Demo User',
        organizationId: 'org_123',
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would:
      // 1. Delete session from Convex database
      // 2. Clear user state
      console.log('Logout requested');
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const isAuthenticated = !!user;
  
  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}