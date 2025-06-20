
// Authentication configuration utilities
export const AUTH_CONFIG = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: false,
  
  // Security settings
  ENABLE_LEAKED_PASSWORD_PROTECTION: true,
  SESSION_TIMEOUT: 24 * 60 * 60, // 24 hours in seconds
  
  // Redirect URLs
  getRedirectUrl: () => {
    // Handle different environments properly
    if (typeof window === 'undefined') return '';
    
    const origin = window.location.origin;
    
    // For Lovable preview URLs
    if (origin.includes('lovable.app')) {
      return origin;
    }
    
    // For localhost development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin;
    }
    
    // For production
    return origin;
  }
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (AUTH_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (AUTH_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (AUTH_CONFIG.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (AUTH_CONFIG.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
