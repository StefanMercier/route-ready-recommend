
import React, { createContext, useContext, useEffect, useState } from 'react';

interface CSRFContextType {
  token: string | null;
  refreshToken: () => void;
  validateToken: (token: string) => boolean;
}

const CSRFContext = createContext<CSRFContextType | null>(null);

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
};

// Enhanced CSRF token generation with timestamp and entropy
const generateCSRFToken = (): string => {
  const timestamp = Date.now().toString(36);
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${timestamp}.${randomPart}`;
};

// Validate CSRF token format and age
const isValidToken = (token: string): boolean => {
  if (!token) return false;
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  try {
    const timestamp = parseInt(parts[0], 36);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return (now - timestamp) <= maxAge;
  } catch {
    return false;
  }
};

export const CSRFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = () => {
    const newToken = generateCSRFToken();
    setToken(newToken);
    sessionStorage.setItem('csrf_token', newToken);
    
    // Set token expiration cleanup
    setTimeout(() => {
      const currentToken = sessionStorage.getItem('csrf_token');
      if (currentToken === newToken) {
        refreshToken(); // Auto-refresh expired tokens
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  };

  const validateToken = (tokenToValidate: string): boolean => {
    return tokenToValidate === token && isValidToken(tokenToValidate);
  };

  useEffect(() => {
    // Initialize or retrieve existing token
    const existingToken = sessionStorage.getItem('csrf_token');
    
    if (existingToken && isValidToken(existingToken)) {
      setToken(existingToken);
    } else {
      // Remove invalid token and generate new one
      sessionStorage.removeItem('csrf_token');
      refreshToken();
    }

    // Refresh token periodically
    const interval = setInterval(() => {
      const currentToken = sessionStorage.getItem('csrf_token');
      if (!currentToken || !isValidToken(currentToken)) {
        refreshToken();
      }
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  const value = {
    token,
    refreshToken,
    validateToken
  };

  return (
    <CSRFContext.Provider value={value}>
      {children}
    </CSRFContext.Provider>
  );
};
