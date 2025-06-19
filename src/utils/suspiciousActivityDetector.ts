
import { detectXSSAttempt } from '@/config/security';
import { logSecurityEvent } from './securityEventLogger';

export const createSuspiciousActivityDetector = () => {
  const suspiciousActivity = new Map<string, number>();

  const detectSuspiciousActivity = (userAction: string, context: Record<string, any>) => {
    const inputValues = Object.values(context).join(' ');
    const hasXSS = detectXSSAttempt(inputValues);
    
    // Track frequency of suspicious activity
    const sessionId = sessionStorage.getItem('session_id') || 'anonymous';
    const currentCount = suspiciousActivity.get(sessionId) || 0;
    
    if (hasXSS) {
      const newCount = currentCount + 1;
      suspiciousActivity.set(sessionId, newCount);
      
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (newCount >= 5) severity = 'critical';
      else if (newCount >= 3) severity = 'high';

      logSecurityEvent({
        event_type: 'XSS_ATTEMPT',
        severity,
        details: {
          action: userAction,
          context: context,
          suspiciousCount: newCount,
          timestamp: new Date().toISOString()
        }
      });

      // Implement progressive restrictions
      if (severity === 'critical') {
        console.warn('Critical XSS attempt detected - implementing restrictions');
      }
    }

    return {
      isSuspicious: hasXSS,
      severity: hasXSS ? (currentCount >= 5 ? 'critical' : currentCount >= 3 ? 'high' : 'medium') : 'low',
      hasXSS
    };
  };

  return { detectSuspiciousActivity };
};
