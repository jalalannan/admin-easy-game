"use client";

import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-spinner";
import { StatusBadge, NotificationBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  CheckCircle, 
  AlertTriangle
} from "lucide-react";
import { Student, CreateStudentData } from "@/types/student";
import { useResourcesManagementStore } from "@/stores/resources-management-store";

// Lazy load heavy form sections
const BasicInformationSection = lazy(() => import('./form-sections/basic-information-section'));
const LocationInformationSection = lazy(() => import('./form-sections/location-information-section'));
const AcademicInformationSection = lazy(() => import('./form-sections/academic-information-section'));
const StudentAccountSettingsSection = lazy(() => import('./form-sections/student-account-settings-section'));

interface EnhancedStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  mode: 'create' | 'edit';
  onSave: (studentData: any) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export interface StudentFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
  nickname?: string;
  phone_number?: string;
  country_code?: string;
  student_level?: string;
  gender?: string;
  nationality?: string;
  country?: string;
  city?: string;
  majorId?: number | null;
  otherMajor?: string | null;
  languages?: number[]; // Array of language IDs
  platform?: string;
  // Enhanced fields for editing
  verified: string;
  is_banned: string;
  send_notifications: string;
  locked: string;
  cancelled: string;
  // Note: majorId is a number, otherMajor is a string
}

