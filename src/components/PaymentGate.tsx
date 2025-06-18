
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface PaymentGateProps {
  children: React.ReactNode;
  hasPaid: boolean;
}

const PaymentGate: React.FC<PaymentGateProps> = ({ children, hasPaid }) => {
  const handlePayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Unable to start payment process. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (hasPaid) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-yellow-600" />
            <span className="text-2xl font-bold text-gray-900">Premium Access Required</span>
          </div>
          <CardTitle>Unlock Route Ready Premium</CardTitle>
          <CardDescription>
            Get full access to all travel planning features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>Advanced route calculation</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>Real-time Google Maps integration</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>DOT-compliant travel recommendations</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <span>Unlimited route planning</span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">$49.99</div>
            <div className="text-sm text-gray-600">One-time payment</div>
          </div>
          
          <Button 
            onClick={handlePayment}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Unlock Premium Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentGate;
