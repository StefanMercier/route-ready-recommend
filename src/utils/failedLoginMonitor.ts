
import { SECURITY_CONFIG } from '@/config/security';
import { logSecurityEvent } from './securityEventLogger';

export const createFailedLoginMonitor = () => {
  const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
  const maxAttempts = SECURITY_CONFIG.MAX_FAILED_LOGIN_ATTEMPTS;
  const timeWindow = SECURITY_CONFIG.LOGIN_LOCKOUT_DURATION;
  const clientId = navigator.userAgent + window.location.origin;
  
  return {
    recordFailedAttempt: () => {
      const now = Date.now();
      const attempts = failedAttempts.get(clientId) || { count: 0, lastAttempt: 0 };
      
      // Reset if time window exceeded
      if (now - attempts.lastAttempt > timeWindow) {
        attempts.count = 0;
      }
      
      attempts.count++;
      attempts.lastAttempt = now;
      failedAttempts.set(clientId, attempts);
      
      if (attempts.count >= maxAttempts) {
        logSecurityEvent({
          event_type: 'MULTIPLE_FAILED_LOGINS',
          severity: 'high',
          details: {
            attempts: attempts.count,
            timeWindow: timeWindow,
            clientId: clientId.substring(0, 50) + '...'
          }
        });
        return true;
      }
      
      return false;
    },
    
    isBlocked: () => {
      const attempts = failedAttempts.get(clientId);
      if (!attempts) return false;
      
      const now = Date.now();
      if (now - attempts.lastAttempt > timeWindow) {
        failedAttempts.delete(clientId);
        return false;
      }
      
      return attempts.count >= maxAttempts;
    },
    
    resetAttempts: () => {
      failedAttempts.delete(clientId);
    }
  };
};
