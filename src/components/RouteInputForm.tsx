
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RouteInputFormProps {
  departure: string;
  destination: string;
  loading: boolean;
  onDepartureChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onCalculate: () => void;
}

// Input validation and sanitization
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove HTML tags
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, ''); // Remove vbscript: protocol
  sanitized = sanitized.replace(/on\w+=/gi, ''); // Remove event handlers
  
  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized;
};

const validateInput = (input: string): { isValid: boolean; error?: string } => {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (input.length > 100) {
    return { isValid: false, error: 'Input is too long (maximum 100 characters)' };
  }
  
  // Basic validation for postal codes and addresses
  const sanitized = sanitizeInput(input);
  if (sanitized !== input) {
    return { isValid: false, error: 'Invalid characters detected' };
  }
  
  return { isValid: true };
};

const RouteInputForm: React.FC<RouteInputFormProps> = ({
  departure,
  destination,
  loading,
  onDepartureChange,
  onDestinationChange,
  onCalculate
}) => {
  const [departureError, setDepartureError] = React.useState<string>('');
  const [destinationError, setDestinationError] = React.useState<string>('');

  const handleDepartureChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    const validation = validateInput(sanitized);
    
    setDepartureError(validation.error || '');
    onDepartureChange(sanitized);
  };

  const handleDestinationChange = (value: string) => {
    const sanitized = sanitizeInput(value);
    const validation = validateInput(sanitized);
    
    setDestinationError(validation.error || '');
    onDestinationChange(sanitized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const departureValidation = validateInput(departure);
    const destinationValidation = validateInput(destination);
    
    setDepartureError(departureValidation.error || '');
    setDestinationError(destinationValidation.error || '');
    
    if (departureValidation.isValid && destinationValidation.isValid) {
      onCalculate();
    }
  };

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
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Location</Label>
              <Input
                id="departure"
                placeholder="Enter ZIP code or Postal code"
                value={departure}
                onChange={(e) => handleDepartureChange(e.target.value)}
                className={departureError ? 'border-red-500' : ''}
                maxLength={100}
              />
              {departureError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{departureError}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Enter ZIP code or Postal code"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className={destinationError ? 'border-red-500' : ''}
                maxLength={100}
              />
              {destinationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{destinationError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          <Button 
            type="submit"
            disabled={loading || !!departureError || !!destinationError}
            className="w-full"
          >
            {loading ? 'Calculating...' : 'Calculate Travel Time (Demo)'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RouteInputForm;
