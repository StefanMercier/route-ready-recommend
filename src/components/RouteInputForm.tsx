
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useCSRF } from '@/components/CSRFProtection';
import { sanitizeInput, detectXSSAttempt, SECURITY_CONFIG } from '@/config/security';

interface RouteInputFormProps {
  departure: string;
  destination: string;
  loading: boolean;
  onDepartureChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onCalculate: () => void;
  onReset: () => void;
}

const validateInput = (input: string): { isValid: boolean; error?: string } => {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (input.length > SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH) {
    return { isValid: false, error: `Input is too long (maximum ${SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH} characters)` };
  }
  
  // Enhanced XSS detection
  if (detectXSSAttempt(input)) {
    return { isValid: false, error: 'Invalid characters detected' };
  }
  
  // Basic postal code/address validation
  const sanitized = sanitizeInput(input, SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH);
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
  onCalculate,
  onReset
}) => {
  const [departureError, setDepartureError] = React.useState<string>('');
  const [destinationError, setDestinationError] = React.useState<string>('');
  const { detectSuspiciousActivity } = useSecurityMonitoring();
  const { token: csrfToken } = useCSRF();

  const handleDepartureChange = (value: string) => {
    // Security monitoring
    detectSuspiciousActivity('input_change', { field: 'departure', value: value.substring(0, 20) + '...' });
    
    const sanitized = sanitizeInput(value, SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH);
    const validation = validateInput(sanitized);
    
    setDepartureError(validation.error || '');
    onDepartureChange(sanitized);
  };

  const handleDestinationChange = (value: string) => {
    // Security monitoring
    detectSuspiciousActivity('input_change', { field: 'destination', value: value.substring(0, 20) + '...' });
    
    const sanitized = sanitizeInput(value, SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH);
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
      // Log security event for form submission
      detectSuspiciousActivity('form_submission', {
        departure: departure.substring(0, 10) + '...',
        destination: destination.substring(0, 10) + '...',
        csrfToken: csrfToken ? 'present' : 'missing'
      });
      
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
          {/* CSRF Token */}
          {csrfToken && (
            <input type="hidden" name="csrf_token" value={csrfToken} />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Location</Label>
              <Input
                id="departure"
                name="departure"
                placeholder="Enter ZIP code or Postal code"
                value={departure}
                onChange={(e) => handleDepartureChange(e.target.value)}
                className={departureError ? 'border-red-500' : ''}
                maxLength={SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH}
                autoComplete="off"
                spellCheck="false"
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
                name="destination"
                placeholder="Enter ZIP code or Postal code"
                value={destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className={destinationError ? 'border-red-500' : ''}
                maxLength={SECURITY_CONFIG.MAX_SHORT_INPUT_LENGTH}
                autoComplete="off"
                spellCheck="false"
              />
              {destinationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{destinationError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit"
              disabled={loading || !!departureError || !!destinationError || !departure || !destination}
              className="flex-1"
            >
              {loading ? 'Calculating...' : 'Calculate Travel Time'}
            </Button>
            
            <Button 
              type="button"
              variant="default"
              onClick={onReset}
              disabled={loading}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RouteInputForm;
