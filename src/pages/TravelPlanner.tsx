
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { validateZipCode } from '@/services/distanceService';
import TravelBanner from '@/components/TravelBanner';
import RouteInputForm from '@/components/RouteInputForm';
import TravelResults from '@/components/TravelResults';
import RouteMap from '@/components/RouteMap';

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
  const [useRealDistance, setUseRealDistance] = useState(false);

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

  const handleDistanceCalculated = (distance: number, duration: number) => {
    const calculation = calculateTravelTime(distance);
    setResult(calculation);
    setUseRealDistance(true);
    
    toast({
      title: "Route Calculated",
      description: `Real distance: ${distance.toFixed(1)} miles, Travel time: ${calculation.totalTravelTime.toFixed(1)} hours`,
    });
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

    if (!validateZipCode(departure) || !validateZipCode(destination)) {
      toast({
        title: "Invalid Format",
        description: "Please enter valid US ZIP codes or Canadian postal codes.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // For demo purposes when Google Maps is not loaded
      const mockDistance = Math.floor(Math.random() * 800) + 100;
      const calculation = calculateTravelTime(mockDistance);
      setResult(calculation);
      setUseRealDistance(false);
      
      toast({
        title: "Calculation Complete (Demo)",
        description: `Estimated travel time: ${calculation.totalTravelTime.toFixed(1)} hours. Load Google Maps for real data.`,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <TravelBanner />

        <RouteInputForm
          departure={departure}
          destination={destination}
          loading={loading}
          onDepartureChange={setDeparture}
          onDestinationChange={setDestination}
          onCalculate={handleCalculate}
        />

        {result && (
          <TravelResults result={result} />
        )}

        {result && (
          <RouteMap
            departure={departure}
            destination={destination}
            useRealDistance={useRealDistance}
            onDistanceCalculated={handleDistanceCalculated}
          />
        )}
      </div>
    </div>
  );
};

export default TravelPlanner;
