
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const FREE_USAGE_LIMIT = 5;

export const useUsageTracking = () => {
  const { user } = useAuth();
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsageCount = async () => {
      if (!user) {
        setUsageCount(0);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('usage_count')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching usage count:', fetchError);
          setError('Failed to load usage information');
          setUsageCount(0);
        } else {
          setUsageCount(data?.usage_count || 0);
        }
      } catch (error) {
        console.error('Error fetching usage count:', error);
        setError('Failed to load usage information');
        setUsageCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageCount();
  }, [user]);

  const incrementUsage = async (): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ usage_count: usageCount + 1 })
        .eq('id', user.id)
        .select('usage_count')
        .single();

      if (updateError) {
        console.error('Error incrementing usage:', updateError);
        setError('Failed to update usage count');
        return false;
      }

      setUsageCount(data.usage_count);
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      setError('Failed to update usage count');
      return false;
    }
  };

  const hasReachedLimit = usageCount >= FREE_USAGE_LIMIT;
  const remainingUses = Math.max(0, FREE_USAGE_LIMIT - usageCount);

  return {
    usageCount,
    remainingUses,
    hasReachedLimit,
    loading,
    error,
    incrementUsage
  };
};
