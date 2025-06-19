
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Shield, Users, DollarSign, AlertTriangle } from 'lucide-react';
import UserMenu from '@/components/UserMenu';

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

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

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

      // Use the new is_admin_user function
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
      // Validate and sanitize the email input using the new validation function
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

      // Log the admin action using the secure logging function
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

      // Refresh audit logs
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const paidUsers = users.filter(user => user.has_paid).length;
  const totalUsers = users.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <UserMenu />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button
            variant={showAuditLogs ? "default" : "outline"}
            onClick={() => setShowAuditLogs(!showAuditLogs)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {showAuditLogs ? "Hide" : "Show"} Audit Logs
          </Button>
        </div>

        {showAuditLogs && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Audit Log</CardTitle>
              <CardDescription>
                Recent admin actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg text-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    {log.details && (
                      <div className="mt-1 text-gray-600">
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No audit logs found</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user payment status and view user details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.email}</span>
                      {user.has_paid && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Paid
                        </Badge>
                      )}
                    </div>
                    {user.full_name && (
                      <p className="text-sm text-gray-600">{user.full_name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {user.has_paid ? 'Paid' : 'Free'}
                    </span>
                    <Switch
                      checked={user.has_paid}
                      onCheckedChange={() => togglePaymentStatus(user.id, user.has_paid, user.email)}
                    />
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-gray-500 text-center py-8">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
