
import React, { createContext, useContext, useEffect, useState } from 'react';

interface CSRFContextType {
  token: string | null;
  refreshToken: () => void;
}

const CSRFContext = createContext<CSRFContextType | null>(null);

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
};

const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const CSRFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  const refreshToken = () => {
    const newToken = generateCSRFToken();
    setToken(newToken);
    sessionStorage.setItem('csrf_token', newToken);
  };

  useEffect(() => {
    // Initialize or retrieve existing token
    const existingToken = sessionStorage.getItem('csrf_token');
    if (existingToken) {
      setToken(existingToken);
    } else {
      refreshToken();
    }
  }, []);

  const value = {
    token,
    refreshToken
  };

  return (
    <CSRFContext.Provider value={value}>
      {children}
    </CSRFContext.Provider>
  );
};
