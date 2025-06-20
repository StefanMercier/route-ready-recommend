import { logSecurityEvent } from './securityEventLogger';
import { SECURITY_CONFIG, SECURITY_SEVERITY, shouldBlockRequest } from '@/config/security';

interface SecurityAlert {
  type: string;
  severity: string;
  message: string;
  timestamp: number;
  blocked: boolean;
}

class SecurityMonitor {
  private alerts: SecurityAlert[] = [];
  private blockedIPs: Set<string> = new Set();
  private suspiciousActivity: Map<string, number> = new Map();

  // Monitor and potentially block requests based on security events
  public evaluateSecurityEvent(eventType: string, severity: string, details: any): boolean {
    const shouldBlock = shouldBlockRequest(eventType, severity);
    
    const alert: SecurityAlert = {
      type: eventType,
      severity,
      message: this.generateAlertMessage(eventType, details),
      timestamp: Date.now(),
      blocked: shouldBlock
    };

    this.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log the security event
    logSecurityEvent({
      event_type: eventType,
      severity: severity as any,
      details: {
        ...details,
        blocked: shouldBlock,
        alertId: this.generateAlertId()
      }
    });

    // Handle critical events
    if (shouldBlock) {
      this.handleCriticalEvent(eventType, details);
    }

    return !shouldBlock; // Return false if request should be blocked
  }

  // Monitor for patterns of suspicious activity
  public trackSuspiciousActivity(identifier: string, activityType: string): void {
    const key = `${identifier}_${activityType}`;
    const current = this.suspiciousActivity.get(key) || 0;
    const newCount = current + 1;
    
    this.suspiciousActivity.set(key, newCount);

    // Trigger alert after 5 suspicious activities from same source
    if (newCount >= 5) {
      this.evaluateSecurityEvent('SUSPICIOUS_ACTIVITY_PATTERN', SECURITY_SEVERITY.HIGH, {
        identifier: identifier.substring(0, 10) + '...',
        activityType,
        count: newCount
      });
    }

    // Clean up old entries
    setTimeout(() => {
      this.suspiciousActivity.delete(key);
    }, 60000 * 15); // Clean up after 15 minutes
  }

  // Get recent security alerts
  public getRecentAlerts(limit: number = 20): SecurityAlert[] {
    return this.alerts.slice(-limit).reverse();
  }

  // Check if an IP is currently blocked
  public isBlocked(identifier: string): boolean {
    return this.blockedIPs.has(identifier);
  }

  // Get security status summary
  public getSecurityStatus(): {
    totalAlerts: number;
    criticalAlerts: number;
    blockedRequests: number;
    lastAlert?: SecurityAlert;
  } {
    const criticalAlerts = this.alerts.filter(a => a.severity === SECURITY_SEVERITY.CRITICAL).length;
    const blockedRequests = this.alerts.filter(a => a.blocked).length;

    return {
      totalAlerts: this.alerts.length,
      criticalAlerts,
      blockedRequests,
      lastAlert: this.alerts[this.alerts.length - 1]
    };
  }

  private handleCriticalEvent(eventType: string, details: any): void {
    // Block IP for critical events
    if (details.clientIP || details.identifier) {
      const identifier = details.clientIP || details.identifier;
      this.blockedIPs.add(identifier);
      
      // Unblock after 1 hour
      setTimeout(() => {
        this.blockedIPs.delete(identifier);
      }, 60000 * 60);
    }

    // Additional critical event handling
    switch (eventType) {
      case 'XSS_ATTEMPT':
      case 'SQL_INJECTION_ATTEMPT':
        // Could trigger additional security measures
        console.warn('Critical security event detected:', eventType);
        break;
      case 'CSRF_TOKEN_MISMATCH':
        // Force session refresh
        sessionStorage.removeItem('csrf_token');
        break;
    }
  }

  private generateAlertMessage(eventType: string, details: any): string {
    const messages: Record<string, string> = {
      'XSS_ATTEMPT': 'Cross-site scripting attempt detected',
      'SQL_INJECTION_ATTEMPT': 'SQL injection attempt detected',
      'CSRF_TOKEN_MISMATCH': 'CSRF token validation failed',
      'RATE_LIMIT_EXCEEDED': 'Rate limit exceeded',
      'INVALID_ORIGIN': 'Request from invalid origin',
      'SUSPICIOUS_ACTIVITY_PATTERN': 'Pattern of suspicious activity detected',
      'ADMIN_ACCESS_ATTEMPT': 'Unauthorized admin access attempt'
    };

    return messages[eventType] || `Security event: ${eventType}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Enhanced security middleware for React components
export const useSecurityMiddleware = () => {
  const checkSecurity = (operation: string, details?: any): boolean => {
    // Check if the current session/IP is blocked
    const sessionId = sessionStorage.getItem('session_id') || 'unknown';
    
    if (securityMonitor.isBlocked(sessionId)) {
      securityMonitor.evaluateSecurityEvent('BLOCKED_REQUEST_ATTEMPT', SECURITY_SEVERITY.HIGH, {
        operation,
        sessionId: sessionId.substring(0, 10) + '...',
        ...details
      });
      return false;
    }

    return true;
  };

  const reportSecurityEvent = (eventType: string, severity: string, details?: any): void => {
    securityMonitor.evaluateSecurityEvent(eventType, severity, details);
  };

  const trackActivity = (activityType: string): void => {
    const sessionId = sessionStorage.getItem('session_id') || 'unknown';
    securityMonitor.trackSuspiciousActivity(sessionId, activityType);
  };

  return {
    checkSecurity,
    reportSecurityEvent,
    trackActivity,
    getSecurityStatus: () => securityMonitor.getSecurityStatus(),
    getRecentAlerts: (limit?: number) => securityMonitor.getRecentAlerts(limit),
    isBlocked: (identifier: string) => securityMonitor.isBlocked(identifier)
  };
};
