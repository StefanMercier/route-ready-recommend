
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, AlertTriangle, CheckCircle } from 'lucide-react';

interface TravelCalculation {
  totalDistance: number;
  roundTripDistance: number;
  drivingTime: number;
  restStops: number;
  totalTravelTime: number;
  recommendation: 'motorcoach' | 'flight';
}

interface TravelResultsProps {
  result: TravelCalculation;
}

const TravelResults: React.FC<TravelResultsProps> = ({ result }) => {
  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Calculate round trip time (double the one-way time plus additional rest stops if needed)
  const roundTripTime = result.totalTravelTime * 2;

  return (
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

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(result.totalTravelTime)}
              </div>
              <div className="text-sm text-gray-600">One-way Time</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(roundTripTime)}
              </div>
              <div className="text-sm text-gray-600">Round Trip Time</div>
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
          <div className="text-center space-y-4">
            <Badge 
              variant={result.recommendation === 'flight' ? 'destructive' : 'default'}
              className="text-lg px-4 py-2"
            >
              {result.recommendation === 'flight' ? 'Recommend Flight' : 'Recommend Motorcoach'}
            </Badge>
            
            <div className="flex justify-center">
              <img 
                src={result.recommendation === 'flight' 
                  ? '/lovable-uploads/ebecb2ad-f891-43ab-a556-05cfa76b0d5e.png'
                  : '/lovable-uploads/809dd6be-db03-41d4-a4e9-071467435b58.png'
                }
                alt={result.recommendation === 'flight' ? 'Commercial airplane' : 'Motorcoach buses'}
                className="w-48 h-32 object-cover rounded-lg shadow-md"
              />
            </div>
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
  );
};

export default TravelResults;
