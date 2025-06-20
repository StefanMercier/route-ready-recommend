
import { logSecurityEvent } from './securityEventLogger';
import { SECURITY_CONFIG } from '@/config/security';

// Enhanced origin validation with environment detection
export const validateRequestOrigin = (expectedOrigin?: string): boolean => {
  if (typeof window === 'undefined') return true;
  
  const currentOrigin = window.location.origin;
  
  // Use allowed origins from security config
  const allowedOrigins = [...SECURITY_CONFIG.ALLOWED_ORIGINS];
  
  // Add expected origin if provided
  if (expectedOrigin && !allowedOrigins.includes(expectedOrigin)) {
    allowedOrigins.push(expectedOrigin);
  }
  
  const isValid = allowedOrigins.includes(currentOrigin);
  
  if (!isValid) {
    logSecurityEvent({
      event_type: 'INVALID_ORIGIN',
      severity: 'high',
      details: {
        currentOrigin,
        allowedOrigins: allowedOrigins.filter(origin => !origin.includes('localhost')), // Don't log localhost in production
        userAgent: navigator.userAgent.substring(0, 100),
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return isValid;
};

// Rate limiting for API requests
const requestCounts = new Map<string, { count: number; lastReset: number }>();

export const validateRequestRate = (identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const current = requestCounts.get(identifier) || { count: 0, lastReset: now };
  
  // Reset counter if window has passed
  if (now - current.lastReset > windowMs) {
    current.count = 0;
    current.lastReset = now;
  }
  
  current.count++;
  requestCounts.set(identifier, current);
  
  if (current.count > maxRequests) {
    logSecurityEvent({
      event_type: 'RATE_LIMIT_EXCEEDED',
      severity: 'medium',
      details: {
        identifier: identifier.substring(0, 20) + '...',
        requestCount: current.count,
        maxRequests,
        windowMs
      }
    });
    return false;
  }
  
  return true;
};

// Enhanced request validation with CSRF protection
export const validateSecureRequest = (csrfToken?: string): boolean => {
  // Validate origin
  if (!validateRequestOrigin()) {
    return false;
  }
  
  // Validate CSRF token for state-changing operations
  if (csrfToken) {
    const storedToken = sessionStorage.getItem('csrf_token');
    if (!storedToken || storedToken !== csrfToken) {
      logSecurityEvent({
        event_type: 'CSRF_TOKEN_MISMATCH',
        severity: 'high',
        details: {
          hasToken: !!csrfToken,
          hasStoredToken: !!storedToken,
          timestamp: new Date().toISOString()
        }
      });
      return false;
    }
  }
  
  return true;
};
