import { User as FirebaseUser } from 'firebase/auth';

// Role and Permission Types
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string; // e.g., 'users', 'analytics', 'roles'
  action: string; // e.g., 'read', 'write', 'delete', 'manage'
  description: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
}

// Extended User interface for Firebase
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole[];
  customClaims?: Record<string, any>;
}

// Firebase User with additional properties
export interface FirebaseUserWithRoles extends FirebaseUser {
  roles?: UserRole[];
  customClaims?: Record<string, any>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  status: 'success' | 'error';
  message: string;
  user: User;
  token?: string; // Firebase doesn't use traditional tokens
}

export interface AuthError {
  status: 'error';
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Role Management Types
export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface AssignRoleData {
  userId: string;
  roleId: string;
  assignedBy: string;
} 