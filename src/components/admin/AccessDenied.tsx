
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const AccessDenied: React.FC = () => {
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
};

export default AccessDenied;
