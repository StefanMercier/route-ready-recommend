
import { useEffect, useCallback } from 'react';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { useSecurityMiddleware as useBaseSecurityMiddleware } from './useSecurityMiddleware';
import { useCSRF } from '@/components/CSRFProtection';
import { validateSecureRequest, validateSecureInput, initializeSession, validateSession } from '@/utils/requestValidator';
import { useSecurityMiddleware } from '@/utils/securityMonitor';
import { SECURITY_SEVERITY } from '@/config/security';

export const useComprehensiveSecurity = () => {
  const { validateAndSanitizeInput, detectSuspiciousActivity } = useSecurityMonitoring();
  const { secureFormSubmit, performSecurityCheck } = useBaseSecurityMiddleware();
  const { token: csrfToken, validateToken } = useCSRF();
  const { checkSecurity, reportSecurityEvent, trackActivity, getSecurityStatus } = useSecurityMiddleware();

  // Initialize session on mount
  useEffect(() => {
    initializeSession();
    
    // Set up periodic session validation
    const sessionCheck = setInterval(() => {
      if (!validateSession()) {
        reportSecurityEvent('SESSION_VALIDATION_FAILED', SECURITY_SEVERITY.MEDIUM, {
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(sessionCheck);
  }, [reportSecurityEvent]);

  // Enhanced form submission with comprehensive security checks
  const secureSubmit = useCallback(async (
    formData: any, 
    formType: string,
    options: { requireCSRF?: boolean; rateLimit?: boolean } = {}
  ) => {
    const { requireCSRF = true, rateLimit = true } = options;
    
    try {
      // Pre-submission security checks
      if (!checkSecurity(`form_submission_${formType}`, { formType })) {
        throw new Error('Security check failed. Please try again later.');
      }

      //Track form submission activity
      if (rateLimit) {
        trackActivity('form_submission');
      }

      // Comprehensive request validation
      if (!validateSecureRequest({
        csrfToken: requireCSRF ? csrfToken : undefined,
        operation: 'form',
        requireCSRF
      })) {
        throw new Error('Security validation failed. Please refresh the page and try again.');
      }

      // Enhanced input validation for all form fields
      const validatedData: any = {};
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === 'string') {
          const validation = validateSecureInput(value, key);
          if (!validation.isValid) {
            throw new Error(`Invalid input in field "${key}": ${validation.errors.join(', ')}`);
          }
          validatedData[key] = validation.sanitized;
        } else {
          validatedData[key] = value;
        }
      }

      // Use the base secure form submit with validated data
      const result = await secureFormSubmit(validatedData, formType);
      
      if (result) {
        reportSecurityEvent('SECURE_FORM_SUCCESS', SECURITY_SEVERITY.LOW, {
          formType,
          hasCSRF: !!csrfToken,
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      reportSecurityEvent('SECURE_FORM_ERROR', SECURITY_SEVERITY.MEDIUM, {
        formType,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }, [csrfToken, checkSecurity, trackActivity, reportSecurityEvent, secureFormSubmit]);

  // Enhanced input validation with comprehensive security monitoring
  const validateInput = useCallback((input: string, fieldName: string, maxLength?: number) => {
    // Use the enhanced validator
    const result = validateSecureInput(input, fieldName, maxLength);
    
    // Additional monitoring for sensitive fields
    const sensitiveFields = ['email', 'password', 'admin', 'role', 'token'];
    if (sensitiveFields.some(field => fieldName.toLowerCase().includes(field))) {
      trackActivity('sensitive_field_access');
      
      if (!result.isValid) {
        detectSuspiciousActivity('sensitive_field_validation_failed', {
          field: fieldName,
          errors: result.errors
        });
      }
    }
    
    return result;
  }, [trackActivity, detectSuspiciousActivity]);

  // API request validation
  const validateAPIRequest = useCallback((endpoint: string, data?: any) => {
    if (!checkSecurity(`api_request_${endpoint}`, { endpoint })) {
      return false;
    }

    trackActivity('api_request');

    return validateSecureRequest({
      operation: 'api',
      requireCSRF: ['POST', 'PUT', 'DELETE'].includes(endpoint.split('_')[0]?.toUpperCase())
    });
  }, [checkSecurity, trackActivity]);

  // Admin operation validation
  const validateAdminOperation = useCallback((operation: string) => {
    if (!checkSecurity(`admin_${operation}`, { operation, isAdminOp: true })) {
      reportSecurityEvent('UNAUTHORIZED_ADMIN_ACCESS', SECURITY_SEVERITY.HIGH, {
        operation,
        timestamp: new Date().toISOString()
      });
      return false;
    }

    trackActivity('admin_operation');
    return true;
  }, [checkSecurity, trackActivity, reportSecurityEvent]);

  // Get security dashboard data
  const getSecurityDashboard = useCallback(() => {
    return {
      status: getSecurityStatus(),
      sessionValid: validateSession(),
      csrfToken: csrfToken ? 'present' : 'missing'
    };
  }, [getSecurityStatus, csrfToken]);

  return {
    // Form operations
    secureSubmit,
    validateInput,
    
    // API operations
    validateAPIRequest,
    performSecurityCheck,
    
    // Admin operations
    validateAdminOperation,
    
    // CSRF operations
    csrfToken,
    isCSRFValid: (token: string) => validateToken(token),
    
    // Security monitoring
    getSecurityDashboard,
    reportSecurityEvent,
    trackActivity,
    
    // Session validation
    validateSession: () => validateSession()
  };
};
