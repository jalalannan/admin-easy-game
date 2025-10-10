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
  getCountFromServer,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PromoCode, CreatePromoCodeData, UpdatePromoCodeData, PromoCodeFilters, PromoCodeUsage, CreatePromoCodeUsageData } from '@/types/promo-code';

interface PromoCodeManagementStore {
  // State
  promoCodes: PromoCode[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  lastDoc: any;
  hasMore: boolean;

  // Actions
  fetchPromoCodes: (filters?: PromoCodeFilters, loadMore?: boolean) => Promise<void>;
  createPromoCode: (promoCodeData: CreatePromoCodeData) => Promise<void>;
  updatePromoCode: (promoCodeId: string, promoCodeData: UpdatePromoCodeData) => Promise<void>;
  deletePromoCode: (promoCodeId: string) => Promise<void>;
  toggleActiveStatus: (promoCodeId: string, isActive: boolean) => Promise<void>;
  getPromoCodeById: (promoCodeId: string) => Promise<PromoCode | null>;
  
  // Usage tracking functions
  fetchPromoCodeUsage: (promoCodeId: string) => Promise<PromoCodeUsage[]>;
  addPromoCodeUsage: (promoCodeId: string, usageData: CreatePromoCodeUsageData) => Promise<void>;
  updatePromoCodeUsage: (promoCodeId: string, studentId: string, usageData: Partial<CreatePromoCodeUsageData>) => Promise<void>;
  deletePromoCodeUsage: (promoCodeId: string, studentId: string) => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetPagination: () => void;
}

// Helper function to convert Firestore document to PromoCode
const convertFirestoreDocToPromoCode = (doc: any): PromoCode => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    used_by: data.used_by ? data?.used_by?.map(convertFirestoreDocToPromoCodeUsage) : [],
    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
    updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
    deleted_at: data.deleted_at?.toDate?.()?.toISOString() || data.deleted_at,
  } as PromoCode;
};

// Helper function to convert Firestore document to PromoCodeUsage
const convertFirestoreDocToPromoCodeUsage = (data: any): PromoCodeUsage => {
  return {
    student_id: data.student_id,
    email: data.email,
    number_of_usage: data.number_of_usage,
  } as PromoCodeUsage;
};

// Helper function to convert undefined values to null (Firestore doesn't support undefined)
const cleanData = (obj: any): any => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    cleaned[key] = obj[key] === undefined ? null : obj[key];
  });
  return cleaned;
};

