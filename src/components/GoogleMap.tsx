
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GoogleMapProps {
  departure: string;
  destination: string;
  onDistanceCalculated: (distance: number, duration: number) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ departure, destination, onDistanceCalculated }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize map with a public demo key for visualization only
  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      setApiError(null);
      const loader = new Loader({
        apiKey: 'AIzaSyBHo7mGrIVcmsDE_QjKaB4QjNn3emmSPSI', // Public demo key for map display only
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        zoom: 4,
      });

      const directionsRendererInstance = new google.maps.DirectionsRenderer();
      directionsRendererInstance.setMap(mapInstance);

      setMap(mapInstance);
      setDirectionsRenderer(directionsRendererInstance);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setApiError('Failed to load Google Maps for visualization.');
    }
  };

  // Use secure edge function for route calculations
  const calculateRouteSecurely = async () => {
    if (!departure || !destination) return;

    setLoading(true);
    setApiError(null);

    try {
      console.log('Calculating route via secure edge function...');
      
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          origin: departure,
          destination: destination,
          travelMode: 'DRIVING'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setApiError('Unable to calculate route. Please try again.');
        return;
      }

      if (data && data.status === 'OK') {
        console.log('Route calculated successfully:', data);
        onDistanceCalculated(data.distanceInMiles, data.durationInHours);
        
        // Display route on map if available (for visualization only)
        if (directionsRenderer && window.google) {
          // This is just for visual representation, actual calculation is done securely
          const directionsService = new google.maps.DirectionsService();
          directionsService.route(
            {
              origin: departure,
              destination: destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === 'OK' && result) {
                directionsRenderer.setDirections(result);
              }
            }
          );
        }
      } else {
        setApiError(data?.error || 'Failed to calculate route');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (isLoaded && departure && destination) {
      calculateRouteSecurely();
    }
  }, [isLoaded, departure, destination]);

  return (
    <div className="space-y-4">
      {apiError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {apiError}
            <br />
            <strong>Note:</strong> Route calculations are processed securely through our backend service.
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <Alert>
          <AlertDescription>
            Calculating route securely...
          </AlertDescription>
        </Alert>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border"
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
      
      {!isLoaded && !apiError && (
        <div className="w-full h-96 rounded-lg border bg-gray-100 flex items-center justify-center">
          <p className="text-gray-600">Loading map visualization...</p>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
