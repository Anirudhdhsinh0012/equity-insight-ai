'use client';

// Root page: show CustomerDashboard when authenticated, otherwise LandingPageIntegrated.
// Handles automatic redirects based on authentication status.

import { useEffect, useState } from 'react';
import LandingPageIntegrated from '@/components/LandingPageIntegrated';
import CustomerDashboard from '@/components/CustomerDashboard';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { User } from '@/types';
import AuthService from '@/services/authService';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Migrate legacy data first
    AuthService.migrateLegacyData();
    
    // Check for existing session
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    // Session is already created by AuthService, so we just update the state
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    // Force redirect to landing page by clearing any cached state
    window.location.href = '/';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <div className="text-white text-lg tracking-wide">Initializing Stock Advisor Pro...</div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      {user ? (
        <NotificationProvider userId={user.id}>
          <CustomerDashboard user={user} onLogout={handleLogout} />
        </NotificationProvider>
      ) : (
        <LandingPageIntegrated onLogin={handleLogin} />
      )}
      
      {/* Admin Access Link */}
      <div className="fixed bottom-4 left-4 z-50">
        <a 
          href="/admin-activity" 
          target="_blank"
          className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-600 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white hover:text-gray-900 transition-all duration-200"
        >
          📊 Admin Activity Dashboard
        </a>
      </div>
    </ThemeProvider>
  );
}
