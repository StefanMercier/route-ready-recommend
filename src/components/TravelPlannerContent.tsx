
import React from 'react';
import { toast } from '@/components/ui/use-toast';
import { validateZipCode } from '@/services/distanceService';
import RouteInputForm from '@/components/RouteInputForm';
import TravelResults from '@/components/TravelResults';
import RouteMap from '@/components/RouteMap';
import UsageIndicator from '@/components/UsageIndicator';
import { TravelCalculation } from '@/hooks/useTravelCalculation';

interface TravelPlannerContentProps {
  departure: string;
  destination: string;
  loading: boolean;
  result: TravelCalculation | null;
  useRealDistance: boolean;
  user: any;
  hasPaid: boolean;
  anonymousUsageCount: number;
  remainingUses: number;
  hasReachedLimit: boolean;
  onDepartureChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onCalculate: () => void;
  onDistanceCalculated: (distance: number, duration: number) => void;
}

const TravelPlannerContent: React.FC<TravelPlannerContentProps> = ({
  departure,
  destination,
  loading,
  result,
  useRealDistance,
  user,
  hasPaid,
  anonymousUsageCount,
  remainingUses,
  hasReachedLimit,
  onDepartureChange,
  onDestinationChange,
  onCalculate,
  onDistanceCalculated
}) => {
  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <UsageIndicator
          user={user}
          hasPaid={hasPaid}
          anonymousUsageCount={anonymousUsageCount}
          remainingUses={remainingUses}
        />

        <RouteInputForm
          departure={departure}
          destination={destination}
          loading={loading}
          onDepartureChange={onDepartureChange}
          onDestinationChange={onDestinationChange}
          onCalculate={onCalculate}
        />

        {result && (
          <TravelResults result={result} />
        )}

        {result && (
          <RouteMap
            departure={departure}
            destination={destination}
            useRealDistance={useRealDistance}
            onDistanceCalculated={onDistanceCalculated}
          />
        )}
      </div>
    </div>
  );
};

export default TravelPlannerContent;