// Memoized form section wrapper
const FormSectionWrapper = React.memo(({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <Suspense fallback={fallback || <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />}>
    {children}
  </Suspense>
));

FormSectionWrapper.displayName = 'FormSectionWrapper';

export const EnhancedStudentDialog = React.memo(function EnhancedStudentDialog({
  open,
  onOpenChange,
  student,
  mode,
  onSave,
  loading = false,
  error = null
}: EnhancedStudentDialogProps) {
  const { subjects } = useResourcesManagementStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    nickname: '',
    phone_number: '',
    country_code: '',
    student_level: '',
    gender: '',
    nationality: '',
    country: '',
    city: '',
    majorId: null,
    otherMajor: null,
    languages: [],
    platform: 'web',
    // Enhanced fields
    verified: '0',
    is_banned: '0',
    send_notifications: '1',
    locked: '0',
    cancelled: '0'
  });

  // Helper to check if selected major is "other" or "others" (case-insensitive)
  const isMajorOther = useMemo(() => {
    if (!formData.majorId) return false;
    const selectedSubject = subjects.find((s) => parseInt(s.id) === formData.majorId);
    if (!selectedSubject) return false;
    const normalizedLabel = selectedSubject.label.toLowerCase().trim();
    return normalizedLabel === 'other' || normalizedLabel === 'others';
  }, [subjects, formData.majorId]);

  // Password matching validation
  const passwordsMatch = useMemo(() => {
    // In edit mode, if both fields are empty, consider it valid (no password change)
    if (mode === 'edit' && !formData.password && !formData.confirmPassword) return true;
    return formData.password === formData.confirmPassword;
  }, [formData.password, formData.confirmPassword, mode]);

  const passwordError = useMemo(() => {
    // In edit mode, if both fields are empty, no error (no password change)
    if (mode === 'edit' && !formData.password && !formData.confirmPassword) return '';
    
    // Only validate if user has started entering password
    if (!formData.password && !formData.confirmPassword) return '';
    
    if (!passwordsMatch) return 'Passwords do not match';
    if (formData.password && formData.password.length < 6) return 'Password must be at least 6 characters';
    return '';
  }, [formData.password, formData.confirmPassword, passwordsMatch, mode]);

  // Memoized form validation
  const isFormValid = useMemo(() => {
    // Check for validation errors
    if (emailError || phoneError) return false;
    
    // Check basic required fields
    if (mode === 'create') {
      const basicValid = formData.email && 
             formData.password && 
             formData.confirmPassword &&
             formData.full_name && 
             passwordsMatch &&
             formData.password.length >= 6;
      
      // If major label is "other" or "others", otherMajor must be filled
      const majorValid = isMajorOther
        ? formData.otherMajor && formData.otherMajor.trim().length > 0
        : true;
      
      return basicValid && majorValid;
    }
    
    // For edit mode - password is optional
    // If user enters password, both fields must be filled and match
    if (formData.password || formData.confirmPassword) {
      // If one field is filled, both must be filled
      if (!formData.password || !formData.confirmPassword) {
        return false;
      }
      
      const passwordValid = formData.email && 
             formData.full_name && 
             passwordsMatch &&
             formData.password.length >= 6;
      
      const majorValid = isMajorOther
        ? formData.otherMajor && formData.otherMajor.trim().length > 0
        : true;
      
      return passwordValid && majorValid;
    }
    
    // Edit mode without password change - just basic fields
    const basicValid = formData.email && formData.full_name;
    const majorValid = isMajorOther
      ? formData.otherMajor && formData.otherMajor.trim().length > 0
      : true;
    
    return basicValid && majorValid;
  }, [formData, mode, passwordsMatch, emailError, phoneError, isMajorOther]);

  // Memoized status badges
  const statusBadges = useMemo(() => {
    const badges = [];
    
    if (formData.verified === '1') {
      badges.push(<StatusBadge key="verified" status="verified" />);
    }
    
    if (formData.is_banned === '1') {
      badges.push(<StatusBadge key="banned" status="banned" />);
    }
    
    if (formData.cancelled === '1') {
      badges.push(<Badge key="cancelled" variant="destructive">Cancelled</Badge>);
    }
    
    if (formData.locked === '1') {
      badges.push(<Badge key="locked" variant="outline">Locked</Badge>);
    }
    
    badges.push(
      <NotificationBadge 
        key="notifications" 
        enabled={formData.send_notifications === '1'} 
      />
    );
    
    return badges;
  }, [formData.verified, formData.is_banned, formData.cancelled, formData.locked, formData.send_notifications]);

  // Initialize form data when student changes
  React.useEffect(() => {
    if (student && mode === 'edit') {
      // Extract language IDs from student.languages array
      const languageIds = Array.isArray(student.languages) 
        ? student.languages.map((lang: any) => typeof lang === 'number' ? lang : parseInt(lang.id || lang))
        : [];
      
      setFormData({
        email: student.email,
        password: '',
        confirmPassword: '',
        full_name: student.full_name || '',
        nickname: student.nickname || '',
        phone_number: student.phone_number || '',
        country_code: student.country_code || '',
        student_level: student.student_level || '',
        gender: student.gender || '',
        nationality: student.nationality || '',
        country: student.country || '',
        city: student.city || '',
        majorId: student.majorId || null,
        otherMajor: student.otherMajor || null,
        languages: languageIds,
        platform: student.platform || 'web',
        verified: student.verified || '0',
        is_banned: student.is_banned || '0',
        send_notifications: student.send_notifications || '1',
        locked: student.locked || '0',
        cancelled: student.cancelled || '0'
      });
    } else if (mode === 'create') {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        full_name: '',
        nickname: '',
        phone_number: '',
        country_code: '',
        student_level: '',
        gender: '',
        nationality: '',
        country: '',
        city: '',
        majorId: null,
        otherMajor: null,
        languages: [],
        platform: 'web',
        verified: '0',
        is_banned: '0',
        send_notifications: '1',
        locked: '0',
        cancelled: '0'
      });
    }
  }, [student, mode, open]);

  const handleFieldChange = useCallback((field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user starts typing
    if (field === 'email') {
      setEmailError('');
    }
    if (field === 'phone_number') {
      setPhoneError('');
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!isFormValid) return;
    
    try {
      // Check if validation errors occurred
      // Use a timeout to ensure state updates are processed
      setTimeout(async () => {
        if (emailError || phoneError) {
          console.error('Validation errors exist, cannot save');
          return;
        }

        // Remove confirmPassword and ensure data consistency
        const { confirmPassword, ...dataWithoutConfirm } = formData;
        const cleanedFormData = {
          ...dataWithoutConfirm,
          majorId: formData.majorId || null,
          otherMajor: formData.majorId ? formData.otherMajor : null,
          password: mode === 'edit' && !formData.password ? undefined : formData.password,
        };
        
        await onSave(cleanedFormData);
        onOpenChange(false);
      }, 100);
    } catch (err) {
      console.error('Failed to save student:', err);
    }
  }, [formData, isFormValid, onSave, onOpenChange, emailError, phoneError]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] md:w-[80vw] lg:w-[80vw] sm:max-w-[80vw] max-w-none max-h-[98vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {mode === 'create' ? 'Create New Student' : 'Edit Student'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new student account with personal and academic information.' 
              : 'Update student information, academic details, and account settings.'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mx-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6">
            {/* Account Status - Only render when editing */}
            {mode === 'edit' && student && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {statusBadges}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lazy loaded form sections */}
            {open && (
              <>
                <FormSectionWrapper>
                  <BasicInformationSection
                    formData={formData}
                    mode={mode}
                    showPassword={showPassword}
                    showConfirmPassword={showConfirmPassword}
                    passwordError={passwordError}
                    onFieldChange={handleFieldChange}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </FormSectionWrapper>

                <FormSectionWrapper>
                  <LocationInformationSection
                    formData={formData}
                    onFieldChange={handleFieldChange}
                  />
                </FormSectionWrapper>

                <FormSectionWrapper>
                  <AcademicInformationSection
                    formData={formData}
                    onFieldChange={handleFieldChange}
                  />
                </FormSectionWrapper>

                <FormSectionWrapper>
                  <StudentAccountSettingsSection
                    formData={formData}
                    onFieldChange={handleFieldChange}
                  />
                </FormSectionWrapper>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 flex justify-end space-x-2 p-6 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <LoadingButton
            loading={loading}
            onClick={handleSave}
            disabled={!isFormValid}
            className="min-w-[120px]"
          >
            {mode === 'create' ? 'Create Student' : 'Update Student'}
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
});
