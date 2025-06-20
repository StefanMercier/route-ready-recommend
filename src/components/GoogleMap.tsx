
import React, { useEffect, useRef, useState } from 'react';
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateRouteWithDirectionsAPI = async () => {
    if (!departure || !destination) return;

    setLoading(true);
    setApiError(null);

    try {
      console.log('Calculating route with Google Directions API...');
      
      // Use the Supabase edge function to call Google Maps Directions API
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: {
          service: 'directions',
          origin: departure,
          destination: destination,
          mode: 'driving',
          units: 'imperial'
        }
      });

      console.log('Edge function response:', data, error);

      if (error) {
        console.error('Edge function error:', error);
        setApiError('Unable to calculate route. Please try again.');
        return;
      }

      if (data && data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        // Extract distance in miles and duration in hours
        const distanceInMiles = leg.distance.value * 0.000621371; // Convert meters to miles
        const durationInHours = leg.duration.value / 3600; // Convert seconds to hours
        
        console.log('Route calculated successfully:', {
          distance: distanceInMiles,
          duration: durationInHours
        });
        
        onDistanceCalculated(distanceInMiles, durationInHours);
      } else {
        console.error('Invalid response from Directions API:', data);
        setApiError(data?.error_message || 'Failed to calculate route. Please check your locations.');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departure && destination) {
      calculateRouteWithDirectionsAPI();
    }
  }, [departure, destination]);

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
            Calculating route with Google Maps...
          </AlertDescription>
        </Alert>
      )}
      
      <div className="w-full h-96 rounded-lg border bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Google Maps Route Calculation</p>
          <p className="text-sm text-gray-500">
            Real-time distance and duration data from Google Maps
          </p>
          {loading && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;
