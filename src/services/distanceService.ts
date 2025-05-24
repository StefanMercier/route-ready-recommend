
export const calculateRealDistance = async (departure: string, destination: string): Promise<{ distance: number; duration: number } | null> => {
  // This would typically call a backend service with the Google Maps API
  // For now, return null to indicate we need the frontend API key approach
  return null;
};

export const validateZipCode = (zipCode: string): boolean => {
  // US ZIP code: 5 digits or 5+4 format
  const usZipRegex = /^\d{5}(-\d{4})?$/;
  // Canadian postal code: A1A 1A1 format
  const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  
  return usZipRegex.test(zipCode) || canadianPostalRegex.test(zipCode);
};
