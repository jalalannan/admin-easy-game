import RolesManagement from "@/components/roles-management";
import { AuthGuard } from "@/components/auth-guard";

export default function RolesPage() {
  return (
    <AuthGuard requiredPermission={{ resource: 'roles', action: 'read' }}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-2">
            Manage user roles and permissions for your application
          </p>
        </div>
        
        <RolesManagement />
      </div>
    </AuthGuard>
  );
}
