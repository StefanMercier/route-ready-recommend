
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  has_paid: boolean;
  created_at: string;
}

interface UserManagementProps {
  users: User[];
  onTogglePaymentStatus: (userId: string, currentStatus: boolean, userEmail: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  users, 
  onTogglePaymentStatus 
}) => {
  return (
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
                  onCheckedChange={() => onTogglePaymentStatus(user.id, user.has_paid, user.email)}
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
  );
};

export default UserManagement;
