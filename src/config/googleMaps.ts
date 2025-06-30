
// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  // This will be set from your Supabase secret
  apiKey: 'your-api-key-here', // This needs to be replaced with actual key
  libraries: ['places'],
  region: 'US'
};

// For now, we'll use a direct approach since Vite env vars aren't working
// You can replace this with your actual API key
export const getGoogleMapsApiKey = () => {
  // Return your Google Maps API key here
  return 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with actual key
};
