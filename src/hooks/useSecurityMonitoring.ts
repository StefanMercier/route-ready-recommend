
import { useEffect } from 'react';
import { logSecurityEvent } from '@/utils/securityEventLogger';
import { createFailedLoginMonitor } from '@/utils/failedLoginMonitor';
import { validateAndSanitizeInput } from '@/utils/inputValidator';
import { createSuspiciousActivityDetector } from '@/utils/suspiciousActivityDetector';
import { validateRequestOrigin } from '@/utils/requestValidator';
import { detectXSSAttempt } from '@/config/security';

export const useSecurityMonitoring = () => {
  const monitorFailedLoginAttempts = () => createFailedLoginMonitor();
  const { detectSuspiciousActivity } = createSuspiciousActivityDetector();

  const enhancedValidateAndSanitizeInput = (input: string, fieldName: string) => {
    const result = validateAndSanitizeInput(input, fieldName);
    
    // Log XSS attempts if detected
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
    validateAndSanitizeInput: enhancedValidateAndSanitizeInput
  };
};
