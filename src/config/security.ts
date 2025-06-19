
// Security configuration and constants
export const SECURITY_CONFIG = {
  // Input validation limits
  MAX_INPUT_LENGTH: 1000,
  MAX_SHORT_INPUT_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  
  // Rate limiting
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Session security
  CSRF_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_CHECK_INTERVAL: 60 * 60 * 1000, // 1 hour
  
  // XSS prevention patterns
  XSS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
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
  ],
  
  // Content Security Policy
  CSP_DIRECTIVES: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https://maps.googleapis.com", "https://maps.gstatic.com"],
    'connect-src': ["'self'", "https://gklfrynehiqrwbddvaaa.supabase.co"],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  }
} as const;

// Enhanced input sanitization utility - updated to accept any number for maxLength
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
