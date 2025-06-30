
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

  // Use secure edge function for all route calculations and map display
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
            <br />
            <strong>Note:</strong> All route calculations are processed securely through our backend service.
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
      
      <div className="w-full h-96 rounded-lg border bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Secure Route Calculation</p>
          <p className="text-sm text-gray-500">
            All map data and routing is processed through our secure backend
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;
