
import React, { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { validateZipCode } from '@/services/distanceService';
import TravelBanner from '@/components/TravelBanner';
import TravelPlannerContent from '@/components/TravelPlannerContent';
import UserMenu from '@/components/UserMenu';
import PaymentGate from '@/components/PaymentGate';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTravelCalculation } from '@/hooks/useTravelCalculation';
import { useAnonymousUsage } from '@/hooks/useAnonymousUsage';

const TravelPlanner = () => {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasPaid, loading: paymentLoading } = usePaymentStatus();
  const { 
    usageCount, 
    remainingUses, 
    hasReachedLimit, 
    loading: usageLoading, 
    incrementUsage 
  } = useUsageTracking();
  
  const {
    result,
    setResult,
    useRealDistance,
    setUseRealDistance,
    calculateTravelTime
  } = useTravelCalculation();
  
  const {
    anonymousUsageCount,
    incrementAnonymousUsage,
    getRemainingAnonymousUses,
    hasReachedAnonymousLimit
  } = useAnonymousUsage();

  const handleDistanceCalculated = async (distance: number, duration: number) => {
    // Handle usage increment for authenticated users
    if (user && !hasPaid) {
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

    // Check if user needs to authenticate (6th calculation for anonymous users)
    if (!user && hasReachedAnonymousLimit()) {
      toast({
        title: "Sign In Required",
        description: "Please create an account to continue using the travel planner.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // Check usage limit for authenticated non-paid users
    if (user && !hasPaid && hasReachedLimit) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your free usage limit. Please upgrade to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Increment usage for authenticated users
      if (user && !hasPaid) {
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

      // Increment anonymous usage count
      if (!user) {
        incrementAnonymousUsage();
      }

      // For demo purposes when Google Maps is not loaded
      const mockDistance = Math.floor(Math.random() * 800) + 100;
      const calculation = calculateTravelTime(mockDistance);
      setResult(calculation);
      setUseRealDistance(false);
      
      let usageMessage = "Load Google Maps for real data.";
      if (!user) {
        const remaining = getRemainingAnonymousUses() - 1;
        usageMessage = `${remaining} free calculations remaining. Load Google Maps for real data.`;
      } else if (!hasPaid) {
        usageMessage = `Remaining free calculations: ${remainingUses - 1}. Load Google Maps for real data.`;
      }
      
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

  if (paymentLoading || (user && usageLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show PaymentGate only for authenticated users who have reached their limit
  if (user && !hasPaid && hasReachedLimit) {
    return (
      <PaymentGate 
        hasPaid={hasPaid} 
        hasReachedLimit={hasReachedLimit}
        remainingUses={remainingUses}
      >
        <div /> {/* Empty children to satisfy the prop requirement */}
      </PaymentGate>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <TravelBanner />
      <UserMenu />
      
      <TravelPlannerContent
        departure={departure}
        destination={destination}
        loading={loading}
        result={result}
        useRealDistance={useRealDistance}
        user={user}
        hasPaid={hasPaid}
        anonymousUsageCount={anonymousUsageCount}
        remainingUses={remainingUses}
        hasReachedLimit={hasReachedLimit}
        onDepartureChange={setDeparture}
        onDestinationChange={setDestination}
        onCalculate={handleCalculate}
        onDistanceCalculated={handleDistanceCalculated}
      />
    </div>
  );
};

export default TravelPlanner;
