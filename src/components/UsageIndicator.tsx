
import React from 'react';

interface UsageIndicatorProps {
  user: any;
  hasPaid: boolean;
  anonymousUsageCount: number;
  remainingUses: number;
}

const UsageIndicator: React.FC<UsageIndicatorProps> = ({
  user,
  hasPaid,
  anonymousUsageCount,
  remainingUses
}) => {
  if (hasPaid) return null;

  if (!user) {
    const remaining = 5 - anonymousUsageCount;
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-800">
          <span className="font-medium">Free calculations remaining: {remaining}</span>
          {anonymousUsageCount >= 4 && (
            <span className="block text-sm mt-1">Create an account to continue after this calculation!</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
      <p className="text-blue-800">
        <span className="font-medium">Free calculations remaining: {remainingUses}</span>
        {remainingUses === 1 && (
          <span className="block text-sm mt-1">Upgrade to Premium for unlimited access!</span>
        )}
      </p>
    </div>
  );
};

export default UsageIndicator;
