
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface GoogleMapProps {
  departure: string;
  destination: string;
  onDistanceCalculated: (distance: number, duration: number) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ departure, destination, onDistanceCalculated }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateRouteSecurely = async () => {
    if (!departure || !destination) return;

    setLoading(true);
    setApiError(null);

    try {
      console.log('Calculating route via Google Maps API...');
      
      // Call Google Maps Directions API directly using fetch with proxy
      const proxyUrl = `https://gklfrynehiqrwbddvaaa.supabase.co/functions/v1/google-maps-proxy?service=directions&origin=${encodeURIComponent(departure)}&destination=${encodeURIComponent(destination)}&mode=driving`;
      
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
        
        // Convert distance to miles and duration to hours
        const distanceInMiles = leg.distance.value * 0.000621371;
        const durationInHours = leg.duration.value / 3600;
        
        console.log('Route calculated successfully:', {
          distance: distanceInMiles,
          duration: durationInHours
        });
        
        onDistanceCalculated(distanceInMiles, durationInHours);
      } else {
        setApiError(data.error_message || 'Failed to calculate route');
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
      calculateRouteSecurely();
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
            Calculating route...
          </AlertDescription>
        </Alert>
      )}
      
      <div className="w-full h-96 rounded-lg border bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Route Calculation</p>
          <p className="text-sm text-gray-500">
            Real distance and travel time calculated via Google Maps API
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
