
// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  libraries: ['places'],
  region: 'US'
};

// Get API key from Supabase secrets via edge function
export const getGoogleMapsApiKey = async (): Promise<string> => {
  try {
    // In a real implementation, you'd want to create a separate edge function
    // to securely provide the API key for client-side map loading
    // For now, we'll use the proxy method for route calculations
    // and fallback to environment variables for map display
    return process.env.GOOGLE_MAPS_API_KEY || '';
  } catch (error) {
    console.error('Error getting Google Maps API key:', error);
    return '';
  }
};
