
import { useState } from 'react';

export const useAnonymousUsage = () => {
  const [anonymousUsageCount, setAnonymousUsageCount] = useState(0);
  
  const incrementAnonymousUsage = () => {
    setAnonymousUsageCount(prev => prev + 1);
  };
  
  const getRemainingAnonymousUses = () => {
    return Math.max(0, 5 - anonymousUsageCount);
  };
  
  const hasReachedAnonymousLimit = () => {
    return anonymousUsageCount >= 5;
  };
  
  return {
    anonymousUsageCount,
    incrementAnonymousUsage,
    getRemainingAnonymousUses,
    hasReachedAnonymousLimit
  };
};
