import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Tutor, CreateTutorData, UpdateTutorData, TutorFilters } from '@/types/tutor';
import { fetchWithProgress } from '@/lib/api-progress';

interface TutorManagementStore {
  // State
  tutors: Tutor[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  lastDoc: any;
  hasMore: boolean;

  // Actions
  fetchTutors: (filters?: TutorFilters, loadMore?: boolean) => Promise<void>;
  createTutor: (tutorData: CreateTutorData) => Promise<void>;
  updateTutor: (tutorId: string, tutorData: UpdateTutorData) => Promise<void>;
  deleteTutor: (tutorId: string) => Promise<void>;
  getTutorById: (tutorId: string) => Promise<Tutor | null>;
  importTutors: (tutors: Tutor[]) => Promise<void>;
  toggleVerification: (tutorId: string, verified: boolean) => Promise<void>;
  toggleNotifications: (tutorId: string, enabled: boolean) => Promise<void>;
  toggleCancelled: (tutorId: string, cancelled: boolean) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetPagination: () => void;
}

// Helper function to determine sign-in method based on social IDs
const determineSignInMethod = (tutor: any): 'manual' | 'facebook' | 'google' | 'apple' => {
  if (tutor.facebook_id) return 'facebook';
  if (tutor.google_id) return 'google';
  return 'manual';
};

// Helper function to convert Firestore document to Tutor
const convertFirestoreDocToTutor = (doc: any): Tutor => {
  const data = doc.data();
  
  // Handle Firestore timestamp objects
  const convertTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    if (timestamp.toDate) return timestamp.toDate().toISOString();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toISOString();
    return timestamp;
  };
  
  const tutor = {
    id: doc.id,
    ...data,
    created_at: convertTimestamp(data.created_at),
    updated_at: convertTimestamp(data.updated_at),
    deleted_at: data.deleted_at ? convertTimestamp(data.deleted_at) : null,
  } as Tutor;
  
  // Determine and add sign-in method
  tutor.sign_in_method = determineSignInMethod(tutor);
  
  return tutor;
};

// Helper function to get request count for a tutor
const getTutorRequestCount = async (tutorId: string): Promise<number> => {
  try {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, where('tutor_id', '==', tutorId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error(`Error getting request count for tutor ${tutorId}:`, error);
    return 0;
  }
};

// Helper function to get request counts for multiple tutors
const getTutorsRequestCounts = async (tutors: Tutor[]): Promise<Tutor[]> => {
  try {
    const requestCountPromises = tutors.map(async (tutor) => {
      const requestCount = await getTutorRequestCount(tutor.id);
      return { ...tutor, request_count: requestCount };
    });
    
    return await Promise.all(requestCountPromises);
  } catch (error) {
    console.error('Error getting request counts for tutors:', error);
    return tutors; // Return tutors without request counts if there's an error
  }
};

// Helper function to convert undefined values to null (Firestore doesn't support undefined)
const cleanData = (obj: any): any => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    // Convert undefined to null, keep all other values including null
    cleaned[key] = obj[key] === undefined ? null : obj[key];
  });
  return cleaned;
};

