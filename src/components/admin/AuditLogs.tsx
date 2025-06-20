
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
}

interface AuditLogsProps {
  auditLogs: AuditLogEntry[];
  showAuditLogs: boolean;
  setShowAuditLogs: (show: boolean) => void;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ 
  auditLogs, 
  showAuditLogs, 
  setShowAuditLogs 
}) => {
  return (
    <>
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
    </>
  );
};

export default AuditLogs;
