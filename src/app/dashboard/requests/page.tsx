'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRequestManagementStore } from '@/stores/request-management-store';
import { Request, RequestFilters, RequestStatus, RequestType } from '@/types/request';
import { getRequestTypeLabel } from '@/types/request';
import { Tutor } from '@/types/tutor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { RequestFileManagement } from '@/components/ui/request-file-management';
import { ChatDialog } from '@/components/chat-dialog';
import { combineDateAndTime, formatDate as formatDateUtil, formatDateWithTimezone } from '@/lib/date-utils';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Grid3X3,
  Grid2X2,
  Columns3,
  Columns4,
  MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';

function ChatButton({ request }: { request: Request }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ email: string; nickname: string } | null>(null);
  const [tutorInfo, setTutorInfo] = useState<{ email: string; nickname: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Fetch student and tutor info when chat opens
  useEffect(() => {
    if (isChatOpen && !studentInfo && !tutorInfo && !loadingInfo) {
      setLoadingInfo(true);
      
      const fetchInfo = async () => {
        try {
          const promises = [];
          
          if (request.student_id) {
            promises.push(
              fetch(`/api/students/${request.student_id}`)
                .then(res => res.json())
                .then(data => data.success ? data.student : null)
            );
          } else {
            promises.push(Promise.resolve(null));
          }
          
          if (request.tutor_id) {
            promises.push(
              fetch(`/api/tutors/${request.tutor_id}`)
                .then(res => res.json())
                .then(data => data.success ? data.tutor : null)
            );
          } else {
            promises.push(Promise.resolve(null));
          }
          
          const [student, tutor] = await Promise.all(promises);
          
          if (student) {
            setStudentInfo({
              email: student.email || 'N/A',
              nickname: student.nickname || 'N/A'
            });
          }
          
          if (tutor) {
            setTutorInfo({
              email: tutor.email || 'N/A',
              nickname: tutor.nickname || 'N/A'
            });
          }
        } catch (error) {
          console.error('Error fetching user info:', error);
        } finally {
          setLoadingInfo(false);
        }
      };
      
      fetchInfo();
    }
  }, [isChatOpen, request.student_id, request.tutor_id, studentInfo, tutorInfo, loadingInfo]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsChatOpen(true)}
        className="h-8 w-8 p-0"
        title="Open chat"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      
      <ChatDialog
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        requestId={request.id}
        requestTitle={request.label}
        studentInfo={studentInfo || undefined}
        tutorInfo={tutorInfo || undefined}
      />
    </>
  );
}

