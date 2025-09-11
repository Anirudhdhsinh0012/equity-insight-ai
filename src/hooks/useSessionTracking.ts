// Session Tracking Hook - Automatic session management and activity logging
import { useEffect, useRef, useCallback } from 'react';
import { DatabaseUser } from '@/services/realTimeDataService';
import { activityLogger } from '@/services/activityLoggingService';

interface UseSessionTrackingOptions {
  user: DatabaseUser | null;
  autoStartSession?: boolean;
  trackPageViews?: boolean;
  trackEngagement?: boolean;
  sessionTimeoutMinutes?: number;
}

export const useSessionTracking = ({
  user,
  autoStartSession = true,
  trackPageViews = true,
  trackEngagement = true,
  sessionTimeoutMinutes = 30
}: UseSessionTrackingOptions) => {
  const sessionStartTime = useRef<Date | null>(null);
  const lastActivityTime = useRef<Date>(new Date());
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update last activity time
  const updateLastActivity = useCallback(() => {
    lastActivityTime.current = new Date();
    
    // Reset session timeout
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    
    sessionTimeoutRef.current = setTimeout(() => {
      if (user) {
        activityLogger.logSystemEvent(
          'performance',
          'Session timeout',
          { timeoutMinutes: sessionTimeoutMinutes, userId: user.id },
          'info'
        );
      }
    }, sessionTimeoutMinutes * 60 * 1000);
  }, [user, sessionTimeoutMinutes]);

  // Start session tracking
  const startSession = useCallback(async () => {
    if (!user) return;
    
    sessionStartTime.current = new Date();
    await activityLogger.setCurrentUser(user);
    await activityLogger.logUserLogin('email', true);
    
    // Log session start event
    await activityLogger.logSystemEvent(
      'page_load',
      'User session started',
      { 
        page: 'dashboard',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        referrer: typeof document !== 'undefined' ? document.referrer : 'unknown'
      }
    );
    
    updateLastActivity();
  }, [user, updateLastActivity]);

  // End user session
  const endSession = useCallback(async () => {
    if (!user || !sessionStartTime.current) return;

    const sessionDuration = Date.now() - sessionStartTime.current.getTime();
    
    await activityLogger.logUserLogout();
    await activityLogger.logSystemEvent(
      'performance',
      'Session ended',
      { 
        sessionDuration: Math.round(sessionDuration / 1000),
        userId: user.id 
      },
      'info'
    );

    // Clear timeouts
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    sessionStartTime.current = null;
  }, [user]);

  // Track engagement activity
  const trackEngagementActivity = useCallback(() => {
    if (!user || !trackEngagement) return;
    
    updateLastActivity();
  }, [user, trackEngagement, updateLastActivity]);

  // Auto-start session when user is available
  useEffect(() => {
    if (user && autoStartSession && !sessionStartTime.current) {
      startSession();
    }
  }, [user, autoStartSession, startSession]);

  // Set up activity listeners
  useEffect(() => {
    if (!trackEngagement || !user) return;

    const events = ['click', 'scroll', 'keypress', 'mousemove'];
    
    const handleActivity = () => {
      trackEngagementActivity();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [trackEngagement, user, trackEngagementActivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  return {
    sessionStartTime: sessionStartTime.current,
    lastActivityTime: lastActivityTime.current,
    startSession,
    endSession,
    updateLastActivity,
    trackEngagementActivity
  };
};
