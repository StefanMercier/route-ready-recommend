
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <div className="w-full bg-gray-50 border-b py-3">
      <div className="max-w-4xl mx-auto px-4 flex justify-end items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{user.email}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default UserMenu;
