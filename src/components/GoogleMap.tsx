
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GoogleMapProps {
  departure: string;
  destination: string;
  onDistanceCalculated: (distance: number, duration: number) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ departure, destination, onDistanceCalculated }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [apiKey, setApiKey] = useState('AIzaSyBHo7mGrIVcmsDE_QjKaB4QjNn3emmSPSI');
  const [isLoaded, setIsLoaded] = useState(false);

  const initializeMap = async (key: string) => {
    if (!mapRef.current || !key) return;

    try {
      const loader = new Loader({
        apiKey: key,
        version: 'weekly',
        libraries: ['places']
      });

      await loader.load();

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        zoom: 4,
      });

      const directionsServiceInstance = new google.maps.DirectionsService();
      const directionsRendererInstance = new google.maps.DirectionsRenderer();
      
      directionsRendererInstance.setMap(mapInstance);

      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const calculateRoute = () => {
    if (!directionsService || !directionsRenderer || !departure || !destination) return;

    directionsService.route(
      {
        origin: departure,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          const distanceInMiles = leg.distance ? leg.distance.value * 0.000621371 : 0;
          const durationInHours = leg.duration ? leg.duration.value / 3600 : 0;
          
          onDistanceCalculated(distanceInMiles, durationInHours);
        } else {
          console.error('Directions request failed due to:', status);
        }
      }
    );
  };

  useEffect(() => {
    if (isLoaded && departure && destination) {
      calculateRoute();
    }
  }, [isLoaded, departure, destination]);

  // Auto-load the map with the provided API key
  useEffect(() => {
    if (apiKey && !isLoaded) {
      initializeMap(apiKey);
    }
  }, [apiKey, isLoaded]);

  return (
    <div className="space-y-4">
      {!isLoaded && (
        <div className="space-y-2">
          <Label htmlFor="apiKey">Google Maps API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your Google Maps API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button onClick={() => initializeMap(apiKey)} disabled={!apiKey}>
            Load Map
          </Button>
          <p className="text-sm text-gray-600">
            Get your API key from Google Cloud Console and enable Maps JavaScript API and Distance Matrix API
          </p>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border"
        style={{ display: isLoaded ? 'block' : 'none' }}
      />
      
      {!isLoaded && (
        <div className="w-full h-96 rounded-lg border bg-gray-100 flex items-center justify-center">
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
