
interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
}

// Security event categories for better monitoring
const CRITICAL_EVENTS = [
  'MULTIPLE_FAILED_LOGINS',
  'XSS_ATTEMPT',
  'INVALID_ORIGIN',
  'ADMIN_PRIVILEGE_ESCALATION'
];

const HIGH_SEVERITY_EVENTS = [
  'RAPID_FORM_SUBMISSION',
  'SUSPICIOUS_ACTIVITY_PATTERN',
  'UNAUTHORIZED_ACCESS_ATTEMPT'
];

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    // Determine severity if not provided
    if (!event.severity) {
      if (CRITICAL_EVENTS.includes(event.event_type)) {
        event.severity = 'critical';
      } else if (HIGH_SEVERITY_EVENTS.includes(event.event_type)) {
        event.severity = 'high';
      } else {
        event.severity = 'low';
      }
    }

    // Add client-side information with privacy protection
    const enhancedEvent = {
      ...event,
      user_agent: navigator.userAgent.substring(0, 200), // Limit length
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      session_id: sessionStorage.getItem('session_id') || 'anonymous'
    };

    console.log('Security Event:', enhancedEvent);
    
    // Critical and high severity events get special handling
    if (event.severity === 'high' || event.severity === 'critical') {
      console.error(`${event.severity.toUpperCase()} security event:`, enhancedEvent);
      
      // Implement immediate security measures for critical events
      if (event.severity === 'critical') {
        console.warn('CRITICAL SECURITY EVENT - Implementing protective measures');
        
        // Could trigger additional security measures here
        if (['MULTIPLE_FAILED_LOGINS', 'XSS_ATTEMPT'].includes(event.event_type)) {
          // Rate limiting, temporary restrictions, etc.
          sessionStorage.setItem('security_restriction_active', 'true');
          sessionStorage.setItem('security_restriction_time', Date.now().toString());
        }
      }
    }

    // Store in session with size management
    const sessionEvents = JSON.parse(sessionStorage.getItem('security_events') || '[]');
    sessionEvents.push(enhancedEvent);
    
    // Keep only last 100 events and remove old ones
    if (sessionEvents.length > 100) {
      sessionEvents.splice(0, sessionEvents.length - 100);
    }
    
    sessionStorage.setItem('security_events', JSON.stringify(sessionEvents));

    // Alert monitoring for patterns
    await detectSecurityPatterns(sessionEvents);
    
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Pattern detection for advanced security monitoring
const detectSecurityPatterns = async (events: SecurityEvent[]) => {
  const recentEvents = events.filter(e => {
    const eventTime = e.timestamp ? new Date(e.timestamp).getTime() : 0;
    return Date.now() - eventTime < 300000; // Last 5 minutes
  });

  // Detect multiple XSS attempts
  const xssAttempts = recentEvents.filter(e => e.event_type === 'XSS_ATTEMPT').length;
  if (xssAttempts >= 3) {
    console.error('PATTERN DETECTED: Multiple XSS attempts in short timeframe');
    sessionStorage.setItem('high_risk_session', 'true');
  }

  // Detect rapid failed login attempts
  const failedLogins = recentEvents.filter(e => e.event_type === 'USER_LOGIN_FAILED').length;
  if (failedLogins >= 3) {
    console.error('PATTERN DETECTED: Multiple failed login attempts');
  }

  // Detect suspicious form interactions
  const rapidSubmissions = recentEvents.filter(e => e.event_type === 'RAPID_FORM_SUBMISSION').length;
  if (rapidSubmissions >= 2) {
    console.error('PATTERN DETECTED: Automated form submission behavior');
  }
};

// Check if security restrictions are active
export const isSecurityRestricted = (): boolean => {
  const isRestricted = sessionStorage.getItem('security_restriction_active') === 'true';
  const restrictionTime = parseInt(sessionStorage.getItem('security_restriction_time') || '0');
  
  // Auto-clear restrictions after 15 minutes
  if (isRestricted && Date.now() - restrictionTime > 900000) {
    sessionStorage.removeItem('security_restriction_active');
    sessionStorage.removeItem('security_restriction_time');
    return false;
  }
  
  return isRestricted;
};
