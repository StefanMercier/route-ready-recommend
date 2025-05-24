
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Route, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Route Ready Recommend
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Smart travel planning for trip organizers. Calculate distances, travel times, and get recommendations for motorcoach vs flight decisions based on DOT regulations.
          </p>
          <Link to="/planner">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Planning Your Trip
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Calculations</h3>
            <p className="text-gray-600">
              Automatically calculate travel times with DOT-compliant rest stops and driving hour limitations.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Route className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Route Planning</h3>
            <p className="text-gray-600">
              Enter ZIP codes or postal codes to get accurate distance and time calculations for your routes.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
            <p className="text-gray-600">
              Get clear recommendations on whether to book a flight or charter a motorcoach based on travel time.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
              <p className="text-sm">Enter departure and destination locations</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
              <p className="text-sm">Calculate distances and driving times</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
              <p className="text-sm">Apply DOT regulations for rest stops</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
              <p className="text-sm">Get motorcoach vs flight recommendation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
