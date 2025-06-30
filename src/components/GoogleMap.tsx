import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { getGoogleMapsApiKey } from '@/utils/googleMapsKey';

interface GoogleMapProps {
  departure: string;
  destination: string;
  onDistanceCalculated: (distance: number, duration: number) => void;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ departure, destination, onDistanceCalculated }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Load Google Maps API with proper key
  useEffect(() => {
    const loadGoogleMaps = async () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Script is loading, wait for it
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            setIsGoogleMapsLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google || !window.google.maps) {
            setApiError('Google Maps failed to load');
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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('Google Maps API loaded successfully');
          setIsGoogleMapsLoaded(true);
        };
        
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          setApiError('Failed to load Google Maps API. Please check your API key and network connection.');
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setApiError('Failed to initialize Google Maps');
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps API is loaded
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current) return;

    try {
      console.log('Initializing Google Map...');
      
      // Initialize map
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 39.8283, lng: -98.5795 }, // Center of US
        mapTypeId: google.maps.MapTypeId.ROADMAP,
      });

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
      console.log('Google Map initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setApiError('Failed to initialize map');
    }
  }, [isGoogleMapsLoaded]);

  const calculateAndDisplayRoute = async () => {
    if (!departure || !destination || !directionsServiceRef.current || !directionsRendererRef.current) {
      console.log('Missing required elements for route calculation');
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      console.log('Calculating route with Google Maps Directions API...');
      
      const request = {
        origin: departure,
        destination: destination,
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
          
          onDistanceCalculated(distanceInMiles, durationInHours);
        } else {
          console.error('Directions request failed:', status);
          // Fallback to proxy method
          calculateRouteViaProxy();
        }
      });
    } catch (error) {
      console.error('Error with Google Maps Directions:', error);
      setLoading(false);
      // Fallback to proxy method
      calculateRouteViaProxy();
    }
  };

  const calculateRouteViaProxy = async () => {
    try {
      console.log('Calculating route via proxy fallback...');
      
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
        
        const distanceInMiles = leg.distance.value * 0.000621371;
        const durationInHours = leg.duration.value / 3600;
        
        console.log('Route calculated via proxy:', {
          distance: distanceInMiles,
          duration: durationInHours
        });
        
        onDistanceCalculated(distanceInMiles, durationInHours);
      } else {
        setApiError(data.error_message || 'Failed to calculate route');
      }
    } catch (error) {
      console.error('Error calculating route via proxy:', error);
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departure && destination && isGoogleMapsLoaded && directionsServiceRef.current) {
      calculateAndDisplayRoute();
    }
  }, [departure, destination, isGoogleMapsLoaded]);

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