function RequestCard({ request }: { request: Request }) {
  const formatDate = (value: any) => {
    if (!value) return 'Not set';
    
    try {
      let date: Date;
      if (value.toDate && typeof value.toDate === 'function') {
        date = value.toDate();
      } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
      } else {
        return 'Invalid date';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, value);
      return 'Invalid date';
    }
  };

  const formatDeadline = (request: Request) => {
    try {
      // If we have both date and time, combine them
      if (request.date && request.deadline) {
        const combinedDate = combineDateAndTime(request.date, request.deadline);
        // Use timezone if available, otherwise use local formatting
        if (request.timezone) {
          return formatDateWithTimezone(combinedDate, 'MMM dd, yyyy HH:mm', request.timezone);
        }
        return format(combinedDate, 'MMM dd, yyyy HH:mm');
      }
      
      return 'Not set';
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return 'Invalid date';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{request.label}</CardTitle>
          <div className="flex items-center gap-1">
            <ChatButton request={request} />
            <RequestActions request={request} />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {getRequestTypeLabel(request.assistance_type)}
          </Badge>
          <Badge className={`text-xs ${getRequestStatusColor(request.request_status)}`}>
            {getRequestStatusLabel(request.request_status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subject:</span>
            <span className="font-medium">{request.subject}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sub Subject:</span>
            <span className="font-medium">{request.sub_subject}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Language:</span>
            <span className="font-medium">{request.language}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Country:</span>
            <span className="font-medium">{request.country}</span>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Student Price:</span>
              <div className="font-semibold text-green-600">${request.student_price}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Tutor Price:</span>
              <div className="font-semibold text-blue-600">${request.tutor_price}</div>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deadline:</span>
              <span className="font-medium">{formatDeadline(request)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatDate(request.created_at)}</span>
            </div>
          </div>
        </div>
        
        {request.description && (
          <div className="border-t pt-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Description:</span>
              <p className="mt-1 text-sm line-clamp-2">{request.description}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RequestActions({ request }: { request: Request }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('details');
  
  const {
    changeRequestStatus,
    assignTutor,
    assignStudent,
    setTutorPrice,
    setStudentPrice,
    cancelRequest,
    completeRequest,
    fetchTutorOffers,
    tutorOffers,
    loading
  } = useRequestManagementStore();

  const handleStatusChange = async (status: string, reason?: string) => {
    try {
      await changeRequestStatus(request.id, status, reason);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const handleAssignTutor = async (tutorId: string, tutorPrice: string) => {
    try {
      await assignTutor(request.id, tutorId, tutorPrice);
      setIsOpen(false);
    } catch (error) {
      console.error('Error assigning tutor:', error);
    }
  };

  const handleSetPrices = async (tutorPrice?: string, studentPrice?: string) => {
    try {
      await setTutorPrice(request.id, tutorPrice ? tutorPrice : '');
      await setStudentPrice(request.id, studentPrice ? studentPrice : '');
      setIsOpen(false);
    } catch (error) {
      console.error('Error setting prices:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTutorOffers(request.id);
    }
  }, [isOpen, request.id, fetchTutorOffers]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[100vw] md:w-[80vw] lg:w-[80vw] sm:max-w-[80vw] max-w-none max-h-[98vh] overflow-x-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Request: {request.label}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="offers">Tutor Offers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <RequestDetails request={request} />
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <StatusManagement 
              request={request} 
              onStatusChange={handleStatusChange}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="assignment" className="space-y-4">
            <AssignmentManagement 
              request={request}
              onAssignTutor={handleAssignTutor}
              onSetPrices={handleSetPrices}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="offers" className="space-y-4">
            <TutorOffersManagement 
              request={request}
              offers={tutorOffers}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function RequestDetails({ request }: { request: Request }) {
  const [tutorInfo, setTutorInfo] = useState<{ email: string; nickname: string } | null>(null);
  const [studentInfo, setStudentInfo] = useState<{ email: string; nickname: string } | null>(null);
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const formatDate = (value: any) => {
    if (!value) return 'Not set';
    
    try {
      let date: Date;
      if (value.toDate && typeof value.toDate === 'function') {
        date = value.toDate();
      } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
      } else {
        return 'Invalid date';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error, value);
      return 'Invalid date';
    }
  };

  const formatDeadline = (request: Request) => {
    try {
      // If we have both date and time, combine them
      if (request.date && request.deadline) {
        const combinedDate = combineDateAndTime(request.date, request.deadline);
        // Use timezone if available, otherwise use local formatting
        if (request.timezone) {
          return formatDateWithTimezone(combinedDate, 'MMM dd, yyyy HH:mm', request.timezone);
        }
        return format(combinedDate, 'MMM dd, yyyy HH:mm');
      }
      
      return 'Not set';
    } catch (error) {
      console.error('Error formatting deadline:', error);
      return 'Invalid date';
    }
  };

  const { updateRequestFiles, loading, updateTutorPaid } = useRequestManagementStore();

  // Parse file arrays from JSON strings
  const fileLinks = request.file_links ? 
    (typeof request.file_links === 'string' ? JSON.parse(request.file_links) : request.file_links) : [];
  const fileNames = request.file_names ? 
    (typeof request.file_names === 'string' ? JSON.parse(request.file_names) : request.file_names) : [];

  const handleFileUpdate = async (newFileLinks: string[], newFileNames: string[]) => {
    try {
      await updateRequestFiles(request.id, newFileLinks, newFileNames);
    } catch (error) {
      console.error('Error updating files:', error);
    }
  };

  const handleTutorPaymentToggle = async () => {
    try {
      const newStatus = request.tutor_paid === '1' ? '0' : '1';
      await updateTutorPaid(request.id, newStatus);
    } catch (error) {
      console.error('Error updating tutor payment status:', error);
    }
  };

  // Fetch tutor information
  useEffect(() => {
    if (request.tutor_id) {
      setLoadingTutor(true);
      fetch(`/api/tutors/${request.tutor_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTutorInfo({
              email: data.tutor.email || 'N/A',
              nickname: data.tutor.nickname || 'N/A'
            });
          }
        })
        .catch(error => {
          console.error('Error fetching tutor:', error);
        })
        .finally(() => {
          setLoadingTutor(false);
        });
    }
  }, [request.tutor_id]);

  // Fetch student information
  useEffect(() => {
    if (request.student_id) {
      setLoadingStudent(true);
      fetch(`/api/students/${request.student_id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStudentInfo({
              email: data.student.email || 'N/A',
              nickname: data.student.nickname || 'N/A'
            });
          }
        })
        .catch(error => {
          console.error('Error fetching student:', error);
        })
        .finally(() => {
          setLoadingStudent(false);
        });
    }
  }, [request.student_id]);

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <div className="p-2 bg-gray-50 rounded">{request.label}</div>
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="p-2 bg-gray-50 rounded">{getRequestTypeLabel(request.assistance_type)}</div>
        </div>
        <div className="space-y-2">
          <Label>Subject</Label>
          <div className="p-2 bg-gray-50 rounded">{request.subject}</div>
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <div className="p-2 bg-gray-50 rounded">{request.language}</div>
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <div className="p-2 bg-gray-50 rounded">{request.country}</div>
        </div>

        <div className="space-y-2">
          <Label>Student</Label>
          <div className="p-2 bg-gray-50 rounded">
            {loadingStudent ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Loading...</span>
              </div>
            ) : studentInfo ? (
              <div>
                <div className="font-medium">{studentInfo.nickname}</div>
                <div className="text-sm text-gray-500">{studentInfo.email}</div>
              </div>
            ) : (
              'Not assigned'
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tutor</Label>
          <div className="p-2 bg-gray-50 rounded">
            {loadingTutor ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Loading...</span>
              </div>
            ) : tutorInfo ? (
              <div>
                <div className="font-medium">{tutorInfo.nickname}</div>
                <div className="text-sm text-gray-500">{tutorInfo.email}</div>
              </div>
            ) : (
              'Not assigned'
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Created At</Label>
          <div className="p-2 bg-gray-50 rounded">{formatDate(request.created_at)}</div>
        </div>
        <div className="space-y-2">
          <Label>Deadline</Label>
          <div className="p-2 bg-gray-50 rounded">
            {request.timezone ? (
              <>
                <div>
                  <span className="font-medium">Requester Timezone ({request.timezone}):</span>{' '}
                  {formatDeadline(request)}
                </div>
                <div>
                  <span className="font-medium">Your Local Time:</span>{' '}
                  {(() => {
                    try {
                      if (request.date && request.deadline) {
                        const combined = combineDateAndTime(request.date, request.deadline);
                        return format(combined, 'MMM dd, yyyy HH:mm');
                      }
                      return 'Not set';
                    } catch {
                      return 'Invalid date';
                    }
                  })()}
                </div>
              </>
            ) : (
              <>{formatDeadline(request)}</>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Updated At</Label>
          <div className="p-2 bg-gray-50 rounded">{formatDate(request.updated_at)}</div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Payment Status</Label>
          <Button
            onClick={handleTutorPaymentToggle}
            disabled={loading}
            variant={request.tutor_paid === '1' ? 'destructive' : 'default'}
            size="sm"
            className="text-xs"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : request.tutor_paid === '1' ? (
              'Mark as Unpaid'
            ) : (
              'Mark as Paid'
            )}
          </Button>
        </div>
        <div className={`p-4 rounded-lg border ${
          request.tutor_paid === '1' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              request.tutor_paid === '1' 
                ? 'bg-green-500' 
                : 'bg-orange-500'
            }`}></div>
            <span className={`font-medium ${
              request.tutor_paid === '1' 
                ? 'text-green-900' 
                : 'text-orange-900'
            }`}>
              {request.tutor_paid === '1'  ? '💰 Tutor Payment Received' : '⏳ Payment Pending'}
            </span>
          </div>
          <div className={`text-sm mt-1 ${
            request.tutor_paid === '1' 
              ? 'text-green-700' 
              : 'text-orange-700'
          }`}>
            {request.tutor_paid === '1' 
              ? 'The tutor has completed payment for this request' 
              : 'Waiting for tutor payment to be processed'}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <div className="p-2 bg-gray-50 rounded min-h-[100px]">
          {request.description || 'No description'}
        </div>
      </div>

      {/* File Management */}
      <RequestFileManagement
        fileLinks={fileLinks}
        fileNames={fileNames}
        onUpdate={handleFileUpdate}
        label="Request Files"
        disabled={loading}
      />
    </div>
  );
}

function StatusManagement({ 
  request, 
  onStatusChange, 
  loading 
}: { 
  request: Request; 
  onStatusChange: (status: string, reason?: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  const statusOptions = [
    { value: 'NEW', label: 'New' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
    { value: 'ONGOING', label: 'Ongoing' },
    { value: 'TUTOR_COMPLETED', label: 'Tutor Completed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Current Status</Label>
        <Badge className={getRequestStatusColor(request.request_status)}>
          {getRequestStatusLabel(request.request_status)}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <Label>Change Status</Label>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((status) => (
            <Button
              key={status.value}
              variant={request.request_status === status.value ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(status.value)}
              disabled={loading}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Reason (for cancellation)</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for status change..."
        />
      </div>
    </div>
  );
}

function TutorSearchComponent({ 
  onSelectTutor, 
  selectedTutorId,
  currentTutorId 
}: { 
  onSelectTutor: (tutor: Tutor) => void;
  selectedTutorId?: string;
  currentTutorId?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Tutor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentTutor, setCurrentTutor] = useState<Tutor | null>(null);
  const [loadingCurrentTutor, setLoadingCurrentTutor] = useState(false);

  // Fetch currently assigned tutor
  useEffect(() => {
    const fetchCurrentTutor = async () => {
      if (!currentTutorId) {
        setCurrentTutor(null);
        return;
      }

      setLoadingCurrentTutor(true);
      try {
        const response = await fetch(`/api/tutors/${currentTutorId}`);
        const data = await response.json();
        
        if (data.success) {
          setCurrentTutor(data.tutor);
        } else {
          setCurrentTutor(null);
        }
      } catch (error) {
        console.error('Error fetching current tutor:', error);
        setCurrentTutor(null);
      } finally {
        setLoadingCurrentTutor(false);
      }
    };

    fetchCurrentTutor();
  }, [currentTutorId]);

  const searchTutors = useCallback(async (email: string) => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/tutors/search?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.tutors);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error searching tutors:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTutors(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchTutors]);

  const handleTutorSelect = (tutor: Tutor) => {
    onSelectTutor(tutor);
    setSearchTerm(tutor.email);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="space-y-2">
        <Label>Search Tutor by Email</Label>
        <div className="relative">
          <Input
            placeholder="Enter tutor email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>

      {/* Currently Assigned Tutor */}
      {currentTutor && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">Currently Assigned:</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  Assigned
                </Badge>
              </div>
              <div className="font-medium mt-1">{currentTutor.full_name}</div>
              <div className="text-sm text-gray-600">{currentTutor.email}</div>
              {currentTutor.country && (
                <div className="text-xs text-gray-500">{currentTutor.country}</div>
              )}
            </div>
            <Badge variant={currentTutor.verified === '2' ? 'default' : 'secondary'}>
              {currentTutor.verified === '2' ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>
      )}

      {loadingCurrentTutor && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center gap-2">
            <LoadingSpinner />
            <span className="text-sm text-gray-600">Loading current tutor...</span>
          </div>
        </div>
      )}

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((tutor) => (
            <div
              key={tutor.id}
              className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                tutor.id === currentTutorId ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleTutorSelect(tutor)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{tutor.full_name}</div>
                    {tutor.id === currentTutorId && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{tutor.email}</div>
                  {tutor.country && (
                    <div className="text-xs text-gray-500">{tutor.country}</div>
                  )}
                </div>
                <Badge variant={tutor.verified === '2' ? 'default' : 'secondary'}>
                  {tutor.verified === '2' ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchResults.length === 0 && searchTerm.length >= 3 && !isSearching && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <div className="text-sm text-gray-500">No tutors found with that email</div>
        </div>
      )}
    </div>
  );
}

function AssignmentManagement({ 
  request, 
  onAssignTutor, 
  onSetPrices, 
  loading 
}: { 
  request: Request; 
  onAssignTutor: (tutorId: string, tutorPrice: string) => void;
  onSetPrices: (tutorPrice?: string, studentPrice?: string) => void;
  loading: boolean;
}) {
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [tutorPrice, setTutorPrice] = useState(request.tutor_price || '');
  const [studentPrice, setStudentPrice] = useState(request.student_price || '');

  const handleTutorSelect = (tutor: Tutor) => {
    setSelectedTutor(tutor);
  };

  const handleAssignTutor = () => {
    if (selectedTutor && tutorPrice) {
      onAssignTutor(selectedTutor.id, tutorPrice);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <TutorSearchComponent 
          onSelectTutor={handleTutorSelect}
          selectedTutorId={request.tutor_id}
          currentTutorId={request.tutor_id}
        />
        
        {selectedTutor && (
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{selectedTutor.full_name}</div>
                <div className="text-sm text-gray-600">{selectedTutor.email}</div>
                {selectedTutor.country && (
                  <div className="text-xs text-gray-500">{selectedTutor.country}</div>
                )}
              </div>
              <Badge variant={selectedTutor.verified === '2' ? 'default' : 'secondary'}>
                {selectedTutor.verified === '2' ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="Tutor Price"
            value={tutorPrice}
            onChange={(e) => setTutorPrice(e.target.value)}
            type="number"
          />
          <Button
            onClick={handleAssignTutor}
            disabled={loading || !selectedTutor || !tutorPrice}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Tutor
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Price Management</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Student Price"
            value={studentPrice}
            onChange={(e) => setStudentPrice(e.target.value)}
            type="number"
          />
          <Button
            onClick={() => onSetPrices(tutorPrice, studentPrice)}
            disabled={loading}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Update Prices
          </Button>
        </div>
      </div>
    </div>
  );
}

function TutorOffersManagement({ 
  request, 
  offers, 
  loading 
}: { 
  request: Request; 
  offers: any[];
  loading: boolean;
}) {
  const { acceptTutorOffer, rejectTutorOffer } = useRequestManagementStore();
  const [tutorDetails, setTutorDetails] = useState<{[key: string]: {email: string; nickname: string}}>({});
  const [loadingTutors, setLoadingTutors] = useState<{[key: string]: boolean}>({});

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await acceptTutorOffer(offerId, request.id);
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      await rejectTutorOffer(offerId, request.id);
    } catch (error) {
      console.error('Error rejecting offer:', error);
    }
  };

  // Fetch tutor details for each offer
  useEffect(() => {
    const fetchTutorDetails = async () => {
      const tutorIds = offers.map(offer => offer.tutor_id).filter(Boolean);
      const uniqueTutorIds = [...new Set(tutorIds)];
      
      for (const tutorId of uniqueTutorIds) {
        if (!tutorDetails[tutorId] && !loadingTutors[tutorId]) {
          setLoadingTutors(prev => ({ ...prev, [tutorId]: true }));
          
          try {
            const response = await fetch(`/api/tutors/${tutorId}`);
            const data = await response.json();
            
            if (data.success) {
              setTutorDetails(prev => ({
                ...prev,
                [tutorId]: {
                  email: data.tutor.email || 'N/A',
                  nickname: data.tutor.nickname || 'N/A'
                }
              }));
            }
          } catch (error) {
            console.error(`Error fetching tutor ${tutorId}:`, error);
          } finally {
            setLoadingTutors(prev => ({ ...prev, [tutorId]: false }));
          }
        }
      }
    };

    if (offers.length > 0) {
      fetchTutorDetails();
    }
  }, [offers, tutorDetails, loadingTutors]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tutor Offers</h3>
        <Badge variant="outline">{offers.length} offers</Badge>
      </div>
      
      {offers.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tutor offers available for this request.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {offers.map((offer) => {
            const tutorInfo = tutorDetails[offer.tutor_id];
            const isLoadingTutor = loadingTutors[offer.tutor_id];
            
            return (
              <Card key={offer.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      {isLoadingTutor ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span>Loading tutor info...</span>
                        </div>
                      ) : tutorInfo ? (
                        <div>
                          <div className="font-medium">{tutorInfo.nickname}</div>
                          <div className="text-sm text-gray-600">{tutorInfo.email}</div>
                        </div>
                      ) : (
                        <div className="font-medium">Tutor ID: {offer.tutor_id}</div>
                      )}
                      <div className="text-sm text-gray-600 mt-1">Price: ${offer.price}</div>
                      <Badge className={getRequestStatusColor(offer.status)}>
                        {offer.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptOffer(offer.id)}
                        disabled={loading || offer.status === 'ACCEPTED'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectOffer(offer.id)}
                        disabled={loading || offer.status === 'rejected'}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getRequestStatusLabel(status: string): string {
  switch (status) {
    case 'NEW':
      return 'Waiting for Bids';
    case 'PENDING':
      return 'Waiting for Bids';
    case 'PENDING_PAYMENT':
      return 'Pending Payment';
    case 'ONGOING':
      return 'Ongoing';
    case 'TUTOR_COMPLETED':
      return 'Tutor Completed';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

function getRequestStatusColor(status: string): string {
  switch (status) {
    case 'NEW':
    case 'PENDING':
      return 'bg-gray-100 text-gray-800';
    case 'PENDING_PAYMENT':
      return 'bg-blue-100 text-blue-800';
    case 'ONGOING':
      return 'bg-purple-100 text-purple-800';
    case 'TUTOR_COMPLETED':
      return 'bg-cyan-100 text-cyan-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function RequestsPage() {
  const {
    requests,
    loading,
    error,
    fetchRequests,
    createRequest
  } = useRequestManagementStore();

  const [filters, setFilters] = useState<RequestFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [columnsCount, setColumnsCount] = useState(3);

  // Create dynamic request type options from RequestType enum
  const requestTypeOptions = Object.values(RequestType).map(type => ({
    value: type,
    label: getRequestTypeLabel(type)
  }));

  useEffect(() => {
    fetchRequests(filters);
  }, [fetchRequests, filters]);

  const handleFilterChange = (key: keyof RequestFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleCreateRequest = async (requestData: any) => {
    try {
      await createRequest(requestData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const getGridClass = () => {
    switch (columnsCount) {
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Request Management</h1>
        <div className="flex items-center gap-2">
          {/* Column Count Selector */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={columnsCount === 2 ? "default" : "ghost"}
              size="sm"
              onClick={() => setColumnsCount(2)}
              className="h-8 w-8 p-0"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={columnsCount === 3 ? "default" : "ghost"}
              size="sm"
              onClick={() => setColumnsCount(3)}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={columnsCount === 4 ? "default" : "ghost"}
              size="sm"
              onClick={() => setColumnsCount(4)}
              className="h-8 w-8 p-0"
            >
              <Columns4 className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Request
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search requests..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={filters.assistance_type || 'all'}
                onValueChange={(value) => handleFilterChange('assistance_type', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {requestTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.request_status || 'all'}
                onValueChange={(value) => handleFilterChange('request_status', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PENDING_PAYMENT">Pending Payment</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="TUTOR_COMPLETED">Tutor Completed</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                placeholder="Country"
                value={filters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Requests ({requests.length})</h2>
        </div>
        
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No requests found</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid ${getGridClass()} gap-4`}>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

