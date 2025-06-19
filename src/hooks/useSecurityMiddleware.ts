
import { useEffect, useCallback } from 'react';
import { logSecurityEvent, isSecurityRestricted } from '@/utils/securityEventLogger';
import { validateRequestOrigin, validateRequestRate } from '@/utils/requestValidator';
import { useAuth } from '@/contexts/AuthContext';

export const useSecurityMiddleware = () => {
  const { user } = useAuth();

  // Initialize security monitoring on mount
  useEffect(() => {
    const sessionId = crypto.getRandomValues(new Uint8Array(16)).join('');
    sessionStorage.setItem('session_id', sessionId);

    // Log session start
    logSecurityEvent({
      event_type: 'SESSION_START',
      severity: 'low',
      details: {
        userAgent: navigator.userAgent.substring(0, 100),
        timestamp: new Date().toISOString()
      }
    });

    // Monitor for suspicious browser behavior
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent({
          event_type: 'TAB_HIDDEN',
          severity: 'low'
        });
      }
    };

    // Monitor for developer tools
    const handleDevTools = () => {
      if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
        logSecurityEvent({
          event_type: 'DEV_TOOLS_DETECTED',
          severity: 'medium',
          details: {
            outerHeight: window.outerHeight,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            innerWidth: window.innerWidth
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleDevTools);

    return () => {
      logSecurityEvent({
        event_type: 'SESSION_END',
        severity: 'low'
      });
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleDevTools);
    };
  }, []);

  // Secure form submission handler
  const secureFormSubmit = useCallback(async (formData: any, formType: string) => {
    // Check security restrictions
    if (isSecurityRestricted()) {
      throw new Error('Security restrictions are active. Please try again later.');
    }

    // Validate origin
    if (!validateRequestOrigin()) {
      throw new Error('Invalid request origin detected.');
    }

    // Rate limiting
    const identifier = user?.id || sessionStorage.getItem('session_id') || 'anonymous';
    if (!validateRequestRate(identifier, 10, 60000)) { // 10 requests per minute
      throw new Error('Rate limit exceeded. Please slow down.');
    }

    // Log form submission
    logSecurityEvent({
      event_type: 'SECURE_FORM_SUBMISSION',
      severity: 'low',
      details: {
        formType,
        userId: user?.id || 'anonymous',
        timestamp: new Date().toISOString()
      }
    });

    return true;
  }, [user]);

  // Security check for sensitive operations
  const performSecurityCheck = useCallback((operation: string) => {
    if (isSecurityRestricted()) {
      logSecurityEvent({
        event_type: 'BLOCKED_OPERATION',
        severity: 'medium',
        details: { operation }
      });
      return false;
    }

    if (!validateRequestOrigin()) {
      logSecurityEvent({
        event_type: 'INVALID_ORIGIN_OPERATION',
        severity: 'high',
        details: { operation }
      });
      return false;
    }

    return true;
  }, []);

  return {
    secureFormSubmit,
    performSecurityCheck,
    isRestricted: isSecurityRestricted()
  };
};
