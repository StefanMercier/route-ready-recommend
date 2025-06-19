
import { logSecurityEvent } from './securityEventLogger';

export const validateRequestOrigin = (expectedOrigin?: string): boolean => {
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
