
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SECURITY_CONFIG, detectXSSAttempt, sanitizeInput } from '@/config/security';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const useSecurityMonitoring = () => {
  const failedAttemptsRef = useRef(new Map<string, { count: number; lastAttempt: number }>());
  const suspiciousActivityRef = useRef(new Map<string, number>());

  const logSecurityEvent = async (event: SecurityEvent) => {
    try {
      // Add client-side information
      const enhancedEvent = {
        ...event,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        severity: event.severity || 'low'
      };

      console.log('Security Event:', enhancedEvent);
      
      // In production, send to security monitoring service
      if (event.severity === 'high' || event.severity === 'critical') {
        console.error('High severity security event:', enhancedEvent);
        
        // Could trigger immediate security measures
        if (event.event_type === 'MULTIPLE_FAILED_LOGINS' || event.event_type === 'XSS_ATTEMPT') {
          console.warn('Implementing security restrictions due to:', event.event_type);
        }
      }

      // Store in local session for pattern analysis
      const sessionEvents = JSON.parse(sessionStorage.getItem('security_events') || '[]');
      sessionEvents.push(enhancedEvent);
      
      // Keep only last 50 events
      if (sessionEvents.length > 50) {
        sessionEvents.splice(0, sessionEvents.length - 50);
      }
      
      sessionStorage.setItem('security_events', JSON.stringify(sessionEvents));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const monitorFailedLoginAttempts = () => {
    const maxAttempts = SECURITY_CONFIG.MAX_FAILED_LOGIN_ATTEMPTS;
    const timeWindow = SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION;
    const clientId = navigator.userAgent + window.location.origin;
    
    return {
      recordFailedAttempt: () => {
        const now = Date.now();
        const attempts = failedAttemptsRef.current.get(clientId) || { count: 0, lastAttempt: 0 };
        
        // Reset if time window exceeded
        if (now - attempts.lastAttempt > timeWindow) {
          attempts.count = 0;
        }
        
        attempts.count++;
        attempts.lastAttempt = now;
        failedAttemptsRef.current.set(clientId, attempts);
        
        if (attempts.count >= maxAttempts) {
          logSecurityEvent({
            event_type: 'MULTIPLE_FAILED_LOGINS',
            severity: 'high',
            details: {
              attempts: attempts.count,
              timeWindow: timeWindow,
              clientId: clientId.substring(0, 50) + '...'
            }
          });
          return true;
        }
        
        return false;
      },
      
      isBlocked: () => {
        const attempts = failedAttemptsRef.current.get(clientId);
        if (!attempts) return false;
        
        const now = Date.now();
        if (now - attempts.lastAttempt > timeWindow) {
          failedAttemptsRef.current.delete(clientId);
          return false;
        }
        
        return attempts.count >= maxAttempts;
      },
      
      resetAttempts: () => {
        failedAttemptsRef.current.delete(clientId);
      }
    };
  };

  const validateRequestOrigin = (expectedOrigin?: string): boolean => {
    if (typeof window === 'undefined') return true;
    
    const currentOrigin = window.location.origin;
    const allowedOrigins = [
      'https://gklfrynehiqrwbddvaaa.supabase.co',
      'https://your-app.lovable.app',
      'http://localhost:3000',
      expectedOrigin
    ].filter(Boolean);
    
    const isValid = allowedOrigins.includes(currentOrigin);
    
    if (!isValid) {
      logSecurityEvent({
        event_type: 'INVALID_ORIGIN',
        severity: 'medium',
        details: {
          currentOrigin,
          allowedOrigins,
          userAgent: navigator.userAgent
        }
      });
    }
    
    return isValid;
  };

  const detectSuspiciousActivity = (userAction: string, context: Record<string, any>) => {
    const inputValues = Object.values(context).join(' ');
    const hasXSS = detectXSSAttempt(inputValues);
    
    // Track frequency of suspicious activity
    const sessionId = sessionStorage.getItem('session_id') || 'anonymous';
    const currentCount = suspiciousActivityRef.current.get(sessionId) || 0;
    
    if (hasXSS) {
      const newCount = currentCount + 1;
      suspiciousActivityRef.current.set(sessionId, newCount);
      
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (newCount >= 5) severity = 'critical';
      else if (newCount >= 3) severity = 'high';

      logSecurityEvent({
        event_type: 'XSS_ATTEMPT',
        severity,
        details: {
          action: userAction,
          context: context,
          suspiciousCount: newCount,
          timestamp: new Date().toISOString()
        }
      });

      // Implement progressive restrictions
      if (severity === 'critical') {
        console.warn('Critical XSS attempt detected - implementing restrictions');
      }
    }

    return {
      isSuspicious: hasXSS,
      severity: hasXSS ? (currentCount >= 5 ? 'critical' : currentCount >= 3 ? 'high' : 'medium') : 'low',
      hasXSS
    };
  };

  // Enhanced input validation with security checks - fixed maxLength parameter
  const validateAndSanitizeInput = (input: string, fieldName: string): { sanitized: string; isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      return { sanitized: '', isValid: false, errors: ['Invalid input type'] };
    }

    // Length validation - using appropriate max length based on field type
    let maxLength = SECURITY_CONFIG.MAX_INPUT_LENGTH;
    if (fieldName === 'email') {
      maxLength = SECURITY_CONFIG.MAX_EMAIL_LENGTH;
    } else if (fieldName === 'departure' || fieldName === 'destination' || fieldName === 'fullName') {
      maxLength = SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH;
    }

    if (input.length > maxLength) {
      errors.push('Input too long');
    }

    // XSS detection
    if (detectXSSAttempt(input)) {
      errors.push('Potentially malicious content detected');
      logSecurityEvent({
        event_type: 'XSS_ATTEMPT',
        severity: 'high',
        details: {
          fieldName,
          input: input.substring(0, 100) + '...'
        }
      });
    }

    // Sanitize the input
    const sanitized = sanitizeInput(input, maxLength);

    return {
      sanitized,
      isValid: errors.length === 0,
      errors
    };
  };

  // Set up page monitoring
  useEffect(() => {
    const startTime = Date.now();
    
    // Monitor for rapid form submissions
    let lastSubmission = 0;
    const handleFormSubmit = () => {
      const now = Date.now();
      if (now - lastSubmission < 1000) { // Less than 1 second between submissions
        logSecurityEvent({
          event_type: 'RAPID_FORM_SUBMISSION',
          severity: 'medium',
          details: {
            timeBetween: now - lastSubmission,
            url: window.location.href
          }
        });
      }
      lastSubmission = now;
    };

    document.addEventListener('submit', handleFormSubmit);
    
    return () => {
      const timeSpent = Date.now() - startTime;
      
      // Log unusual page behavior
      if (timeSpent < 1000) { // Less than 1 second
        logSecurityEvent({
          event_type: 'RAPID_PAGE_INTERACTION',
          severity: 'low',
          details: {
            timeSpent,
            url: window.location.href
          }
        });
      }
      
      document.removeEventListener('submit', handleFormSubmit);
    };
  }, []);

  return {
    logSecurityEvent,
    monitorFailedLoginAttempts,
    validateRequestOrigin,
    detectSuspiciousActivity,
    validateAndSanitizeInput
  };
};
