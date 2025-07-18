
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';
import { useRouteCalculation } from '@/hooks/useRouteCalculation';
import { useGoogleMap } from '@/hooks/useGoogleMap';

interface GoogleMapProps {
  departure: string;
  destination: string;
  onDistanceCalculated: (distance: number, duration: number) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ departure, destination, onDistanceCalculated }) => {
  const { isGoogleMapsLoaded, apiError, setApiError } = useGoogleMapsLoader();
  const { loading, calculateRoute, directionsServiceRef, directionsRendererRef, clearRoute } = useRouteCalculation();
  const { mapRef, mapInstanceRef } = useGoogleMap(isGoogleMapsLoaded, setApiError);
  
  // Track the last calculated route to prevent duplicate calculations
  const lastRouteRef = useRef<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Memoize the callback to prevent unnecessary re-renders
  const stableOnDistanceCalculated = useCallback((distance: number, duration: number) => {
    setIsCalculating(false);
    onDistanceCalculated(distance, duration);
  }, [onDistanceCalculated]);

  // Initialize directions service and renderer when map is ready
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapInstanceRef.current || !window.google?.maps?.MapTypeId) return;

    try {
      // Initialize directions service and renderer
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4285f4',
          strokeWeight: 4,
        },
      });
      
      directionsRendererRef.current.setMap(mapInstanceRef.current);
      console.log('Directions service initialized successfully');
    } catch (error) {
      console.error('Error initializing directions service:', error);
      setApiError('Failed to initialize directions service');
    }
  }, [isGoogleMapsLoaded, setApiError, directionsServiceRef, directionsRendererRef, mapInstanceRef]);

  // Clear route when inputs change or are cleared
  useEffect(() => {
    clearRoute();
    setIsCalculating(false);
    
    // Clear any existing error when inputs change
    if (apiError) {
      setApiError(null);
    }
  }, [departure, destination, clearRoute, apiError, setApiError]);

  // Calculate route with proper duplicate prevention
  useEffect(() => {
    // Create a unique key for this route combination
    const routeKey = `${departure?.trim()}-${destination?.trim()}`;
    
    // Skip if no valid inputs, already calculating, or same route as last calculation
    if (!departure || !destination || 
        !departure.trim() || !destination.trim() || 
        !isGoogleMapsLoaded || 
        !directionsServiceRef.current ||
        isCalculating ||
        lastRouteRef.current === routeKey) {
      return;
    }

    console.log('Starting new route calculation for:', routeKey);
    setIsCalculating(true);
    lastRouteRef.current = routeKey;
    
    calculateRoute(departure, destination, stableOnDistanceCalculated);
  }, [departure, destination, isGoogleMapsLoaded, calculateRoute, stableOnDistanceCalculated, isCalculating, directionsServiceRef]);

  if (!isGoogleMapsLoaded) {
    return (
      <div className="w-full h-96 rounded-lg border bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {apiError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {apiError}
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <Alert>
          <AlertDescription>
            Calculating route...
          </AlertDescription>
        </Alert>
      )}
      
      <div 
        ref={mapRef}
        className="w-full h-96 rounded-lg border shadow-md"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default GoogleMap;
