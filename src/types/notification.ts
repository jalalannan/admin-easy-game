export type UserType = 'STUDENT' | 'TUTOR';
export type RequestType = 'ALL' | 'EXAM' | 'SOS' | 'ONLINE' | 'HOMEWORK' | 'PROJECT' | 'THESIS';
export type NotificationType = 
  | 'STUDENTCREATEREQUEST'
  | 'TUTORBIDREQUEST'
  | 'STUDENTREJECTBID'
  | 'TUTORUPDATEBID'
  | 'STUDENTACCEPTBID'
  | 'STUDENTPAYREQUEST'
  | 'TUTORCOMPLETEREQUEST'
  | 'STUDENTREJECTCOMPLETE'
  | 'STUDENTACCEPTCOMPLETE'
  | 'STUDENTCANCELREQUEST';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  userType: UserType;
  requestType: RequestType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationRequest {
  title: string;
  body: string;
  type: NotificationType;
  userType: UserType;
  requestType: RequestType;
}

export interface UpdateNotificationRequest {
  title?: string;
  body?: string;
  type?: NotificationType;
  userType?: UserType;
  requestType?: RequestType;
}

export interface NotificationFilters {
  userType?: UserType;
  type?: NotificationType;
  requestType?: RequestType;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

// Notification type mappings for display
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  STUDENTCREATEREQUEST: 'Student Create Request',
  TUTORBIDREQUEST: 'Tutor Bid Request',
  STUDENTREJECTBID: 'Student Reject Bid',
  TUTORUPDATEBID: 'Tutor Update Bid',
  STUDENTACCEPTBID: 'Student Accept Bid',
  STUDENTPAYREQUEST: 'Student Pay Request',
  TUTORCOMPLETEREQUEST: 'Tutor Complete Request',
  STUDENTREJECTCOMPLETE: 'Student Reject Complete',
  STUDENTACCEPTCOMPLETE: 'Student Accept Complete',
  STUDENTCANCELREQUEST: 'Student Cancel Request',
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  STUDENT: 'Student',
  TUTOR: 'Tutor',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  ALL: 'All',
  HOMEWORK: 'Homework',
  EXAM: 'Exam',
  PROJECT: 'Project',
  THESIS: 'Thesis',
  ONLINE: 'Online Session',
  SOS: 'Rapid Q&A',
};
