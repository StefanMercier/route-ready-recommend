
import { useEffect } from 'react';
import { logSecurityEvent } from '@/utils/securityEventLogger';
import { createFailedLoginMonitor } from '@/utils/failedLoginMonitor';
import { validateAndSanitizeInput } from '@/utils/inputValidator';
import { createSuspiciousActivityDetector } from '@/utils/suspiciousActivityDetector';
import { validateRequestOrigin } from '@/utils/requestValidator';

export const useSecurityMonitoring = () => {
  const monitorFailedLoginAttempts = () => createFailedLoginMonitor();
  const { detectSuspiciousActivity } = createSuspiciousActivityDetector();

  const enhancedValidateAndSanitizeInput = (input: string, fieldName: string) => {
    // For auth-related fields, use less aggressive validation
    const isAuthField = ['email', 'password', 'fullName'].includes(fieldName);
    
    if (isAuthField) {
      // Basic validation for auth fields - don't be overly aggressive
      if (!input || typeof input !== 'string') {
        return { sanitized: '', isValid: false, errors: ['Invalid input'] };
      }
      
      let sanitized = input.trim();
      
      // Basic length checks
      if (fieldName === 'email' && sanitized.length > 254) {
        sanitized = sanitized.substring(0, 254);
      } else if (fieldName === 'fullName' && sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
      }
      
      // Only remove obvious HTML tags for auth fields
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      
      return { sanitized, isValid: true, errors: [] };
    }
    
    // For non-auth fields, use the full validation
    const result = validateAndSanitizeInput(input, fieldName);
    
    // Log XSS attempts if detected (but not for auth fields)
    if (!result.isValid && result.errors.includes('Potentially malicious content detected')) {
      logSecurityEvent({
        event_type: 'XSS_ATTEMPT',
        severity: 'high',
        details: {
          fieldName,
          input: input.substring(0, 100) + '...'
        }
      });
    }
    
    return result;
  };

  // Set up page monitoring - but be less aggressive for auth pages
  useEffect(() => {
    const startTime = Date.now();
    const isAuthPage = window.location.pathname.includes('/auth');
    
    // Monitor for rapid form submissions - but be more lenient on auth pages
    let lastSubmission = 0;
    const handleFormSubmit = () => {
      const now = Date.now();
      const minInterval = isAuthPage ? 500 : 1000; // More lenient for auth pages
      
      if (now - lastSubmission < minInterval) {
        logSecurityEvent({
          event_type: 'RAPID_FORM_SUBMISSION',
          severity: 'low', // Reduced severity for auth pages
          details: {
            timeBetween: now - lastSubmission,
            url: window.location.href,
            isAuthPage
          }
        });
      }
      lastSubmission = now;
    };

    document.addEventListener('submit', handleFormSubmit);
    
    return () => {
      const timeSpent = Date.now() - startTime;
      
      // Only log if extremely fast (less than 500ms) and not on auth page
      if (timeSpent < 500 && !isAuthPage) {
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
    validateAndSanitizeInput: enhancedValidateAndSanitizeInput
  };
};
