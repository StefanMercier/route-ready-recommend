
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useCSRF } from '@/components/CSRFProtection';

interface RouteInputFormProps {
  departure: string;
  destination: string;
  loading: boolean;
  onDepartureChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onCalculate: () => void;
}

// Enhanced input validation and sanitization
const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove potentially dangerous characters with enhanced XSS prevention
  sanitized = sanitized.replace(/<[^>]*>/g, ''); // Remove HTML tags
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, ''); // Remove vbscript: protocol
  sanitized = sanitized.replace(/data:/gi, ''); // Remove data: protocol
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // Remove event handlers
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, ''); // Remove control characters
  sanitized = sanitized.replace(/[<>"'&]/g, ''); // Remove dangerous HTML characters
  
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
  
  // Enhanced validation patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /on\w+\s*=/i,
    /\x00-\x1f/,
    /[\<\>\"\'&]/
  ];
  
  // Basic validation for postal codes and addresses
  const sanitized = sanitizeInput(input);
  if (sanitized !== input) {
    return { isValid: false, error: 'Invalid characters detected' };
  }
  
  // Check for suspicious patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return { isValid: false, error: 'Invalid input detected' };
    }
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
  const { detectSuspiciousActivity, validateRequestOrigin } = useSecurityMonitoring();
  const { token: csrfToken } = useCSRF();

  const handleDepartureChange = (value: string) => {
    // Security monitoring
    detectSuspiciousActivity('input_change', { field: 'departure', value });
    
    const sanitized = sanitizeInput(value);
    const validation = validateInput(sanitized);
    
    setDepartureError(validation.error || '');
    onDepartureChange(sanitized);
  };

  const handleDestinationChange = (value: string) => {
    // Security monitoring
    detectSuspiciousActivity('input_change', { field: 'destination', value });
    
    const sanitized = sanitizeInput(value);
    const validation = validateInput(sanitized);
    
    setDestinationError(validation.error || '');
    onDestinationChange(sanitized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate request origin
    if (!validateRequestOrigin()) {
      console.warn('Invalid request origin detected');
      return;
    }
    
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
                maxLength={100}
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
                maxLength={100}
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
          
          <Button 
            type="submit"
            disabled={loading || !!departureError || !!destinationError || !departure || !destination}
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
