
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentStatus = () => {
  const { user } = useAuth();
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('has_paid')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching payment status:', error);
          setHasPaid(false);
        } else {
          setHasPaid(data?.has_paid || false);
        }
      } catch (error) {
        console.error('Error fetching payment status:', error);
        setHasPaid(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [user]);

  const refreshPaymentStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_paid')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setHasPaid(data.has_paid || false);
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { hasPaid, loading, refreshPaymentStatus };
};
