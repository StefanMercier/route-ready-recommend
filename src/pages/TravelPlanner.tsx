
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { validateZipCode } from '@/services/distanceService';
import TravelBanner from '@/components/TravelBanner';
import RouteInputForm from '@/components/RouteInputForm';
import TravelResults from '@/components/TravelResults';
import RouteMap from '@/components/RouteMap';
import UserMenu from '@/components/UserMenu';
import PaymentGate from '@/components/PaymentGate';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useUsageTracking } from '@/hooks/useUsageTracking';

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
  const { hasPaid, loading: paymentLoading } = usePaymentStatus();
  const { 
    usageCount, 
    remainingUses, 
    hasReachedLimit, 
    loading: usageLoading, 
    incrementUsage 
  } = useUsageTracking();

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

  const handleDistanceCalculated = async (distance: number, duration: number) => {
    // For paid users, don't increment usage
    if (!hasPaid) {
      const success = await incrementUsage();
      if (!success) {
        toast({
          title: "Error",
          description: "Failed to update usage count. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

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

    // Check usage limit for non-paid users
    if (!hasPaid && hasReachedLimit) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your free usage limit. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // For non-paid users, increment usage on demo calculation
      if (!hasPaid) {
        const success = await incrementUsage();
        if (!success) {
          toast({
            title: "Error",
            description: "Failed to update usage count. Please try again.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // For demo purposes when Google Maps is not loaded
      const mockDistance = Math.floor(Math.random() * 800) + 100;
      const calculation = calculateTravelTime(mockDistance);
      setResult(calculation);
      setUseRealDistance(false);
      
      const usageMessage = hasPaid 
        ? "Load Google Maps for real data."
        : `Remaining free calculations: ${remainingUses - 1}. Load Google Maps for real data.`;
      
      toast({
        title: "Calculation Complete (Demo)",
        description: `Estimated travel time: ${calculation.totalTravelTime.toFixed(1)} hours. ${usageMessage}`,
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

  if (paymentLoading || usageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <PaymentGate 
      hasPaid={hasPaid} 
      hasReachedLimit={hasReachedLimit}
      remainingUses={remainingUses}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <TravelBanner />
            <UserMenu />
          </div>

          {/* Usage indicator for non-paid users */}
          {!hasPaid && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-blue-800">
                <span className="font-medium">Free calculations remaining: {remainingUses}</span>
                {remainingUses === 1 && (
                  <span className="block text-sm mt-1">Upgrade to Premium for unlimited access!</span>
                )}
              </p>
            </div>
          )}

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
    </PaymentGate>
  );
};

export default TravelPlanner;
