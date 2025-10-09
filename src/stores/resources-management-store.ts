import { create } from 'zustand';
import { 
  doc, 
  getDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  FAQ, 
  Language, 
  Social, 
  SubSubject, 
  Subject,
  CreateFAQData,
  UpdateFAQData,
  CreateLanguageData,
  UpdateLanguageData,
  CreateSocialData,
  UpdateSocialData,
  CreateSubSubjectData,
  UpdateSubSubjectData,
  CreateSubjectData,
  UpdateSubjectData,
  FAQFilters,
  LanguageFilters,
  SocialFilters,
  SubSubjectFilters,
  SubjectFilters
} from '@/types/resources';

interface ResourcesManagementStore {
  // State
  faqs: FAQ[];
  languages: Language[];
  socials: Social[];
  subSubjects: SubSubject[];
  subjects: Subject[];
  loading: boolean;
  error: string | null;

  // Actions
  // FAQs
  fetchFAQs: (filters?: FAQFilters) => Promise<void>;
  createFAQ: (faqData: CreateFAQData) => Promise<void>;
  updateFAQ: (faqId: string, faqData: UpdateFAQData) => Promise<void>;
  deleteFAQ: (faqId: string) => Promise<void>;

  // Languages
  fetchLanguages: (filters?: LanguageFilters) => Promise<void>;
  createLanguage: (languageData: CreateLanguageData) => Promise<void>;
  updateLanguage: (languageId: string, languageData: UpdateLanguageData) => Promise<void>;
  deleteLanguage: (languageId: string) => Promise<void>;

  // Socials
  fetchSocials: (filters?: SocialFilters) => Promise<void>;
  createSocial: (socialData: CreateSocialData) => Promise<void>;
  updateSocial: (socialId: string, socialData: UpdateSocialData) => Promise<void>;
  deleteSocial: (socialId: string) => Promise<void>;

  // Sub Subjects
  fetchSubSubjects: (filters?: SubSubjectFilters) => Promise<void>;
  createSubSubject: (subSubjectData: CreateSubSubjectData) => Promise<void>;
  updateSubSubject: (subSubjectId: string, subSubjectData: UpdateSubSubjectData) => Promise<void>;
  deleteSubSubject: (subSubjectId: string) => Promise<void>;

  // Subjects
  fetchSubjects: (filters?: SubjectFilters) => Promise<void>;
  createSubject: (subjectData: CreateSubjectData) => Promise<void>;
  updateSubject: (subjectId: string, subjectData: UpdateSubjectData) => Promise<void>;
  deleteSubject: (subjectId: string) => Promise<void>;

  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchAllResources: () => Promise<void>;
}

// Helper function to generate unique ID
const generateId = () => Date.now().toString();

// Helper function to convert Firestore timestamps
const convertTimestamps = (items: any[]) => {
  return items.map(item => ({
    ...item,
    created_at: item.created_at?.toDate?.()?.toISOString() || item.created_at,
    updated_at: item.updated_at?.toDate?.()?.toISOString() || item.updated_at,
    deleted_at: item.deleted_at?.toDate?.()?.toISOString() || item.deleted_at || null,
  }));
};

