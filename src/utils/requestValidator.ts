
import { logSecurityEvent } from './securityEventLogger';

const ALLOWED_ORIGINS = [
  'https://gklfrynehiqrwbddvaaa.supabase.co',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:3000'
];

// Enhanced origin validation with environment detection
export const validateRequestOrigin = (expectedOrigin?: string): boolean => {
  if (typeof window === 'undefined') return true;
  
  const currentOrigin = window.location.origin;
  
  // Build allowed origins list
  const allowedOrigins = [...ALLOWED_ORIGINS];
  
  // Add expected origin if provided
  if (expectedOrigin && !allowedOrigins.includes(expectedOrigin)) {
    allowedOrigins.push(expectedOrigin);
  }
  
  // Check for Lovable preview URLs (pattern: *.lovable.app)
  if (currentOrigin.endsWith('.lovable.app')) {
    allowedOrigins.push(currentOrigin);
  }
  
  const isValid = allowedOrigins.includes(currentOrigin);
  
  if (!isValid) {
    logSecurityEvent({
      event_type: 'INVALID_ORIGIN',
      severity: 'high',
      details: {
        currentOrigin,
        allowedOrigins: allowedOrigins.filter(origin => !origin.includes('localhost')), // Don't log localhost in production
        userAgent: navigator.userAgent,
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
