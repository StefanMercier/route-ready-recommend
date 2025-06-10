
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface RouteInputFormProps {
  departure: string;
  destination: string;
  loading: boolean;
  onDepartureChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onCalculate: () => void;
}

const RouteInputForm: React.FC<RouteInputFormProps> = ({
  departure,
  destination,
  loading,
  onDepartureChange,
  onDestinationChange,
  onCalculate
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Route Planning
        </CardTitle>
        <CardDescription>
          Enter your departure and destination ZIP/postal codes to calculate travel time and get recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departure">Departure Location</Label>
            <Input
              id="departure"
              placeholder="Enter ZIP code or Postal code"
              value={departure}
              onChange={(e) => onDepartureChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="Enter ZIP code or Postal code"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
            />
          </div>
        </div>
        
        <Button 
          onClick={onCalculate} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Calculating...' : 'Calculate Travel Time (Demo)'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RouteInputForm;
