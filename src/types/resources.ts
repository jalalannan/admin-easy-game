// FAQ Resource Type
export interface FAQ {
  id: string;
  answer: string;
  created_at: string;
  question: string;
  title?: string | null;
  updated_at: string;
  user_type: 'student' | 'tutor';
  deleted_at?: string | null;
}

// Language Resource Type
export interface Language {
  id: string;
  language_code: string;
  language_name: string;
  created_at: string;
  updated_at: string;
}

// Social Resource Type
export interface Social {
  id: string;
  image: string;
  link: string;
  title: string;
  created_at: string;
  updated_at: string;
}

// Sub Subject Resource Type
export interface SubSubject {
  id: string;
  label: string;
  subject_id: string;
  created_at: string;
  deleted_at?: string | null;
  updated_at: string;
}

// Subject Resource Type
export interface Subject {
  id: string;
  label: string;
  icon: string;
  cancelled: string;
  locked: string;
  version: string;
  cms_attributes?: any | null;
  created_at: string;
  deleted_at?: string | null;
  updated_at: string;
}

// Resource Collection Type
export interface ResourceCollection {
  faqs: FAQ[];
  languages: Language[];
  socials: Social[];
  sub_subjects: SubSubject[];
  subjects: Subject[];
}

// Create/Update Data Types
export interface CreateFAQData {
  answer: string;
  question: string;
  title?: string;
  user_type: 'student' | 'tutor';
}

export interface UpdateFAQData {
  answer?: string;
  question?: string;
  title?: string;
  user_type?: 'student' | 'tutor';
}

export interface CreateLanguageData {
  language_code: string;
  language_name: string;
}

export interface UpdateLanguageData {
  language_code?: string;
  language_name?: string;
}

export interface CreateSocialData {
  image: string;
  link: string;
  title: string;
}

export interface UpdateSocialData {
  image?: string;
  link?: string;
  title?: string;
}

export interface CreateSubSubjectData {
  label: string;
  subject_id: string;
}

export interface UpdateSubSubjectData {
  label?: string;
  subject_id?: string;
}

export interface CreateSubjectData {
  label: string;
  icon: string;
}

export interface UpdateSubjectData {
  label?: string;
  icon?: string;
  cancelled?: string;
  locked?: string;
  version?: string;
  cms_attributes?: any;
}

// Filter Types
export interface FAQFilters {
  search?: string;
  user_type?: 'student' | 'tutor';
}

export interface LanguageFilters {
  search?: string;
  language_code?: string;
}

export interface SocialFilters {
  search?: string;
}

export interface SubSubjectFilters {
  search?: string;
  subject_id?: string;
}

export interface SubjectFilters {
  search?: string;
  cancelled?: boolean;
  locked?: boolean;
}

// Resource Type Enum
export type ResourceType = 'faqs' | 'languages' | 'socials' | 'sub_subjects' | 'subjects';
