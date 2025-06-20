
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AuthDebugger: React.FC = () => {
  const { user, session, loading } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-auto z-50 bg-white/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Auth Debug Info
          <Badge variant={user ? "default" : "secondary"}>
            {loading ? "Loading..." : user ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>User ID:</strong> {user?.id || 'None'}
        </div>
        <div>
          <strong>Email:</strong> {user?.email || 'None'}
        </div>
        <div>
          <strong>Email Confirmed:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Session:</strong> {session ? 'Active' : 'None'}
        </div>
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        {user?.user_metadata && (
          <div>
            <strong>Metadata:</strong>
            <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(user.user_metadata, null, 1)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;
