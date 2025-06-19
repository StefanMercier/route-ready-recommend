
import { useEffect } from 'react';
import { generateCSPHeader } from '@/config/security';

const SecurityHeaders = () => {
  useEffect(() => {
    // Set Content Security Policy
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = generateCSPHeader();
    document.head.appendChild(meta);
    
    // Set X-Frame-Options to prevent clickjacking
    const frameOptions = document.createElement('meta');
    frameOptions.httpEquiv = 'X-Frame-Options';
    frameOptions.content = 'DENY';
    document.head.appendChild(frameOptions);
    
    // Set X-Content-Type-Options
    const contentType = document.createElement('meta');
    contentType.httpEquiv = 'X-Content-Type-Options';
    contentType.content = 'nosniff';
    document.head.appendChild(contentType);
    
    // Set Referrer Policy
    const referrer = document.createElement('meta');
    referrer.name = 'referrer';
    referrer.content = 'strict-origin-when-cross-origin';
    document.head.appendChild(referrer);
    
    return () => {
      // Cleanup on unmount
      document.head.removeChild(meta);
      document.head.removeChild(frameOptions);
      document.head.removeChild(contentType);
      document.head.removeChild(referrer);
    };
  }, []);
  
  return null;
};

export default SecurityHeaders;
