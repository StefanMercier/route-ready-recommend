
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentStatus = () => {
  const { user } = useAuth();
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!user) {
        setHasPaid(false);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('has_paid')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching payment status:', fetchError);
          setError('Failed to load payment status');
          setHasPaid(false);
        } else {
          setHasPaid(data?.has_paid || false);
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
        setError('Failed to load payment status');
        setHasPaid(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [user]);

  const refreshPaymentStatus = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error refreshing payment status:', fetchError);
        setError('Failed to refresh payment status');
      } else {
        setHasPaid(data?.has_paid || false);
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      setError('Failed to refresh payment status');
    } finally {
      setLoading(false);
    }
  };

  return { hasPaid, loading, error, refreshPaymentStatus };
};
