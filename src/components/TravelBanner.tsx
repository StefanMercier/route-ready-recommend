
import React from 'react';

const TravelBanner = () => {
  return (
    <div className="w-full bg-white shadow-sm border-b">
      <div className="relative overflow-hidden py-8">
        <div className="absolute inset-0 flex justify-between items-center opacity-10 pointer-events-none px-8">
          <img 
            src="/lovable-uploads/809dd6be-db03-41d4-a4e9-071467435b58.png" 
            alt="Motorcoach"
            className="w-32 h-20 object-cover"
          />
          <img 
            src="/lovable-uploads/ebecb2ad-f891-43ab-a556-05cfa76b0d5e.png" 
            alt="Airplane"
            className="w-32 h-20 object-cover"
          />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Travel Planner</h1>
          <p className="text-lg text-gray-600">Calculate distances and travel times for motorcoach vs flight decisions</p>
        </div>
      </div>
    </div>
  );
};

export default TravelBanner;
