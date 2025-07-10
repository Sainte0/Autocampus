'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie utility functions
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const checkAuth = async () => {
      const storedToken = getCookie('auth_token');
      const storedUser = getCookie('auth_user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Verify token is still valid by making a test request
          try {
            const response = await fetch('/api/auth/verify', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${storedToken}`,
              },
            });
            
            if (response.ok) {
              setToken(storedToken);
              setUser(parsedUser);
            } else {
              // Token is invalid, clear cookies
              deleteCookie('auth_token');
              deleteCookie('auth_user');
            }
          } catch (error) {
            console.error('Error verifying token:', error);
            // If verification fails, still set the user but mark as potentially stale
            setToken(storedToken);
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          // Clear invalid cookies
          deleteCookie('auth_token');
          deleteCookie('auth_user');
        }
      }
      
      setIsLoading(false);
    };

    // Small delay to ensure cookies are available
    const timer = setTimeout(checkAuth, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        
        // Store in cookies for 24 hours (1 day)
        setCookie('auth_token', data.token, 1);
        setCookie('auth_user', JSON.stringify(data.user), 1);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    // Clear cookies
    deleteCookie('auth_token');
    deleteCookie('auth_user');
    
    // Also clear localStorage for backward compatibility
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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