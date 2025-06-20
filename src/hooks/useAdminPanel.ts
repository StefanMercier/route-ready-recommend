
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  has_paid: boolean;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
}

export const useAdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAuditLogs();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('is_admin_user', { user_id: user.id });
      if (!error) {
        setIsAdmin(data);
      } else {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, has_paid, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const togglePaymentStatus = async (userId: string, currentStatus: boolean, userEmail: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: sanitizedEmail, error: validationError } = await supabase.rpc('validate_and_sanitize_input', {
        input_text: userEmail,
        max_length: 255
      });

      if (validationError) {
        throw new Error(`Input validation failed: ${validationError.message}`);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ has_paid: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      await supabase.rpc('log_admin_action', {
        action_type: 'payment_status_changed',
        target_user: userId,
        action_details: {
          old_status: currentStatus,
          new_status: !currentStatus,
          target_email: sanitizedEmail
        }
      });

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, has_paid: !currentStatus }
          : user
      ));

      toast({
        title: "Success",
        description: `Payment status updated for ${sanitizedEmail}`,
      });

      fetchAuditLogs();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    }
  };

  return {
    users,
    loading,
    isAdmin,
    auditLogs,
    togglePaymentStatus,
    fetchAuditLogs
  };
};
