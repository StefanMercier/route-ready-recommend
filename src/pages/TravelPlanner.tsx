
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Route, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface TravelCalculation {
  totalDistance: number;
  roundTripDistance: number;
  drivingTime: number;
  restStops: number;
  totalTravelTime: number;
  recommendation: 'motorcoach' | 'flight';
}

const TravelPlanner = () => {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TravelCalculation | null>(null);

  const calculateTravelTime = (distance: number): TravelCalculation => {
    // Calculate driving time (miles / 60 mph average)
    const drivingTime = distance / 60;
    
    // Calculate rest stops (every 3 hours, rounded up)
    const restStops = Math.ceil(drivingTime / 3);
    
    // Add 30 minutes per rest stop
    const restTime = restStops * 0.5;
    
    // Total travel time
    const totalTravelTime = drivingTime + restTime;
    
    // Recommendation based on 10-hour DOT limit
    const recommendation = totalTravelTime >= 9.5 ? 'flight' : 'motorcoach';
    
    return {
      totalDistance: distance,
      roundTripDistance: distance * 2,
      drivingTime,
      restStops,
      totalTravelTime,
      recommendation
    };
  };

  const handleCalculate = async () => {
    if (!departure.trim() || !destination.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both departure and destination locations.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // For demo purposes, simulate distance calculation
      // In a real app, you'd use a geocoding/routing API
      const mockDistance = Math.floor(Math.random() * 800) + 100; // 100-900 miles
      
      const calculation = calculateTravelTime(mockDistance);
      setResult(calculation);
      
      toast({
        title: "Calculation Complete",
        description: `Travel time calculated: ${calculation.totalTravelTime.toFixed(1)} hours`,
      });
    } catch (error) {
      toast({
        title: "Calculation Error",
        description: "Unable to calculate travel time. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Travel Planner</h1>
          <p className="text-lg text-gray-600">Calculate distances and travel times for motorcoach vs flight decisions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route Planning
            </CardTitle>
            <CardDescription>
              Enter your departure and destination to calculate travel time and get recommendations
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
                  onChange={(e) => setDeparture(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="Enter ZIP code or Postal code"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleCalculate} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Calculating...' : 'Calculate Travel Time'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Distance & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.totalDistance.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">One-way Miles</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result.roundTripDistance.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600">Round Trip Miles</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Driving Time:</span>
                    <span className="font-semibold">{formatTime(result.drivingTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rest Stops:</span>
                    <span className="font-semibold">{result.restStops} stops</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rest Time:</span>
                    <span className="font-semibold">{formatTime(result.restStops * 0.5)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total Travel Time:</span>
                    <span className="font-bold text-lg">{formatTime(result.totalTravelTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.recommendation === 'flight' ? (
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge 
                    variant={result.recommendation === 'flight' ? 'destructive' : 'default'}
                    className="text-lg px-4 py-2"
                  >
                    {result.recommendation === 'flight' ? 'Recommend Flight' : 'Recommend Motorcoach'}
                  </Badge>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  {result.recommendation === 'flight' ? (
                    <>
                      <p className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Travel time exceeds DOT regulations
                      </p>
                      <p>• Total travel time: {formatTime(result.totalTravelTime)}</p>
                      <p>• Exceeds 10-hour daily driving limit</p>
                      <p>• Flight recommended for efficiency</p>
                    </>
                  ) : (
                    <>
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Within DOT regulations
                      </p>
                      <p>• Total travel time: {formatTime(result.totalTravelTime)}</p>
                      <p>• Complies with 10-hour daily driving limit</p>
                      <p>• Motorcoach travel is feasible</p>
                    </>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                  <p className="font-semibold mb-1">DOT FMCSA Regulations:</p>
                  <p>• Maximum 10 hours driving per day</p>
                  <p>• 30-minute rest break every 3 hours</p>
                  <p>• Average speed: 60 mph</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Route Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-2">Interactive route map will be displayed here</p>
                <p className="text-sm text-gray-500">
                  Route: {departure} → {destination}
                </p>
                <p className="text-sm text-gray-500">
                  Distance: {result.totalDistance.toFixed(0)} miles
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TravelPlanner;
