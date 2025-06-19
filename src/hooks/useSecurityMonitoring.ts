
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
}

export const useSecurityMonitoring = () => {
  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      // Log security events for monitoring
      console.log('Security Event:', event);
      
      // In a production environment, you would send this to your security monitoring service
      // For now, we'll just log to console and could extend to store in database
      
      if (event.event_type === 'SUSPICIOUS_ACTIVITY') {
        // Could trigger additional security measures
        console.warn('Suspicious activity detected:', event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const monitorFailedLoginAttempts = () => {
    let failedAttempts = 0;
    const maxAttempts = 5;
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    
    return {
      recordFailedAttempt: () => {
        failedAttempts++;
        if (failedAttempts >= maxAttempts) {
          logSecurityEvent({
            event_type: 'MULTIPLE_FAILED_LOGINS',
            details: {
              attempts: failedAttempts,
              timeWindow: timeWindow
            }
          });
        }
        
        // Reset counter after time window
        setTimeout(() => {
          failedAttempts = Math.max(0, failedAttempts - 1);
        }, timeWindow);
      },
      
      isBlocked: () => failedAttempts >= maxAttempts
    };
  };

  const validateRequestOrigin = (expectedOrigin?: string): boolean => {
    if (typeof window === 'undefined') return true;
    
    const currentOrigin = window.location.origin;
    const allowedOrigins = [
      'https://your-app.lovable.app',
      'http://localhost:3000',
      expectedOrigin
    ].filter(Boolean);
    
    return allowedOrigins.includes(currentOrigin);
  };

  const detectSuspiciousActivity = (userAction: string, context: Record<string, any>) => {
    // Basic suspicious activity detection patterns
    const suspiciousPatterns = [
      /script\s*:/i,
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i
    ];

    const inputValues = Object.values(context).join(' ');
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(inputValues));

    if (isSuspicious) {
      logSecurityEvent({
        event_type: 'SUSPICIOUS_ACTIVITY',
        details: {
          action: userAction,
          context: context,
          timestamp: new Date().toISOString()
        }
      });
    }

    return isSuspicious;
  };

  return {
    logSecurityEvent,
    monitorFailedLoginAttempts,
    validateRequestOrigin,
    detectSuspiciousActivity
  };
};
