
// Security configuration and constants
export const SECURITY_CONFIG = {
  // Input validation limits
  MAX_INPUT_LENGTH: 1000,
  MAX_SHORT_INPUT_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  
  // Rate limiting - More restrictive
  MAX_FAILED_LOGIN_ATTEMPTS: 3, // Reduced from 5
  LOGIN_LOCKOUT_DURATION: 30 * 60 * 1000, // Increased to 30 minutes
  MAX_API_REQUESTS_PER_MINUTE: 30, // New limit
  MAX_FORM_SUBMISSIONS_PER_MINUTE: 5, // New limit
  
  // Session security
  CSRF_TOKEN_EXPIRY: 12 * 60 * 60 * 1000, // Reduced to 12 hours
  SESSION_CHECK_INTERVAL: 30 * 60 * 1000, // Reduced to 30 minutes
  SESSION_TIMEOUT: 4 * 60 * 60 * 1000, // 4 hours session timeout
  
  // XSS prevention patterns - Enhanced
  XSS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /data:application/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src\s*=\s*["\']javascript:/gi,
    /<link[^>]*href\s*=\s*["\']javascript:/gi,
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /Function\s*\(/gi,
    /document\.(write|writeln)/gi,
    /window\.(location|open)/gi,
    /(alert|confirm|prompt)\s*\(/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<applet[^>]*>/gi,
    /expression\s*\(/gi,
    /url\s*\(/gi,
  ],
  
  // Environment-aware allowed origins - More restrictive
  ALLOWED_ORIGINS: (() => {
    const origins = [];
    
    // Production origins
    if (typeof window !== 'undefined' && window.location.origin.includes('lovable.app')) {
      origins.push(window.location.origin);
    }
    
    // Development origins (only in development)
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      origins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
    
    // Supabase origin (always allowed)
    origins.push('https://gklfrynehiqrwbddvaaa.supabase.co');
    
    return origins;
  })(),
  
  // Content Security Policy - Updated for Google Maps
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.gstatic.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://*.googleapis.com", "https://*.gstatic.com"],
    'connect-src': ["'self'", "https://gklfrynehiqrwbddvaaa.supabase.co", "https://maps.googleapis.com", "https://*.googleapis.com"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
    'block-all-mixed-content': []
  },
  
  // Security headers
  SECURITY_HEADERS: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
  }
} as const;

// Enhanced input sanitization utility
export const sanitizeInput = (input: string, maxLength: number = SECURITY_CONFIG.MAX_INPUT_LENGTH): string => {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input.trim();
  
  // Length validation
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove XSS patterns
  SECURITY_CONFIG.XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>"'&]/g, '');
  
  // Remove SQL injection patterns
  sanitized = sanitized.replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, '');
  
  return sanitized;
};

// Advanced XSS detection
export const detectXSSAttempt = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false;
  
  return SECURITY_CONFIG.XSS_PATTERNS.some(pattern => pattern.test(input));
};

// Generate Content Security Policy header
export const generateCSPHeader = (): string => {
  return Object.entries(SECURITY_CONFIG.CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
};

// Environment-aware CORS headers - More restrictive
export const getCORSHeaders = (): Record<string, string> => {
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const allowedOrigins = isDevelopment 
    ? SECURITY_CONFIG.ALLOWED_ORIGINS.join(', ')
    : SECURITY_CONFIG.ALLOWED_ORIGINS.filter(origin => !origin.includes('localhost')).join(', ');
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '3600'
  };
};

// Security event severity levels
export const SECURITY_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

// Enhanced security monitoring
export const shouldBlockRequest = (eventType: string, severity: string): boolean => {
  const criticalEvents = ['XSS_ATTEMPT', 'SQL_INJECTION_ATTEMPT', 'CSRF_TOKEN_MISMATCH'];
  const highSeverityEvents = ['INVALID_ORIGIN', 'RATE_LIMIT_EXCEEDED', 'ADMIN_ACCESS_ATTEMPT'];
  
  return criticalEvents.includes(eventType) || 
         (severity === SECURITY_SEVERITY.CRITICAL) ||
         (highSeverityEvents.includes(eventType) && severity === SECURITY_SEVERITY.HIGH);
};
