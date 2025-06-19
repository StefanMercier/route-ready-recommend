
import { SECURITY_CONFIG, detectXSSAttempt, sanitizeInput } from '@/config/security';

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
    errors.push('Input too long');
  }

  // XSS detection
  if (detectXSSAttempt(input)) {
    errors.push('Potentially malicious content detected');
    // Note: logSecurityEvent would be called from the hook that uses this utility
  }

  // Sanitize the input
  const sanitized = sanitizeInput(input, maxLength);

  return {
    sanitized,
    isValid: errors.length === 0,
    errors
  };
};
