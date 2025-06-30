
import { useRef, useState, useCallback } from 'react';

interface RouteCalculationHook {
  loading: boolean;
  calculateRoute: (departure: string, destination: string, onSuccess: (distance: number, duration: number) => void) => Promise<void>;
  directionsServiceRef: React.MutableRefObject<google.maps.DirectionsService | null>;
  directionsRendererRef: React.MutableRefObject<google.maps.DirectionsRenderer | null>;
  clearRoute: () => void;
}

export const useRouteCalculation = (): RouteCalculationHook => {
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateRouteViaProxy = async (departure: string, destination: string, onSuccess: (distance: number, duration: number) => void) => {
    // Validate inputs before proxy calculation
    if (!departure || !destination || !departure.trim() || !destination.trim()) {
      console.log('Missing or empty departure/destination, skipping proxy calculation');
      setLoading(false);
      return;
    }

    try {
      console.log('Calculating route via proxy fallback...');
      
      const proxyUrl = `https://gklfrynehiqrwbddvaaa.supabase.co/functions/v1/google-maps-proxy?service=directions&origin=${encodeURIComponent(departure.trim())}&destination=${encodeURIComponent(destination.trim())}&mode=driving`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbGZyeW5laGlxcndiZGR2YWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDcyMjUsImV4cCI6MjA2MzY4MzIyNX0.uXqbDiPCU99bmemtBIrxXqm3jm53gHnhv3gvCJXrBaU`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbGZyeW5laGlxcndiZGR2YWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMDcyMjUsImV4cCI6MjA2MzY4MzIyNX0.uXqbDiPCU99bmemtBIrxXqm3jm53gHnhv3gvCJXrBaU'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        const distanceInMiles = leg.distance.value * 0.000621371;
        const durationInHours = leg.duration.value / 3600;
        
        console.log('Route calculated via proxy:', {
          distance: distanceInMiles,
          duration: durationInHours
        });
        
        onSuccess(distanceInMiles, durationInHours);
      } else {
        throw new Error(data.error_message || 'Failed to calculate route');
      }
    } catch (error) {
      console.error('Error calculating route via proxy:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = useCallback(async (departure: string, destination: string, onSuccess: (distance: number, duration: number) => void) => {
    // Validate inputs before attempting calculation
    if (!departure || !destination || !departure.trim() || !destination.trim()) {
      console.log('Missing or empty departure/destination, skipping route calculation');
      return;
    }

    if (!directionsServiceRef.current || !directionsRendererRef.current) {
      console.log('Directions service not ready');
      return;
    }

    // Clear previous route
    directionsRendererRef.current.setDirections({ routes: [] } as any);
    
    setLoading(true);

    try {
      console.log('Calculating route with Google Maps Directions API...');
      
      const request = {
        origin: departure.trim(),
        destination: destination.trim(),
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsServiceRef.current.route(request, (result, status) => {
        setLoading(false);
        
        if (status === 'OK' && result) {
          console.log('Route calculated successfully with Google Maps API');
          
          // Display the route on the map
          directionsRendererRef.current!.setDirections(result);
          
          // Calculate distance and duration
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const distanceInMiles = leg.distance!.value * 0.000621371;
          const durationInHours = leg.duration!.value / 3600;
          
          console.log('Route details:', {
            distance: distanceInMiles,
            duration: durationInHours,
            status: status
          });
          
          onSuccess(distanceInMiles, durationInHours);
        } else {
          console.error('Directions request failed:', status);
          // Fallback to proxy method
          calculateRouteViaProxy(departure, destination, onSuccess).catch(error => {
            console.error('Proxy fallback also failed:', error);
          });
        }
      });
    } catch (error) {
      console.error('Error with Google Maps Directions:', error);
      setLoading(false);
      // Fallback to proxy method
      calculateRouteViaProxy(departure, destination, onSuccess).catch(error => {
        console.error('Proxy fallback also failed:', error);
      });
    }
  }, []);

  const clearRoute = useCallback(() => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
    }
  }, []);

  return {
    loading,
    calculateRoute,
    directionsServiceRef,
    directionsRendererRef,
    clearRoute
  };
};
