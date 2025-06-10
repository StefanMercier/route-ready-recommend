
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import GoogleMap from '@/components/GoogleMap';

interface RouteMapProps {
  departure: string;
  destination: string;
  useRealDistance: boolean;
  onDistanceCalculated: (distance: number, duration: number) => void;
}

const RouteMap: React.FC<RouteMapProps> = ({
  departure,
  destination,
  useRealDistance,
  onDistanceCalculated
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Route Map
          {useRealDistance && (
            <Badge variant="default" className="ml-2">Real Data</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GoogleMap 
          departure={departure}
          destination={destination}
          onDistanceCalculated={onDistanceCalculated}
        />
      </CardContent>
    </Card>
  );
};

export default RouteMap;