export const usePromoCodeManagementStore = create<PromoCodeManagementStore>((set, get) => ({
  // Initial state
  promoCodes: [],
  loading: false,
  error: null,
  totalCount: 0,
  lastDoc: null,
  hasMore: true,

  // Actions
  fetchPromoCodes: async (filters = {}, loadMore = false) => {
    try {
      set({ loading: true, error: null });
      
      const promoCodesRef = collection(db, 'promo_codes');
      let promoCodes: PromoCode[] = [];
      
      // Apply search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        
        let q = query(promoCodesRef, orderBy('created_at', 'desc'), limit(100));
        
        // Apply other filters
        if (filters.type) {
          q = query(q, where('type', '==', filters.type));
        }
        
        if (filters.is_active !== undefined) {
          q = query(q, where('is_active', '==', filters.is_active ? '1' : '0'));
        }
        
        const promoCodesSnapshot = await getDocs(q);
        const allPromoCodes = promoCodesSnapshot.docs.map(convertFirestoreDocToPromoCode);
        
        // Filter by search term
        promoCodes = allPromoCodes.filter(promoCode => {
          const searchableFields = [
            promoCode.code?.toLowerCase(),
            promoCode.description?.toLowerCase(),
            promoCode.type?.toLowerCase(),
            promoCode.discount?.toString(),
          ].filter(Boolean);
          
          return searchableFields.some(field => field?.includes(searchTerm));
        });
        
        // Apply discount range filters
        if (filters.min_discount !== undefined) {
          promoCodes = promoCodes.filter(pc => pc.discount >= filters.min_discount!);
        }
        
        if (filters.max_discount !== undefined) {
          promoCodes = promoCodes.filter(pc => pc.discount <= filters.max_discount!);
        }
        
        // Sort by created_at descending
        promoCodes = promoCodes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
      } else {
        // No search term - use regular query
        let q = query(promoCodesRef, orderBy('created_at', 'desc'), limit(20));
        
        if (filters.type) {
          q = query(q, where('type', '==', filters.type));
        }
        
        if (filters.is_active !== undefined) {
          q = query(q, where('is_active', '==', filters.is_active ? '1' : '0'));
        }
        
        // Apply pagination
        if (loadMore && get().lastDoc) {
          q = query(q, startAfter(get().lastDoc));
        }
        
        const promoCodesSnapshot = await getDocs(q);
        promoCodes = promoCodesSnapshot.docs.map(convertFirestoreDocToPromoCode);
        
        // Apply discount range filters
        if (filters.min_discount !== undefined) {
          promoCodes = promoCodes.filter(pc => pc.discount >= filters.min_discount!);
        }
        
        if (filters.max_discount !== undefined) {
          promoCodes = promoCodes.filter(pc => pc.discount <= filters.max_discount!);
        }
        
        set(state => ({
          promoCodes: loadMore ? [...state.promoCodes, ...promoCodes] : promoCodes,
          lastDoc: promoCodesSnapshot.docs[promoCodesSnapshot.docs.length - 1] || null,
          hasMore: promoCodesSnapshot.docs.length === 20,
          totalCount: loadMore ? state.totalCount : promoCodesSnapshot.size,
          loading: false,
        }));
      }
      
      // For search results, update state differently
      if (filters.search) {
        set(state => ({
          promoCodes: loadMore ? [...state.promoCodes, ...promoCodes] : promoCodes,
          lastDoc: null,
          hasMore: promoCodes.length === 20,
          totalCount: promoCodes.length,
          loading: false,
        }));
      }
      
    } catch (error: any) {
      console.error('Error fetching promo codes:', error);
      set({ 
        error: error.message || 'Failed to fetch promo codes',
        loading: false 
      });
    }
  },

  createPromoCode: async (promoCodeData) => {
    try {
      set({ loading: true, error: null });
      
      const promoCodeRef = doc(collection(db, 'promo_codes'));
      const cleanedData = cleanData({
        ...promoCodeData,
        current_usage: 0,
        is_active: '1',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      await setDoc(promoCodeRef, cleanedData);
      
      console.log('✅ Promo code created successfully:', promoCodeRef.id);
      
      set({ loading: false });
      get().fetchPromoCodes();
    } catch (error: any) {
      console.error('Error creating promo code:', error);
      set({ 
        error: error.message || 'Failed to create promo code',
        loading: false 
      });
      throw error;
    }
  },

  updatePromoCode: async (promoCodeId, promoCodeData) => {
    try {
      console.log('Updating promo code:', promoCodeId);
      set({ loading: true, error: null });
      
      const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
      const cleanedData = cleanData({
        ...promoCodeData,
        updated_at: serverTimestamp(),
      });
      
      await updateDoc(promoCodeRef, cleanedData);
      
      console.log('✅ Promo code updated successfully:', promoCodeId);
      
      set({ loading: false });
      get().fetchPromoCodes();
    } catch (error: any) {
      console.error('Error updating promo code:', error);
      set({ 
        error: error.message || 'Failed to update promo code',
        loading: false 
      });
      throw error;
    }
  },

  deletePromoCode: async (promoCodeId) => {
    try {
      set({ loading: true, error: null });
      
      const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
      await deleteDoc(promoCodeRef);
      
      console.log('✅ Promo code deleted successfully:', promoCodeId);
      
      set({ loading: false });
      get().fetchPromoCodes();
    } catch (error: any) {
      console.error('Error deleting promo code:', error);
      set({ 
        error: error.message || 'Failed to delete promo code',
        loading: false 
      });
      throw error;
    }
  },

  toggleActiveStatus: async (promoCodeId, isActive) => {
    try {
      console.log('Toggling promo code active status:', promoCodeId, 'to:', isActive);
      set({ loading: true, error: null });
      
      const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
      await updateDoc(promoCodeRef, {
        is_active: isActive ? '1' : '0',
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ Promo code status toggled successfully:', promoCodeId, 'to:', isActive ? 'active' : 'inactive');
      
      set({ loading: false });
      get().fetchPromoCodes();
    } catch (error: any) {
      console.error('Error toggling promo code status:', error);
      set({ 
        error: error.message || 'Failed to toggle promo code status',
        loading: false 
      });
      throw error;
    }
  },

  getPromoCodeById: async (promoCodeId) => {
    try {
      const promoCodeSnapshot = await getDocs(
        query(collection(db, 'promo_codes'), where('__name__', '==', promoCodeId))
      );
      
      if (promoCodeSnapshot.empty) {
        return null;
      }
      
      return convertFirestoreDocToPromoCode(promoCodeSnapshot.docs[0]);
    } catch (error: any) {
      console.error('Error fetching promo code by ID:', error);
      return null;
    }
  },

  // Usage tracking functions
  fetchPromoCodeUsage: async (promoCodeId) => {
    try {
      console.log('Fetching promo code usage for:', promoCodeId);
      const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
      const promoCodeDoc = await getDoc(promoCodeRef);
      
      if (!promoCodeDoc.exists()) {
        return [];
      }
      
      const data = promoCodeDoc.data();
      const usage = data?.used_by ? data.used_by.map(convertFirestoreDocToPromoCodeUsage) : [];
      
      console.log('✅ Fetched promo code usage:', usage.length, 'records');
      return usage;
    } catch (error: any) {
      console.error('Error fetching promo code usage:', error);
      throw error;
    }
  },

  addPromoCodeUsage: async (promoCodeId, usageData) => {
    try {
      console.log('Adding promo code usage:', promoCodeId, usageData);
      const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
      const promoCodeDoc = await getDoc(promoCodeRef);
      
      if (!promoCodeDoc.exists()) {
        throw new Error('Promo code not found');
      }
      
      const data = promoCodeDoc.data();
      const usedBy = data?.used_by || [];
      
      // Check if student already exists in the array
      const existingIndex = usedBy.findIndex((item: any) => item.student_id === usageData.student_id);
      
      let updatedUsedBy;
      if (existingIndex >= 0) {
        // Update existing student's usage count
        updatedUsedBy = [...usedBy];
        updatedUsedBy[existingIndex] = {
          ...updatedUsedBy[existingIndex],
          number_of_usage: updatedUsedBy[existingIndex].number_of_usage + usageData.number_of_usage,
        };
      } else {
        // Add new student to the array
        updatedUsedBy = [...usedBy, usageData];
      }
      
      // Update the promo code document
      await updateDoc(promoCodeRef, {
        used_by: updatedUsedBy,
        current_usage: (data?.current_usage || 0) + usageData.number_of_usage,
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ Promo code usage added successfully');
    } catch (error: any) {
      console.error('Error adding promo code usage:', error);
      throw error;
    }
  },

  updatePromoCodeUsage: async (promoCodeId, studentId, usageData) => {
    try {
      console.log('Updating promo code usage:', promoCodeId, studentId, usageData);
      const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
      const promoCodeDoc = await getDoc(promoCodeRef);
      
      if (!promoCodeDoc.exists()) {
        throw new Error('Promo code not found');
      }
      
      const data = promoCodeDoc.data();
      const usedBy = data?.used_by || [];
      
      // Find and update the student's usage
      const updatedUsedBy = usedBy.map((item: any) => 
        item.student_id === studentId 
          ? { ...item, ...usageData }
          : item
      );
      
      // Update the promo code document
      await updateDoc(promoCodeRef, {
        used_by: updatedUsedBy,
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ Promo code usage updated successfully');
    } catch (error: any) {
      console.error('Error updating promo code usage:', error);
      throw error;
    }
  },

  deletePromoCodeUsage: async (promoCodeId, studentId) => {
    try {
      console.log('Deleting promo code usage:', promoCodeId, studentId);
      const promoCodeRef = doc(db, 'promo_codes', promoCodeId);
      const promoCodeDoc = await getDoc(promoCodeRef);
      
      if (!promoCodeDoc.exists()) {
        throw new Error('Promo code not found');
      }
      
      const data = promoCodeDoc.data();
      const usedBy = data?.used_by || [];
      
      // Find the student to get their usage count before deletion
      const studentUsage = usedBy.find((item: any) => item.student_id === studentId);
      
      // Remove the student from the array
      const updatedUsedBy = usedBy.filter((item: any) => item.student_id !== studentId);
      
      // Update the promo code document
      await updateDoc(promoCodeRef, {
        used_by: updatedUsedBy,
        current_usage: Math.max(0, (data?.current_usage || 0) - (studentUsage?.number_of_usage || 0)),
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ Promo code usage deleted successfully');
    } catch (error: any) {
      console.error('Error deleting promo code usage:', error);
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetPagination: () => set({ lastDoc: null, hasMore: true }),
}));

