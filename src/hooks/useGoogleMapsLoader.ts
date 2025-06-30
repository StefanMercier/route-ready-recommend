
import { useState, useEffect } from 'react';
import { getGoogleMapsApiKey } from '@/utils/googleMapsKey';

export const useGoogleMapsLoader = () => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.MapTypeId) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Script is loading, wait for it
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.MapTypeId) {
            setIsGoogleMapsLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google || !window.google.maps || !window.google.maps.MapTypeId) {
            setApiError('Google Maps failed to load completely');
          }
        }, 10000);
        return;
      }

      try {
        // Get API key from Supabase
        const apiKey = await getGoogleMapsApiKey();
        
        if (!apiKey) {
          setApiError('Google Maps API key not available');
          return;
        }

        console.log('Loading Google Maps with API key...');
        
        // Load the script with the API key
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        // Create callback function
        (window as any).initGoogleMaps = () => {
          console.log('Google Maps API loaded successfully');
          setIsGoogleMapsLoaded(true);
          // Clean up the global callback
          delete (window as any).initGoogleMaps;
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          setApiError('Failed to load Google Maps API. Please check your API key and network connection.');
          delete (window as any).initGoogleMaps;
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setApiError('Failed to initialize Google Maps');
      }
    };

    loadGoogleMaps();
  }, []);

  return { isGoogleMapsLoaded, apiError, setApiError };
};
