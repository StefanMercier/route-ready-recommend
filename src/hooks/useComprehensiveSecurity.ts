
import { useEffect, useCallback } from 'react';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { useSecurityMiddleware } from './useSecurityMiddleware';
import { useCSRF } from '@/components/CSRFProtection';
import { validateSecureRequest } from '@/utils/requestValidator';
import { logSecurityEvent } from '@/utils/securityEventLogger';

export const useComprehensiveSecurity = () => {
  const { validateAndSanitizeInput, detectSuspiciousActivity } = useSecurityMonitoring();
  const { secureFormSubmit, performSecurityCheck } = useSecurityMiddleware();
  const { token: csrfToken, validateToken } = useCSRF();

  // Enhanced form submission with comprehensive security checks
  const secureSubmit = useCallback(async (
    formData: any, 
    formType: string,
    options: { requireCSRF?: boolean } = {}
  ) => {
    try {
      // Pre-submission security checks
      if (!performSecurityCheck(`form_submission_${formType}`)) {
        throw new Error('Security check failed. Please try again later.');
      }

      // CSRF validation for state-changing operations
      if (options.requireCSRF && !validateSecureRequest(csrfToken)) {
        throw new Error('Security validation failed. Please refresh the page and try again.');
      }

      // Rate limiting and origin validation
      const result = await secureFormSubmit(formData, formType);
      
      if (result) {
        logSecurityEvent({
          event_type: 'SECURE_FORM_SUCCESS',
          severity: 'low',
          details: {
            formType,
            hasCSRF: !!csrfToken,
            timestamp: new Date().toISOString()
          }
        });
      }

      return result;
    } catch (error) {
      logSecurityEvent({
        event_type: 'SECURE_FORM_ERROR',
        severity: 'medium',
        details: {
          formType,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      });
      throw error;
    }
  }, [csrfToken, performSecurityCheck, secureFormSubmit, validateToken]);

  // Enhanced input validation with security monitoring
  const validateInput = useCallback((input: string, fieldName: string) => {
    const result = validateAndSanitizeInput(input, fieldName);
    
    // Additional monitoring for admin operations
    if (fieldName.includes('admin') || fieldName.includes('role')) {
      detectSuspiciousActivity('admin_input_validation', {
        field: fieldName,
        isValid: result.isValid,
        hasErrors: result.errors.length > 0
      });
    }
    
    return result;
  }, [validateAndSanitizeInput, detectSuspiciousActivity]);

  return {
    secureSubmit,
    validateInput,
    performSecurityCheck,
    csrfToken,
    isCSRFValid: (token: string) => validateToken(token)
  };
};
