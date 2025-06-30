
import { useRef, useEffect } from 'react';

export const useGoogleMap = (isGoogleMapsLoaded: boolean, setApiError: (error: string | null) => void) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || !window.google?.maps?.MapTypeId) return;

    try {
      console.log('Initializing Google Map...');
      
      // Initialize map
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });

      console.log('Google Map initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setApiError('Failed to initialize map');
    }
  }, [isGoogleMapsLoaded, setApiError]);

  return { mapRef, mapInstanceRef };
};
