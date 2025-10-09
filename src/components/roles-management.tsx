"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFirebaseAuthStore } from "@/stores/firebase-auth-store";
import { CreateRoleData, Permission, Role } from "@/types/auth";
import { Plus, Edit, Trash2, Users, Shield } from "lucide-react";

export default function RolesManagement() {
  const {
    roles,
    permissions,
    userRoles,
    loading,
    error,
    fetchRoles,
    fetchPermissions,
    fetchUserRoles,
    createRole,
    updateRole,
    removeRole,
    hasPermission,
    user
  } = useFirebaseAuthStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleData>({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    if (user) {
      fetchUserRoles(user.uid);
    }
  }, [user]);

  const handleCreateRole = async () => {
    try {
      await createRole(formData);
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '', permissions: [] });
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      await updateRole(selectedRole.id, formData);
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!user) return;
    
    try {
      await removeRole(user.uid, roleId);
    } catch (error) {
      console.error('Failed to remove role:', error);
    }
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((p: any) => p.id)
    });
    setIsEditDialogOpen(true);
  };

  if (!hasPermission('roles', 'read')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <p>You don't have permission to view roles management.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Roles Management</h2>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        
        {hasPermission('roles', 'write') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with specific permissions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter role description"
                  />
                </div>
                
                <div>
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                    {permissions.map((permission: Permission) => (
                      <label key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(id => id !== permission.id)
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRole} disabled={loading}>
                    Create Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {role.name}
                  </CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </div>
                
                <div className="flex gap-2">
                  {hasPermission('roles', 'write') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {hasPermission('roles', 'delete') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Permissions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((permission: any) => (
                      <Badge key={permission.id} variant="secondary">
                        {permission.resource}:{permission.action}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {userRoles.filter((ur: any) => ur.roleId === role.id).length} users assigned
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input
                id="edit-role-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter role name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role-description">Description</Label>
              <Textarea
                id="edit-role-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter role description"
              />
            </div>
            
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                    {permissions.map((permission: Permission) => (
                  <label key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            permissions: [...formData.permissions, permission.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            permissions: formData.permissions.filter(id => id !== permission.id)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{permission.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={loading}>
                Update Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
