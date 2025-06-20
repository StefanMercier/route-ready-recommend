
import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { useAdminPanel } from '@/hooks/useAdminPanel';
import AdminLoading from '@/components/admin/AdminLoading';
import AccessDenied from '@/components/admin/AccessDenied';
import AdminStats from '@/components/admin/AdminStats';
import AuditLogs from '@/components/admin/AuditLogs';
import UserManagement from '@/components/admin/UserManagement';

const AdminPanel = () => {
  const { users, loading, isAdmin, auditLogs, togglePaymentStatus } = useAdminPanel();
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  if (loading) {
    return <AdminLoading />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
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

        <AdminStats totalUsers={totalUsers} paidUsers={paidUsers} />

        <AuditLogs 
          auditLogs={auditLogs}
          showAuditLogs={showAuditLogs}
          setShowAuditLogs={setShowAuditLogs}
        />

        <UserManagement 
          users={users}
          onTogglePaymentStatus={togglePaymentStatus}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
