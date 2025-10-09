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
import { Student, CreateStudentData, UpdateStudentData, StudentFilters } from '@/types/student';
import { fetchWithProgress } from '@/lib/api-progress';

interface StudentManagementStore {
  // State
  students: Student[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  lastDoc: any;
  hasMore: boolean;

  // Actions
  fetchStudents: (filters?: StudentFilters, loadMore?: boolean) => Promise<void>;
  createStudent: (studentData: CreateStudentData) => Promise<void>;
  updateStudent: (studentId: string, studentData: UpdateStudentData) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  getStudentById: (studentId: string) => Promise<Student | null>;
  importStudents: (students: Student[]) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetPagination: () => void;
}

// Helper function to determine sign-in method based on social IDs
const determineSignInMethod = (student: any): 'manual' | 'facebook' | 'google' | 'apple' => {
  if (student.facebook_id) return 'facebook';
  if (student.google_id) return 'google';
  if (student.apple_id) return 'apple';
  return 'manual';
};

// Helper function to convert Firestore document to Student
const convertFirestoreDocToStudent = (doc: any): Student => {
  const data = doc.data();
  const student = {
    id: doc.id,
    ...data,
    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
    updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
    deleted_at: data.deleted_at?.toDate?.()?.toISOString() || data.deleted_at,
  } as Student;
  
  // Determine and add sign-in method
  student.sign_in_method = determineSignInMethod(student);
  
  return student;
};

// Helper function to get request count for a student
const getStudentRequestCount = async (studentId: string): Promise<number> => {
  try {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, where('student_id', '==', studentId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error(`Error getting request count for student ${studentId}:`, error);
    return 0;
  }
};

// Helper function to get request counts for multiple students
const getStudentsRequestCounts = async (students: Student[]): Promise<Student[]> => {
  try {
    const requestCountPromises = students.map(async (student) => {
      const requestCount = await getStudentRequestCount(student.id);
      return { ...student, request_count: requestCount };
    });
    
    return await Promise.all(requestCountPromises);
  } catch (error) {
    console.error('Error getting request counts for students:', error);
    return students; // Return students without request counts if there's an error
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

export const useStudentManagementStore = create<StudentManagementStore>((set, get) => ({
  // Initial state
  students: [],
  loading: false,
  error: null,
  totalCount: 0,
  lastDoc: null,
  hasMore: true,

  // Actions
  fetchStudents: async (filters = {}, loadMore = false) => {
    try {
      set({ loading: true, error: null });
      
      const studentsRef = collection(db, 'students');
      let students: Student[] = [];
      
      // Apply search filter with comprehensive field search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        
        // For better performance, we'll fetch a larger set and filter client-side
        // This reduces the number of queries while still providing comprehensive search
        let q = query(studentsRef, orderBy('created_at', 'desc'), limit(100));
        
        // Apply other filters first to reduce the dataset
        if (filters.verified !== undefined) {
          q = query(q, where('verified', '==', filters.verified ? '1' : '0'));
        }
        
        if (filters.is_banned !== undefined) {
          q = query(q, where('is_banned', '==', filters.is_banned ? '1' : '0'));
        }
        
        if (filters.student_level) {
          q = query(q, where('student_level', '==', filters.student_level));
        }
        
        if (filters.majorId) {
          q = query(q, where('majorId', '==', filters.majorId));
        }
        
        if (filters.country) {
          q = query(q, where('country', '==', filters.country));
        }
        
        if (filters.gender) {
          q = query(q, where('gender', '==', filters.gender));
        }
        
        const studentsSnapshot = await getDocs(q);
        const allStudents = studentsSnapshot.docs.map(convertFirestoreDocToStudent);
        
        // Filter students by search term across all relevant fields
        students = allStudents.filter(student => {
          const searchableFields = [
            student.full_name?.toLowerCase(),
            student.nickname?.toLowerCase(),
            student.email?.toLowerCase(),
            student.phone_number?.toLowerCase(),
            student.student_level?.toLowerCase(),
            student.majorId?.toString(),
            student.otherMajor?.toLowerCase(),
            student.country?.toLowerCase(),
            student.city?.toLowerCase(),
            student.nationality?.toLowerCase(),
            student.gender?.toLowerCase(),
            student.request_count?.toString(), // Allow searching by request count
            student.sign_in_method?.toLowerCase(), // Allow searching by sign-in method
            student.spend_amount?.toString() // Allow searching by spend amount
          ].filter(Boolean); // Remove undefined/null values
          
          return searchableFields.some(field => field?.includes(searchTerm));
        });
        
        // Sort by created_at descending
        students = students.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Get request counts for filtered students
        students = await getStudentsRequestCounts(students);
        
        // Apply has_requests filter if specified
        if (filters.has_requests !== undefined) {
          students = students.filter(student => 
            filters.has_requests ? (student.request_count || 0) > 0 : (student.request_count || 0) === 0
          );
        }
        
        // Apply sign_in_method filter if specified
        if (filters.sign_in_method) {
          students = students.filter(student => 
            student.sign_in_method === filters.sign_in_method
          );
        }
        
        // Apply spend amount filters if specified
        if (filters.min_spend !== undefined) {
          students = students.filter(student => 
            (student.spend_amount || 0) >= filters.min_spend!
          );
        }
        
        if (filters.max_spend !== undefined) {
          students = students.filter(student => 
            (student.spend_amount || 0) <= filters.max_spend!
          );
        }
        
        // Apply pagination to filtered results
        const startIndex = loadMore ? get().students.length : 0;
        const endIndex = startIndex + 20;
        students = students.slice(startIndex, endIndex);
        
      } else {
        // No search term - use regular query with other filters
        let q = query(studentsRef, orderBy('created_at', 'desc'), limit(20));
        
        if (filters.verified !== undefined) {
          q = query(q, where('verified', '==', filters.verified ? '1' : '0'));
        }
        
        if (filters.is_banned !== undefined) {
          q = query(q, where('is_banned', '==', filters.is_banned ? '1' : '0'));
        }
        
        if (filters.student_level) {
          q = query(q, where('student_level', '==', filters.student_level));
        }
        
        if (filters.majorId) {
          q = query(q, where('majorId', '==', filters.majorId));
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
        
        const studentsSnapshot = await getDocs(q);
        students = studentsSnapshot.docs.map(convertFirestoreDocToStudent);
        
        // Get request counts for students
        students = await getStudentsRequestCounts(students);
        
        // Apply has_requests filter if specified
        if (filters.has_requests !== undefined) {
          students = students.filter(student => 
            filters.has_requests ? (student.request_count || 0) > 0 : (student.request_count || 0) === 0
          );
        }
        
        // Apply sign_in_method filter if specified
        if (filters.sign_in_method) {
          students = students.filter(student => 
            student.sign_in_method === filters.sign_in_method
          );
        }
        
        // Apply spend amount filters if specified
        if (filters.min_spend !== undefined) {
          students = students.filter(student => 
            (student.spend_amount || 0) >= filters.min_spend!
          );
        }
        
        if (filters.max_spend !== undefined) {
          students = students.filter(student => 
            (student.spend_amount || 0) <= filters.max_spend!
          );
        }
        
        set(state => ({
          students: loadMore ? [...state.students, ...students] : students,
          lastDoc: studentsSnapshot.docs[studentsSnapshot.docs.length - 1] || null,
          hasMore: studentsSnapshot.docs.length === 20,
          totalCount: loadMore ? state.totalCount : studentsSnapshot.size,
          loading: false,
        }));
      }
      
      // For search results, update state differently
      if (filters.search) {
        set(state => ({
          students: loadMore ? [...state.students, ...students] : students,
          lastDoc: null, // Reset pagination for search results
          hasMore: students.length === 20, // Check if we got a full page
          totalCount: students.length,
          loading: false,
        }));
      }
      
    } catch (error: any) {
      console.error('Error fetching students:', error);
      set({ 
        error: error.message || 'Failed to fetch students',
        loading: false 
      });
    }
  },

  createStudent: async (studentData) => {
    try {
      set({ loading: true, error: null });
      
      // Call API route to create student with bcrypt password hashing
      const response = await fetchWithProgress('/api/students/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create student');
      }

      console.log('✅ Student created successfully:', result.studentId);
      
      set({ loading: false });
      get().fetchStudents(); // Refresh students list
    } catch (error: any) {
      console.error('Error creating student:', error);
      set({ 
        error: error.message || 'Failed to create student',
        loading: false 
      });
      throw error;
    }
  },

  updateStudent: async (studentId, studentData) => {
    try {
      console.log('Updating student:', studentId);
      set({ loading: true, error: null });
      console.log('Student data:', studentData);
      
      // Call API route to update student with bcrypt password hashing
      const response = await fetchWithProgress('/api/students/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          ...studentData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update student');
      }

      console.log('✅ Student updated successfully:', studentId);
      
      set({ loading: false });
      get().fetchStudents(); // Refresh students list
    } catch (error: any) {
      console.error('Error updating student:', error);
      set({ 
        error: error.message || 'Failed to update student',
        loading: false 
      });
      throw error;
    }
  },

  deleteStudent: async (studentId) => {
    try {
      set({ loading: true, error: null });
      
      // Soft delete by setting deleted_at timestamp
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        deleted_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      set({ loading: false });
      get().fetchStudents(); // Refresh students list
    } catch (error: any) {
      console.error('Error deleting student:', error);
      set({ 
        error: error.message || 'Failed to delete student',
        loading: false 
      });
      throw error;
    }
  },

  getStudentById: async (studentId) => {
    try {
      const studentSnapshot = await getDocs(query(collection(db, 'students'), where('__name__', '==', studentId)));
      
      if (studentSnapshot.empty) {
        return null;
      }
      
      return convertFirestoreDocToStudent(studentSnapshot.docs[0]);
    } catch (error: any) {
      console.error('Error fetching student by ID:', error);
      return null;
    }
  },

  importStudents: async (students) => {
    try {
      set({ loading: true, error: null });
      
      const batch = students.map(async (student) => {
        const studentRef = doc(collection(db, 'students'));
        const cleanedStudent = cleanData({
          ...student,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        await setDoc(studentRef, cleanedStudent);
      });
      
      await Promise.all(batch);
      
      set({ loading: false });
      get().fetchStudents(); // Refresh students list
    } catch (error: any) {
      console.error('Error importing students:', error);
      set({ 
        error: error.message || 'Failed to import students',
        loading: false 
      });
      throw error;
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetPagination: () => set({ lastDoc: null, hasMore: true }),
}));