export const useTutorManagementStore = create<TutorManagementStore>((set, get) => ({
  // Initial state
  tutors: [],
  loading: false,
  error: null,
  totalCount: 0,
  lastDoc: null,
  hasMore: true,

  // Actions
  fetchTutors: async (filters = {}, loadMore = false) => {
    try {
      set({ loading: true, error: null });
      
      const tutorsRef = collection(db, 'tutors');
      let tutors: Tutor[] = [];
      
      // Apply search filter with comprehensive field search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        
        // For better performance, we'll fetch a larger set and filter client-side
        let q = query(tutorsRef, orderBy('created_at', 'desc'), limit(100));
        
        // Apply other filters first to reduce the dataset
        if (filters.verified !== undefined) {
          q = query(q, where('verified', '==', filters.verified ? '2' : '0'));
        }
        
        if (filters.country) {
          q = query(q, where('country', '==', filters.country));
        }
        
        if (filters.gender) {
          q = query(q, where('gender', '==', filters.gender));
        }
        
        const tutorsSnapshot = await getDocs(q);
        const allTutors = tutorsSnapshot.docs.map(convertFirestoreDocToTutor);
        
        // Filter tutors by search term across all relevant fields
        tutors = allTutors.filter(tutor => {
          const searchableFields = [
            tutor.full_name?.toLowerCase(),
            tutor.nickname?.toLowerCase(),
            tutor.email?.toLowerCase(),
            tutor.phone?.toLowerCase(),
            tutor.whatsapp_phone?.toLowerCase(),
            tutor.country?.toLowerCase(),
            tutor.city?.toLowerCase(),
            tutor.nationality?.toLowerCase(),
            tutor.gender?.toLowerCase(),
            tutor.bio?.toLowerCase(),
            tutor.request_count?.toString(),
            tutor.sign_in_method?.toLowerCase(),
          ].filter(Boolean); // Remove undefined/null values
          
          return searchableFields.some(field => field?.includes(searchTerm));
        });
        
        // Sort by created_at descending
        tutors = tutors.sort((a, b) => {
          const dateA = typeof a.created_at === 'string' ? new Date(a.created_at) : new Date((a.created_at as any)._seconds * 1000);
          const dateB = typeof b.created_at === 'string' ? new Date(b.created_at) : new Date((b.created_at as any)._seconds * 1000);
          return dateB.getTime() - dateA.getTime();
        });
        
        // Get request counts for filtered tutors
        tutors = await getTutorsRequestCounts(tutors);
        
        // Apply has_requests filter if specified
        if (filters.has_requests !== undefined) {
          tutors = tutors.filter(tutor => 
            filters.has_requests ? (tutor.request_count || 0) > 0 : (tutor.request_count || 0) === 0
          );
        }
        
        // Apply sign_in_method filter if specified
        if (filters.sign_in_method) {
          tutors = tutors.filter(tutor => 
            tutor.sign_in_method === filters.sign_in_method
          );
        }
        
        // Apply pagination to filtered results
        const startIndex = loadMore ? get().tutors.length : 0;
        const endIndex = startIndex + 20;
        tutors = tutors.slice(startIndex, endIndex);
        
      } else {
        // No search term - use regular query with other filters
        let q = query(tutorsRef, orderBy('created_at', 'desc'), limit(20));
        
        if (filters.verified !== undefined) {
          q = query(q, where('verified', '==', filters.verified ? '2' : '0'));
        }
        
        if (filters.country) {
          q = query(q, where('country', '==', filters.country));
        }
        
        if (filters.gender) {
          q = query(q, where('gender', '==', filters.gender));
        }
        
        // Apply pagination
        if (loadMore && get().lastDoc) {
          q = query(q, startAfter(get().lastDoc));
        }
        
        const tutorsSnapshot = await getDocs(q);
        tutors = tutorsSnapshot.docs.map(convertFirestoreDocToTutor);
        
        // Get request counts for tutors
        tutors = await getTutorsRequestCounts(tutors);
        
        // Apply has_requests filter if specified
        if (filters.has_requests !== undefined) {
          tutors = tutors.filter(tutor => 
            filters.has_requests ? (tutor.request_count || 0) > 0 : (tutor.request_count || 0) === 0
          );
        }
        
        // Apply sign_in_method filter if specified
        if (filters.sign_in_method) {
          tutors = tutors.filter(tutor => 
            tutor.sign_in_method === filters.sign_in_method
          );
        }
        
        set(state => ({
          tutors: loadMore ? [...state.tutors, ...tutors] : tutors,
          lastDoc: tutorsSnapshot.docs[tutorsSnapshot.docs.length - 1] || null,
          hasMore: tutorsSnapshot.docs.length === 20,
          totalCount: loadMore ? state.totalCount : tutorsSnapshot.size,
          loading: false,
        }));
      }
      
      // For search results, update state differently
      if (filters.search) {
        set(state => ({
          tutors: loadMore ? [...state.tutors, ...tutors] : tutors,
          lastDoc: null, // Reset pagination for search results
          hasMore: tutors.length === 20, // Check if we got a full page
          totalCount: tutors.length,
          loading: false,
        }));
      }
      
    } catch (error: any) {
      console.error('Error fetching tutors:', error);
      set({ 
        error: error.message || 'Failed to fetch tutors',
        loading: false 
      });
    }
  },

  createTutor: async (tutorData) => {
    try {
      set({ loading: true, error: null });
      
      // Call API route to create tutor with bcrypt password hashing
      const response = await fetchWithProgress('/api/tutors/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tutorData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create tutor');
      }

      console.log('✅ Tutor created successfully:', result.tutorId);
      
      set({ loading: false });
      get().fetchTutors(); // Refresh tutors list
    } catch (error: any) {
      console.error('Error creating tutor:', error);
      set({ 
        error: error.message || 'Failed to create tutor',
        loading: false 
      });
      throw error;
    }
  },

  updateTutor: async (tutorId, tutorData) => {
    try {
      console.log('Updating tutor:', tutorId);
      set({ loading: true, error: null });
      console.log('Tutor data:', tutorData);
      
      // Call API route to update tutor with bcrypt password hashing
      const response = await fetchWithProgress('/api/tutors/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId,
          ...tutorData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update tutor');
      }

      console.log('✅ Tutor updated successfully:', tutorId);
      
      set({ loading: false });
      get().fetchTutors(); // Refresh tutors list
    } catch (error: any) {
      console.error('Error updating tutor:', error);
      set({ 
        error: error.message || 'Failed to update tutor',
        loading: false 
      });
      throw error;
    }
  },

  deleteTutor: async (tutorId) => {
    try {
      set({ loading: true, error: null });
      
      // Soft delete by setting deleted_at timestamp
      const tutorRef = doc(db, 'tutors', tutorId);
      await updateDoc(tutorRef, {
        deleted_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      set({ loading: false });
      get().fetchTutors(); // Refresh tutors list
    } catch (error: any) {
      console.error('Error deleting tutor:', error);
      set({ 
        error: error.message || 'Failed to delete tutor',
        loading: false 
      });
      throw error;
    }
  },

  getTutorById: async (tutorId) => {
    try {
      const tutorSnapshot = await getDocs(query(collection(db, 'tutors'), where('__name__', '==', tutorId)));
      
      if (tutorSnapshot.empty) {
        return null;
      }
      
      return convertFirestoreDocToTutor(tutorSnapshot.docs[0]);
    } catch (error: any) {
      console.error('Error fetching tutor by ID:', error);
      return null;
    }
  },

  importTutors: async (tutors) => {
    try {
      set({ loading: true, error: null });
      
      const batch = tutors.map(async (tutor) => {
        const tutorRef = doc(collection(db, 'tutors'));
        const cleanedTutor = cleanData({
          ...tutor,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        await setDoc(tutorRef, cleanedTutor);
      });
      
      await Promise.all(batch);
      
      set({ loading: false });
      get().fetchTutors(); // Refresh tutors list
    } catch (error: any) {
      console.error('Error importing tutors:', error);
      set({ 
        error: error.message || 'Failed to import tutors',
        loading: false 
      });
      throw error;
    }
  },

  toggleVerification: async (tutorId, verified) => {
    try {
      const tutorRef = doc(db, 'tutors', tutorId);
      await updateDoc(tutorRef, {
        verified: verified ? '2' : '0',
        updated_at: serverTimestamp(),
      });
      
      // Update local state
      set(state => ({
        tutors: state.tutors.map(tutor =>
          tutor.id === tutorId ? { ...tutor, verified: verified ? '2' : '0' } : tutor
        ),
      }));
    } catch (error: any) {
      console.error('Error toggling verification:', error);
      set({ error: error.message || 'Failed to toggle verification' });
      throw error;
    }
  },

  toggleNotifications: async (tutorId, enabled) => {
    try {
      const tutorRef = doc(db, 'tutors', tutorId);
      await updateDoc(tutorRef, {
        send_notifications: enabled ? '1' : '0',
        updated_at: serverTimestamp(),
      });
      
      // Update local state
      set(state => ({
        tutors: state.tutors.map(tutor =>
          tutor.id === tutorId ? { ...tutor, send_notifications: enabled ? '1' : '0' } : tutor
        ),
      }));
    } catch (error: any) {
      console.error('Error toggling notifications:', error);
      set({ error: error.message || 'Failed to toggle notifications' });
      throw error;
    }
  },

  toggleCancelled: async (tutorId, cancelled) => {
    try {
      const tutorRef = doc(db, 'tutors', tutorId);
      await updateDoc(tutorRef, {
        cancelled: cancelled ? '1' : '0',
        updated_at: serverTimestamp(),
      });
      
      // Update local state
      set(state => ({
        tutors: state.tutors.map(tutor =>
          tutor.id === tutorId ? { ...tutor, cancelled: cancelled ? '1' : '0' } : tutor
        ),
      }));
    } catch (error: any) {
      console.error('Error toggling cancelled status:', error);
      set({ error: error.message || 'Failed to toggle cancelled status' });
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetPagination: () => set({ lastDoc: null, hasMore: true }),
}));