export const useResourcesManagementStore = create<ResourcesManagementStore>((set, get) => ({
  // Initial state
  faqs: [],
  languages: [],
  socials: [],
  subSubjects: [],
  subjects: [],
  loading: false,
  error: null,

  // Helper function to fetch all resources from the single document
  fetchAllResources: async () => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        
        set({
          faqs: convertTimestamps(data.faqs || []),
          languages: convertTimestamps(data.languages || []),
          socials: convertTimestamps(data.socials || []),
          subSubjects: convertTimestamps(data.sub_subjects || []),
          subjects: convertTimestamps(data.subjects || []),
          loading: false
        });
      } else {
        // Document doesn't exist, initialize with empty arrays
        set({
          faqs: [],
          languages: [],
          socials: [],
          subSubjects: [],
          subjects: [],
          loading: false
        });
      }
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      set({ 
        error: error.message || 'Failed to fetch resources',
        loading: false 
      });
    }
  },

  // FAQs Actions
  fetchFAQs: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        let faqs = convertTimestamps(data.faqs || []);
        
        // Apply filters
        if (filters.user_type) {
          faqs = faqs.filter((faq: FAQ) => faq.user_type === filters.user_type);
        }
        
        // Apply search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          faqs = faqs.filter((faq: FAQ) => 
            faq.question.toLowerCase().includes(searchTerm) ||
            faq.answer.toLowerCase().includes(searchTerm) ||
            (faq.title?.toLowerCase().includes(searchTerm))
          );
        }
        
        set({ faqs, loading: false });
      } else {
        set({ faqs: [], loading: false });
      }
    } catch (error: any) {
      console.error('Error fetching FAQs:', error);
      set({ 
        error: error.message || 'Failed to fetch FAQs',
        loading: false 
      });
    }
  },

  createFAQ: async (faqData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const now = new Date().toISOString();
      
      const newFAQ: FAQ = {
        id: generateId(),
        ...faqData,
        created_at: now,
        updated_at: now,
      };
      
      // Get current data
      const resourcesSnapshot = await getDoc(resourcesRef);
      const currentData = resourcesSnapshot.exists() ? resourcesSnapshot.data() : {};
      
      await updateDoc(resourcesRef, {
        faqs: [...(currentData.faqs || []), newFAQ]
      });
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error creating FAQ:', error);
      set({ 
        error: error.message || 'Failed to create FAQ',
        loading: false 
      });
      throw error;
    }
  },

  updateFAQ: async (faqId, faqData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const faqs = data.faqs || [];
        console.log('faqs', faqs);
        console.log('faqs', faqData);
        const updatedFAQs = faqs.map((faq: FAQ) => 
          faq.id === faqId 
            ? { ...faq, ...faqData, updated_at: new Date().toISOString() }
            : faq
        );
        
        await updateDoc(resourcesRef, {
          faqs: updatedFAQs
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error updating FAQ:', error);
      set({ 
        error: error.message || 'Failed to update FAQ',
        loading: false 
      });
      throw error;
    }
  },

  deleteFAQ: async (faqId) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const faqs = data.faqs || [];
        
        const updatedFAQs = faqs.filter((faq: FAQ) => faq.id !== faqId);
        
        await updateDoc(resourcesRef, {
          faqs: updatedFAQs
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error deleting FAQ:', error);
      set({ 
        error: error.message || 'Failed to delete FAQ',
        loading: false 
      });
      throw error;
    }
  },

  // Languages Actions
  fetchLanguages: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        let languages = convertTimestamps(data.languages || []);
        
        // Apply filters
        if (filters.language_code) {
          languages = languages.filter((language: Language) => language.language_code === filters.language_code);
        }
        
        // Apply search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          languages = languages.filter((language: Language) => 
            language.language_name.toLowerCase().includes(searchTerm) ||
            language.language_code.toLowerCase().includes(searchTerm)
          );
        }
        
        set({ languages, loading: false });
      } else {
        set({ languages: [], loading: false });
      }
    } catch (error: any) {
      console.error('Error fetching languages:', error);
      set({ 
        error: error.message || 'Failed to fetch languages',
        loading: false 
      });
    }
  },

  createLanguage: async (languageData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const now = new Date().toISOString();
      
      const newLanguage: Language = {
        id: generateId(),
        ...languageData,
        created_at: now,
        updated_at: now,
      };
      
      const resourcesSnapshot = await getDoc(resourcesRef);
      const currentData = resourcesSnapshot.exists() ? resourcesSnapshot.data() : {};
      
      await updateDoc(resourcesRef, {
        languages: [...(currentData.languages || []), newLanguage]
      });
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error creating language:', error);
      set({ 
        error: error.message || 'Failed to create language',
        loading: false 
      });
      throw error;
    }
  },

  updateLanguage: async (languageId, languageData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const languages = data.languages || [];
        
        const updatedLanguages = languages.map((language: Language) => 
          language.id === languageId 
            ? { ...language, ...languageData, updated_at: new Date().toISOString() }
            : language
        );
        
        await updateDoc(resourcesRef, {
          languages: updatedLanguages
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error updating language:', error);
      set({ 
        error: error.message || 'Failed to update language',
        loading: false 
      });
      throw error;
    }
  },

  deleteLanguage: async (languageId) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const languages = data.languages || [];
        
        const updatedLanguages = languages.filter((language: Language) => language.id !== languageId);
        
        await updateDoc(resourcesRef, {
          languages: updatedLanguages
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error deleting language:', error);
      set({ 
        error: error.message || 'Failed to delete language',
        loading: false 
      });
      throw error;
    }
  },

  // Socials Actions
  fetchSocials: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        let socials = convertTimestamps(data.socials || []);
        
        // Apply search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          socials = socials.filter((social: Social) => 
            social.title.toLowerCase().includes(searchTerm) ||
            social.link.toLowerCase().includes(searchTerm)
          );
        }
        
        set({ socials, loading: false });
      } else {
        set({ socials: [], loading: false });
      }
    } catch (error: any) {
      console.error('Error fetching socials:', error);
      set({ 
        error: error.message || 'Failed to fetch socials',
        loading: false 
      });
    }
  },

  createSocial: async (socialData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const now = new Date().toISOString();
      
      const newSocial: Social = {
        id: generateId(),
        ...socialData,
        created_at: now,
        updated_at: now,
      };
      
      const resourcesSnapshot = await getDoc(resourcesRef);
      const currentData = resourcesSnapshot.exists() ? resourcesSnapshot.data() : {};
      
      await updateDoc(resourcesRef, {
        socials: [...(currentData.socials || []), newSocial]
      });
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error creating social:', error);
      set({ 
        error: error.message || 'Failed to create social',
        loading: false 
      });
      throw error;
    }
  },

  updateSocial: async (socialId, socialData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const socials = data.socials || [];
        
        const updatedSocials = socials.map((social: Social) => 
          social.id === socialId 
            ? { ...social, ...socialData, updated_at: new Date().toISOString() }
            : social
        );
        
        await updateDoc(resourcesRef, {
          socials: updatedSocials
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error updating social:', error);
      set({ 
        error: error.message || 'Failed to update social',
        loading: false 
      });
      throw error;
    }
  },

  deleteSocial: async (socialId) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const socials = data.socials || [];
        
        const updatedSocials = socials.filter((social: Social) => social.id !== socialId);
        
        await updateDoc(resourcesRef, {
          socials: updatedSocials
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error deleting social:', error);
      set({ 
        error: error.message || 'Failed to delete social',
        loading: false 
      });
      throw error;
    }
  },

  // Sub Subjects Actions
  fetchSubSubjects: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        let subSubjects = convertTimestamps(data.sub_subjects || []);
        
        // Apply filters
        if (filters.subject_id) {
          subSubjects = subSubjects.filter((subSubject: SubSubject) => subSubject.subject_id === filters.subject_id);
        }
        
        // Apply search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          subSubjects = subSubjects.filter((subSubject: SubSubject) => 
            subSubject.label.toLowerCase().includes(searchTerm)
          );
        }
        
        set({ subSubjects, loading: false });
      } else {
        set({ subSubjects: [], loading: false });
      }
    } catch (error: any) {
      console.error('Error fetching sub subjects:', error);
      set({ 
        error: error.message || 'Failed to fetch sub subjects',
        loading: false 
      });
    }
  },

  createSubSubject: async (subSubjectData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const now = new Date().toISOString();
      
      const newSubSubject: SubSubject = {
        id: generateId(),
        ...subSubjectData,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      
      const resourcesSnapshot = await getDoc(resourcesRef);
      const currentData = resourcesSnapshot.exists() ? resourcesSnapshot.data() : {};
      
      await updateDoc(resourcesRef, {
        sub_subjects: [...(currentData.sub_subjects || []), newSubSubject]
      });
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error creating sub subject:', error);
      set({ 
        error: error.message || 'Failed to create sub subject',
        loading: false 
      });
      throw error;
    }
  },

  updateSubSubject: async (subSubjectId, subSubjectData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const subSubjects = data.sub_subjects || [];
        
        const updatedSubSubjects = subSubjects.map((subSubject: SubSubject) => 
          subSubject.id === subSubjectId 
            ? { ...subSubject, ...subSubjectData, updated_at: new Date().toISOString() }
            : subSubject
        );
        
        await updateDoc(resourcesRef, {
          sub_subjects: updatedSubSubjects
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error updating sub subject:', error);
      set({ 
        error: error.message || 'Failed to update sub subject',
        loading: false 
      });
      throw error;
    }
  },

  deleteSubSubject: async (subSubjectId) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const subSubjects = data.sub_subjects || [];
        
        const updatedSubSubjects = subSubjects.filter((subSubject: SubSubject) => subSubject.id !== subSubjectId);
        
        await updateDoc(resourcesRef, {
          sub_subjects: updatedSubSubjects
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error deleting sub subject:', error);
      set({ 
        error: error.message || 'Failed to delete sub subject',
        loading: false 
      });
      throw error;
    }
  },

  // Subjects Actions
  fetchSubjects: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        let subjects = convertTimestamps(data.subjects || []);
        
        // Apply filters
        if (filters.cancelled !== undefined) {
          subjects = subjects.filter((subject: Subject) => subject.cancelled === (filters.cancelled ? '1' : '0'));
        }
        
        if (filters.locked !== undefined) {
          subjects = subjects.filter((subject: Subject) => subject.locked === (filters.locked ? '1' : '0'));
        }
        
        // Apply search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          subjects = subjects.filter((subject: Subject) => 
            subject.label.toLowerCase().includes(searchTerm)
          );
        }
        
        set({ subjects, loading: false });
      } else {
        set({ subjects: [], loading: false });
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      set({ 
        error: error.message || 'Failed to fetch subjects',
        loading: false 
      });
    }
  },

  createSubject: async (subjectData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const now = new Date().toISOString();
      
      const newSubject: Subject = {
        id: generateId(),
        ...subjectData,
        cancelled: '0',
        locked: '0',
        version: '0',
        cms_attributes: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      
      const resourcesSnapshot = await getDoc(resourcesRef);
      const currentData = resourcesSnapshot.exists() ? resourcesSnapshot.data() : {};
      
      await updateDoc(resourcesRef, {
        subjects: [...(currentData.subjects || []), newSubject]
      });
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error creating subject:', error);
      set({ 
        error: error.message || 'Failed to create subject',
        loading: false 
      });
      throw error;
    }
  },

  updateSubject: async (subjectId, subjectData) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const subjects = data.subjects || [];
        
        const updatedSubjects = subjects.map((subject: Subject) => 
          subject.id === subjectId 
            ? { ...subject, ...subjectData, updated_at: new Date().toISOString() }
            : subject
        );
        
        await updateDoc(resourcesRef, {
          subjects: updatedSubjects
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error updating subject:', error);
      set({ 
        error: error.message || 'Failed to update subject',
        loading: false 
      });
      throw error;
    }
  },

  deleteSubject: async (subjectId) => {
    try {
      set({ loading: true, error: null });
      
      const resourcesRef = doc(db, 'resources', 'data');
      const resourcesSnapshot = await getDoc(resourcesRef);
      
      if (resourcesSnapshot.exists()) {
        const data = resourcesSnapshot.data();
        const subjects = data.subjects || [];
        
        const updatedSubjects = subjects.filter((subject: Subject) => subject.id !== subjectId);
        
        await updateDoc(resourcesRef, {
          subjects: updatedSubjects
        });
      }
      
      set({ loading: false });
      get().fetchAllResources();
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      set({ 
        error: error.message || 'Failed to delete subject',
        loading: false 
      });
      throw error;
    }
  },

  // Utility Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));