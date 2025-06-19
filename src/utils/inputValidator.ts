
import { SECURITY_CONFIG, detectXSSAttempt, sanitizeInput } from '@/config/security';

// Enhanced email validation with stricter rules
const validateEmail = (email: string): boolean => {
  // Basic format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) return false;
  
  // Additional security checks
  if (email.length > SECURITY_CONFIG.MAX_EMAIL_LENGTH) return false;
  if (email.includes('..')) return false; // Consecutive dots
  if (email.startsWith('.') || email.endsWith('.')) return false;
  if (email.includes('@.') || email.includes('.@')) return false;
  
  return true;
};

export const validateAndSanitizeInput = (input: string, fieldName: string): { sanitized: string; isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!input || typeof input !== 'string') {
    return { sanitized: '', isValid: false, errors: ['Invalid input type'] };
  }

  // Length validation - using appropriate max length based on field type
  let maxLength: number = SECURITY_CONFIG.MAX_INPUT_LENGTH;
  if (fieldName === 'email') {
    maxLength = SECURITY_CONFIG.MAX_EMAIL_LENGTH;
  } else if (fieldName === 'departure' || fieldName === 'destination' || fieldName === 'fullName') {
    maxLength = SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH;
  }

  if (input.length > maxLength) {
    errors.push(`Input too long: maximum ${maxLength} characters allowed`);
  }

  // Enhanced email validation
  if (fieldName === 'email' && !validateEmail(input)) {
    errors.push('Invalid email format');
  }

  // XSS detection
  if (detectXSSAttempt(input)) {
    errors.push('Potentially malicious content detected');
  }

  // Sanitize the input
  const sanitized = sanitizeInput(input, maxLength);

  return {
    sanitized,
    isValid: errors.length === 0,
    errors
  };
};

// Additional validation for admin operations
export const validateAdminInput = (input: string, fieldName: string): { sanitized: string; isValid: boolean; errors: string[] } => {
  const baseValidation = validateAndSanitizeInput(input, fieldName);
  
  // Additional admin-specific validations
  if (fieldName === 'email' && baseValidation.isValid) {
    // Ensure email doesn't contain potential admin bypass patterns
    const suspiciousPatterns = ['admin@', 'root@', 'system@', 'test@'];
    const lowercaseEmail = input.toLowerCase();
    
    if (suspiciousPatterns.some(pattern => lowercaseEmail.includes(pattern))) {
      baseValidation.errors.push('Email contains restricted patterns');
      baseValidation.isValid = false;
    }
  }
  
  return baseValidation;
};
