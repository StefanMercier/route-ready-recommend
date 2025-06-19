interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    // Add client-side information
    const enhancedEvent = {
      ...event,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      severity: event.severity || 'low'
    };

    console.log('Security Event:', enhancedEvent);
    
    // In production, send to security monitoring service
    if (event.severity === 'high' || event.severity === 'critical') {
      console.error('High severity security event:', enhancedEvent);
      
      // Could trigger immediate security measures
      if (event.event_type === 'MULTIPLE_FAILED_LOGINS' || event.event_type === 'XSS_ATTEMPT') {
        console.warn('Implementing security restrictions due to:', event.event_type);
      }
    }

    // Store in local session for pattern analysis
    const sessionEvents = JSON.parse(sessionStorage.getItem('security_events') || '[]');
    sessionEvents.push(enhancedEvent);
    
    // Keep only last 50 events
    if (sessionEvents.length > 50) {
      sessionEvents.splice(0, sessionEvents.length - 50);
    }
    
    sessionStorage.setItem('security_events', JSON.stringify(sessionEvents));
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};
