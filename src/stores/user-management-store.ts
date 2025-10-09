import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import { User, UserRole } from '@/types/auth';

interface UserManagementStore {
  // State
  users: User[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<void>;
  updateUser: (userId: string, userData: UpdateUserData) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  assignRole: (userId: string, roleId: string, assignedBy: string) => Promise<void>;
  removeRole: (userId: string, roleId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

interface CreateUserData {
  email: string;
  password: string;
  displayName?: string;
  roles?: string[]; // Role IDs
}

interface UpdateUserData {
  displayName?: string;
  email?: string;
  roles?: string[];
}

// Helper function to convert Firebase user to our User type
const convertFirebaseUserToUser = async (firebaseUser: any): Promise<User> => {
  // Fetch user roles from Firestore
  const userRolesQuery = query(
    collection(db, 'userRoles'),
    where('userId', '==', firebaseUser.uid),
    where('isActive', '==', true)
  );
  
  const userRolesSnapshot = await getDocs(userRolesQuery);
  const userRoles: UserRole[] = userRolesSnapshot.docs.map(doc => ({
    ...doc.data(),
    assignedAt: doc.data().assignedAt?.toDate() || new Date(),
  })) as UserRole[];

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || undefined,
    photoURL: firebaseUser.photoURL || undefined,
    emailVerified: firebaseUser.emailVerified || false,
    createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
    updatedAt: new Date(firebaseUser.metadata?.lastSignInTime || Date.now()),
    roles: userRoles,
    customClaims: firebaseUser.customClaims || {},
  };
};

export const useUserManagementStore = create<UserManagementStore>((set, get) => ({
  // Initial state
  users: [],
  loading: false,
  error: null,

  // Actions
  fetchUsers: async () => {
    try {
      set({ loading: true, error: null });
      // Get all users from Firebase Auth (this would typically be done server-side)
      // For now, we'll get users from a custom collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users: User[] = [];
      console.log("usersSnapshot: " + usersSnapshot);
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        // Fetch user roles
        const userRolesQuery = query(
          collection(db, 'userRoles'),
          where('userId', '==', userDoc.id),
          where('isActive', '==', true)
        );
        
        const userRolesSnapshot = await getDocs(userRolesQuery);
        const userRoles: UserRole[] = userRolesSnapshot.docs.map(doc => ({
          ...doc.data(),
          assignedAt: doc.data().assignedAt?.toDate() || new Date(),
        })) as UserRole[];

        users.push({
          uid: userDoc.id,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          emailVerified: userData.emailVerified || false,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
          roles: userRoles,
          customClaims: userData.customClaims || {},
        });
      }

      set({ users, loading: false });
    } catch (error) {
      console.error('Error fetching users:', error);
      set({ 
        error: 'Failed to fetch users',
        loading: false 
      });
    }
  },

  createUser: async (userData) => {
    try {
      set({ loading: true, error: null });
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const firebaseUser = userCredential.user;
      
      // Update display name if provided
      if (userData.displayName) {
        await updateProfile(firebaseUser, {
          displayName: userData.displayName
        });
      }
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: userData.email,
        displayName: userData.displayName || '',
        photoURL: '',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        customClaims: {},
      });
      
      // Assign roles if provided
      if (userData.roles && userData.roles.length > 0) {
        for (const roleId of userData.roles) {
          await addDoc(collection(db, 'userRoles'), {
            userId: firebaseUser.uid,
            roleId: roleId,
            assignedBy: auth.currentUser?.uid || 'system',
            assignedAt: serverTimestamp(),
            isActive: true,
          });
        }
      }
      
      set({ loading: false });
      get().fetchUsers(); // Refresh users list
    } catch (error: any) {
      console.error('Error creating user:', error);
      set({ 
        error: error.message || 'Failed to create user',
        loading: false 
      });
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      set({ loading: true, error: null });
      
      // Update user data in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
      
      // Update roles if provided
      if (userData.roles) {
        // Remove existing roles
        const existingRolesQuery = query(
          collection(db, 'userRoles'),
          where('userId', '==', userId),
          where('isActive', '==', true)
        );
        
        const existingRolesSnapshot = await getDocs(existingRolesQuery);
        for (const roleDoc of existingRolesSnapshot.docs) {
          await updateDoc(roleDoc.ref, {
            isActive: false,
            updatedAt: serverTimestamp(),
          });
        }
        
        // Add new roles
        for (const roleId of userData.roles) {
          await addDoc(collection(db, 'userRoles'), {
            userId: userId,
            roleId: roleId,
            assignedBy: auth.currentUser?.uid || 'system',
            assignedAt: serverTimestamp(),
            isActive: true,
          });
        }
      }
      
      set({ loading: false });
      get().fetchUsers(); // Refresh users list
    } catch (error: any) {
      console.error('Error updating user:', error);
      set({ 
        error: error.message || 'Failed to update user',
        loading: false 
      });
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      set({ loading: true, error: null });
      
      // Note: In a real app, you'd need admin privileges to delete users
      // This is a simplified version that just removes from Firestore
      
      // Remove user roles
      const userRolesQuery = query(
        collection(db, 'userRoles'),
        where('userId', '==', userId)
      );
      
      const userRolesSnapshot = await getDocs(userRolesQuery);
      for (const roleDoc of userRolesSnapshot.docs) {
        await deleteDoc(roleDoc.ref);
      }
      
      // Remove user document
      await deleteDoc(doc(db, 'users', userId));
      
      set({ loading: false });
      get().fetchUsers(); // Refresh users list
    } catch (error: any) {
      console.error('Error deleting user:', error);
      set({ 
        error: error.message || 'Failed to delete user',
        loading: false 
      });
      throw error;
    }
  },

  assignRole: async (userId, roleId, assignedBy) => {
    try {
      set({ loading: true, error: null });
      
      await addDoc(collection(db, 'userRoles'), {
        userId: userId,
        roleId: roleId,
        assignedBy: assignedBy,
        assignedAt: serverTimestamp(),
        isActive: true,
      });
      
      set({ loading: false });
      get().fetchUsers(); // Refresh users list
    } catch (error: any) {
      console.error('Error assigning role:', error);
      set({ 
        error: error.message || 'Failed to assign role',
        loading: false 
      });
      throw error;
    }
  },

  removeRole: async (userId, roleId) => {
    try {
      set({ loading: true, error: null });
      
      const userRolesQuery = query(
        collection(db, 'userRoles'),
        where('userId', '==', userId),
        where('roleId', '==', roleId),
        where('isActive', '==', true)
      );
      
      const userRolesSnapshot = await getDocs(userRolesQuery);
      
      for (const docSnapshot of userRolesSnapshot.docs) {
        await updateDoc(docSnapshot.ref, {
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }
      
      set({ loading: false });
      get().fetchUsers(); // Refresh users list
    } catch (error: any) {
      console.error('Error removing role:', error);
      set({ 
        error: error.message || 'Failed to remove role',
        loading: false 
      });
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
