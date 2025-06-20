
import { logSecurityEvent } from './securityEventLogger';
import { securityMonitor } from './securityMonitor';
import { SECURITY_CONFIG, SECURITY_SEVERITY } from '@/config/security';

// Enhanced origin validation with environment detection
export const validateRequestOrigin = (expectedOrigin?: string): boolean => {
  if (typeof window === 'undefined') return true;
  
  const currentOrigin = window.location.origin;
  const allowedOrigins = [...SECURITY_CONFIG.ALLOWED_ORIGINS];
  
  if (expectedOrigin && !allowedOrigins.includes(expectedOrigin)) {
    allowedOrigins.push(expectedOrigin);
  }
  
  const isValid = allowedOrigins.includes(currentOrigin);
  
  if (!isValid) {
    securityMonitor.evaluateSecurityEvent('INVALID_ORIGIN', SECURITY_SEVERITY.HIGH, {
      currentOrigin,
      allowedOrigins: allowedOrigins.filter(origin => !origin.includes('localhost')),
      userAgent: navigator.userAgent.substring(0, 100),
      timestamp: new Date().toISOString()
    });
  }
  
  return isValid;
};

// Enhanced rate limiting with different limits for different operations
const requestCounts = new Map<string, { count: number; lastReset: number }>();

export const validateRequestRate = (
  identifier: string, 
  operation: 'api' | 'form' | 'auth' = 'api'
): boolean => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  // Different limits for different operations
  const maxRequests = {
    'api': SECURITY_CONFIG.MAX_API_REQUESTS_PER_MINUTE,
    'form': SECURITY_CONFIG.MAX_FORM_SUBMISSIONS_PER_MINUTE,
    'auth': 5 // Strict limit for auth operations
  }[operation];
  
  const key = `${identifier}_${operation}`;
  const current = requestCounts.get(key) || { count: 0, lastReset: now };
  
  // Reset counter if window has passed
  if (now - current.lastReset > windowMs) {
    current.count = 0;
    current.lastReset = now;
  }
  
  current.count++;
  requestCounts.set(key, current);
  
  if (current.count > maxRequests) {
    securityMonitor.evaluateSecurityEvent('RATE_LIMIT_EXCEEDED', SECURITY_SEVERITY.MEDIUM, {
      identifier: identifier.substring(0, 20) + '...',
      operation,
      requestCount: current.count,
      maxRequests,
      windowMs
    });
    return false;
  }
  
  // Track suspicious activity for high request rates
  if (current.count > maxRequests * 0.8) {
    securityMonitor.trackSuspiciousActivity(identifier, `high_${operation}_rate`);
  }
  
  return true;
};

// Enhanced request validation with comprehensive security checks
export const validateSecureRequest = (options: {
  csrfToken?: string;
  operation?: 'api' | 'form' | 'auth';
  requireCSRF?: boolean;
}): boolean => {
  const { csrfToken, operation = 'api', requireCSRF = false } = options;
  
  // Check if request should be blocked due to previous security events
  const sessionId = sessionStorage.getItem('session_id') || 'unknown';
  if (securityMonitor.isBlocked(sessionId)) {
    return false;
  }
  
  // Validate origin
  if (!validateRequestOrigin()) {
    return false;
  }
  
  // Validate rate limiting
  if (!validateRequestRate(sessionId, operation)) {
    return false;
  }
  
  // Validate CSRF token for state-changing operations
  if (requireCSRF || csrfToken) {
    const storedToken = sessionStorage.getItem('csrf_token');
    if (!storedToken || storedToken !== csrfToken) {
      securityMonitor.evaluateSecurityEvent('CSRF_TOKEN_MISMATCH', SECURITY_SEVERITY.HIGH, {
        hasToken: !!csrfToken,
        hasStoredToken: !!storedToken,
        operation,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }
  
  return true;
};

// Enhanced input validation with security monitoring
export const validateSecureInput = (input: string, fieldName: string, maxLength?: number): {
  isValid: boolean;
  sanitized: string;
  errors: string[];
} => {
  const errors: string[] = [];
  let sanitized = input || '';
  
  // Basic validation
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '', errors: ['Invalid input type'] };
  }
  
  // Length validation
  const limit = maxLength || SECURITY_CONFIG.MAX_INPUT_LENGTH;
  if (input.length > limit) {
    errors.push(`Input too long: maximum ${limit} characters allowed`);
    sanitized = input.substring(0, limit);
  }
  
  // XSS detection and prevention
  const xssPatterns = SECURITY_CONFIG.XSS_PATTERNS;
  let hasXSS = false;
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      hasXSS = true;
      break;
    }
  }
  
  if (hasXSS) {
    errors.push('Potentially malicious content detected');
    securityMonitor.evaluateSecurityEvent('XSS_ATTEMPT', SECURITY_SEVERITY.CRITICAL, {
      fieldName,
      input: input.substring(0, 100) + '...',
      userAgent: navigator?.userAgent?.substring(0, 100) || 'unknown'
    });
  }
  
  // SQL injection detection
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
    /(;|\||&)/g,
    /('|(\\')|("|\\"))/g
  ];
  
  let hasSQLInjection = false;
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      hasSQLInjection = true;
      break;
    }
  }
  
  if (hasSQLInjection) {
    errors.push('Invalid characters detected');
    securityMonitor.evaluateSecurityEvent('SQL_INJECTION_ATTEMPT', SECURITY_SEVERITY.CRITICAL, {
      fieldName,
      input: input.substring(0, 100) + '...'
    });
  }
  
  // Sanitize the input
  sanitized = sanitized.trim();
  sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove HTML tags
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, ''); // Remove control characters
  sanitized = sanitized.replace(/[<>"'&]/g, ''); // Remove dangerous characters
  
  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  };
};

// Session security validation
export const validateSession = (): boolean => {
  const sessionStart = sessionStorage.getItem('session_start');
  if (!sessionStart) {
    return false;
  }
  
  const sessionAge = Date.now() - parseInt(sessionStart);
  if (sessionAge > SECURITY_CONFIG.SESSION_TIMEOUT) {
    // Session expired
    sessionStorage.clear();
    securityMonitor.evaluateSecurityEvent('SESSION_EXPIRED', SECURITY_SEVERITY.LOW, {
      sessionAge,
      maxAge: SECURITY_CONFIG.SESSION_TIMEOUT
    });
    return false;
  }
  
  return true;
};

// Initialize session tracking
export const initializeSession = (): void => {
  if (!sessionStorage.getItem('session_id')) {
    const sessionId = crypto.getRandomValues(new Uint8Array(16))
      .join('')
      .substring(0, 32);
    sessionStorage.setItem('session_id', sessionId);
    sessionStorage.setItem('session_start', Date.now().toString());
  }
};
