"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingOverlay, LoadingButton } from "@/components/ui/loading-spinner";
import { StatusBadge, NotificationBadge } from "@/components/ui/status-badge";
import { EnhancedTutorDialog } from "@/components/enhanced-tutor-dialog";
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Upload,
  MessageSquare,
  User,
  Apple,
  UserCircle,
  Globe,
  MessageCircle,
  FileText,
  CheckCircle,
  XCircle,
  Bell,
  BellOff,
  Ban
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTutorManagementStore } from "@/stores/tutor-management-store";
import { useFirebaseAuthStore } from "@/stores/firebase-auth-store";
import { Tutor, TutorFilters } from "@/types/tutor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getImageUrl } from "@/lib/file-upload";

export default function TutorsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TutorFilters>({});
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    countries: new Set<string>(),
    nationalities: new Set<string>()
  });

  const { 
    tutors, 
    loading, 
    error, 
    totalCount,
    hasMore,
    fetchTutors, 
    createTutor, 
    updateTutor, 
    deleteTutor,
    importTutors,
    resetPagination,
    toggleVerification,
    toggleNotifications,
    toggleCancelled
  } = useTutorManagementStore();

  const { hasPermission } = useFirebaseAuthStore();

  useEffect(() => {
    fetchTutors();
  }, []);

  // Extract unique filter options from tutors data
  useEffect(() => {
    if (tutors.length > 0) {
      const newFilterOptions = {
        countries: new Set<string>(),
        nationalities: new Set<string>()
      };

      tutors.forEach(tutor => {
        if (tutor.country) {
          newFilterOptions.countries.add(tutor.country);
        }
        if (tutor.nationality) {
          newFilterOptions.nationalities.add(tutor.nationality);
        }
      });

      setFilterOptions(newFilterOptions);
    }
  }, [tutors]);

  useEffect(() => {
    const searchFilters: TutorFilters = {
      search: searchTerm || undefined,
      ...filters
    };
    resetPagination();
    fetchTutors(searchFilters);
  }, [searchTerm, filters]);

  const handleCreateTutor = useCallback(async (tutorData: any) => {
    await createTutor(tutorData);
  }, [createTutor]);

  const handleUpdateTutor = useCallback(async (tutorData: any) => {
    if (!selectedTutor) return;
    await updateTutor(selectedTutor.id, tutorData);
  }, [selectedTutor, updateTutor]);

  const handleDeleteTutor = useCallback(async (tutorId: string) => {
    if (confirm('Are you sure you want to delete this tutor?')) {
      await deleteTutor(tutorId);
    }
  }, [deleteTutor]);

  const openCreateDialog = useCallback(() => {
    setDialogMode('create');
    setSelectedTutor(null);
    setIsCreateDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((tutor: Tutor) => {
    setDialogMode('edit');
    setSelectedTutor(tutor);
    setIsEditDialogOpen(true);
  }, []);

  const handleLoadMore = () => {
    fetchTutors(filters, true);
  };

  const handleImportTutors = async () => {
    try {
      // This would typically read from a file or API
      const response = await fetch('/tutors.json');
      const tutorsData = await response.json();
      await importTutors(tutorsData);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error('Failed to import tutors:', error);
    }
  };

  const handleToggleVerification = async (tutorId: string, currentStatus: string) => {
    try {
      setActionLoading(tutorId + '_verify');
      const newStatus = currentStatus === '2' ? false : true;
      await toggleVerification(tutorId, newStatus);
    } catch (error) {
      console.error('Failed to toggle verification:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleNotifications = async (tutorId: string, currentStatus: string) => {
    try {
      setActionLoading(tutorId + '_notif');
      const newStatus = currentStatus === '1' ? false : true;
      await toggleNotifications(tutorId, newStatus);
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCancelled = async (tutorId: string, currentStatus: string) => {
    try {
      setActionLoading(tutorId + '_cancel');
      const newStatus = currentStatus === '1' ? false : true;
      await toggleCancelled(tutorId, newStatus);
    } catch (error) {
      console.error('Failed to toggle cancelled status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadges = (tutor: Tutor) => {
    const badges = [];
    
    // Cancelled status takes priority
    if (tutor.cancelled === '1') {
      badges.push(
        <Badge key="cancelled" variant="destructive" className="bg-red-100 text-red-700 border-red-300">
          ❌ Cancelled
        </Badge>
      );
    } else if (tutor.deleted_at) {
      badges.push(<StatusBadge key="deleted" status="inactive" />);
    } else if (tutor.verified === '2') {
      badges.push(<StatusBadge key="verified" status="verified" />);
    } else {
      badges.push(<StatusBadge key="pending" status="pending" />);
    }
    
    badges.push(
      <NotificationBadge 
        key="notifications" 
        enabled={tutor.send_notifications === '1'} 
      />
    );
    
    return badges;
  };

  const getGenderIcon = (gender?: string) => {
    if (gender?.toLowerCase() === 'male') return '👨';
    if (gender?.toLowerCase() === 'female') return '👩';
    return '👤';
  };

  const getSignInMethodIcon = (signInMethod?: string) => {
    switch (signInMethod) {
      case 'facebook':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'google':
        return <Globe className="h-4 w-4 text-red-500" />;
      case 'apple':
        return <Apple className="h-4 w-4 text-gray-800" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSignInMethodLabel = (signInMethod?: string) => {
    switch (signInMethod) {
      case 'facebook':
        return 'Facebook';
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      default:
        return 'Manual';
    }
  };

  return (
    <AuthGuard requiredPermission={{ resource: 'tutors', action: 'read' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tutors</h1>
            <p className="text-gray-600 mt-2">Manage tutor accounts and information</p>
            <p className="text-sm text-gray-500 mt-1">Total: {totalCount} tutors</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            
            {hasPermission('tutors', 'write') && (
              <>
                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Import
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Import Tutors</DialogTitle>
                      <DialogDescription>
                        Import tutors from the JSON file.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        This will import all tutors from the tutors.json file.
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleImportTutors} disabled={loading}>
                          Import Tutors
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <LoadingButton
                  onClick={openCreateDialog}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Tutor
                </LoadingButton>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, phone, WhatsApp, country, bio, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="whitespace-nowrap">
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Verification Status</Label>
                    <Select
                      value={filters.verified?.toString() || undefined}
                      onValueChange={(value) => setFilters({ ...filters, verified: value === 'all' ? undefined : value === 'true' })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="true">Verified</SelectItem>
                        <SelectItem value="false">Not Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Country</Label>
                    <Select
                      value={filters.country || undefined}
                      onValueChange={(value) => setFilters({ ...filters, country: value === 'all' ? undefined : value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {Array.from(filterOptions.countries).sort((a, b) => a.localeCompare(b)).map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Has Requests</Label>
                    <Select
                      value={filters.has_requests?.toString() || undefined}
                      onValueChange={(value) => setFilters({ ...filters, has_requests: value === 'all' ? undefined : value === 'true' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">With Requests</SelectItem>
                        <SelectItem value="false">No Requests</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Sign-in Method</Label>
                    <Select
                      value={filters.sign_in_method || undefined}
                      onValueChange={(value) => setFilters({ ...filters, sign_in_method: value === 'all' ? undefined : value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="apple">Apple</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tutors Grid */}
        <LoadingOverlay loading={loading}>
          <div className="grid gap-4">
            {tutors.map((tutor) => (
              <Card key={tutor.id} className="transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {tutor.profile_image ? (
                          <div className="relative w-12 h-12">
                            <img
                              src={getImageUrl(tutor.profile_image)}
                              alt={tutor.full_name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-purple-200"
                              onError={(e) => {
                                // Fallback to gender icon container if image fails to load
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl">${getGenderIcon(tutor.gender)}</div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                            {getGenderIcon(tutor.gender)}
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 mb-1">
                            <GraduationCap className="h-5 w-5" />
                            {tutor.full_name || 'No Name'}
                          </CardTitle>
                          {tutor.nickname && tutor.nickname !== tutor.full_name && (
                            <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              @{tutor.nickname}
                            </p>
                          )}
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {tutor.email}
                            </span>
                            {tutor.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {tutor.phone_country_code}{tutor.phone}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {getStatusBadges(tutor)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {/* Quick Actions */}
                      {hasPermission('tutors', 'write') && (
                        <>
                          {/* Verification Toggle */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleVerification(tutor.id, tutor.verified)}
                            disabled={actionLoading === tutor.id + '_verify'}
                            className={
                              tutor.verified === '2'
                                ? "hover:bg-green-50 hover:border-green-200 text-green-600 border-green-300"
                                : "hover:bg-gray-50 hover:border-gray-200"
                            }
                            title={tutor.verified === '2' ? 'Unverify tutor' : 'Verify tutor'}
                          >
                            {actionLoading === tutor.id + '_verify' ? (
                              <span className="h-4 w-4 animate-spin">⟳</span>
                            ) : tutor.verified === '2' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Notifications Toggle */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleNotifications(tutor.id, tutor.send_notifications)}
                            disabled={actionLoading === tutor.id + '_notif'}
                            className={
                              tutor.send_notifications === '1'
                                ? "hover:bg-blue-50 hover:border-blue-200 text-blue-600 border-blue-300"
                                : "hover:bg-gray-50 hover:border-gray-200"
                            }
                            title={tutor.send_notifications === '1' ? 'Disable notifications' : 'Enable notifications'}
                          >
                            {actionLoading === tutor.id + '_notif' ? (
                              <span className="h-4 w-4 animate-spin">⟳</span>
                            ) : tutor.send_notifications === '1' ? (
                              <Bell className="h-4 w-4" />
                            ) : (
                              <BellOff className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Cancel/Activate Toggle */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleCancelled(tutor.id, tutor.cancelled)}
                            disabled={actionLoading === tutor.id + '_cancel'}
                            className={
                              tutor.cancelled === '1'
                                ? "hover:bg-red-50 hover:border-red-200 text-red-600 border-red-300"
                                : "hover:bg-gray-50 hover:border-gray-200"
                            }
                            title={tutor.cancelled === '1' ? 'Activate tutor' : 'Cancel tutor'}
                          >
                            {actionLoading === tutor.id + '_cancel' ? (
                              <span className="h-4 w-4 animate-spin">⟳</span>
                            ) : tutor.cancelled === '1' ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(tutor)}
                            className="hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      {hasPermission('tutors', 'delete') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTutor(tutor.id)}
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {tutor.country && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location
                      </h4>
                      <p className="text-sm font-medium">
                        {tutor.city ? `${tutor.city}, ${tutor.country}` : tutor.country}
                      </p>
                    </div>
                  )}
                  
                  {tutor.address && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Address
                      </h4>
                      <p className="text-sm font-medium">{tutor.address}</p>
                    </div>
                  )}
                  
                  {tutor.whatsapp_phone && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </h4>
                      <p className="text-sm font-medium">
                        {tutor.whatsapp_country_code}{tutor.whatsapp_phone}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Requests
                    </h4>
                    <p className="text-sm font-medium">{tutor.request_count || 0}</p>
                  </div>
                  
                  {tutor.nationality && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Nationality
                      </h4>
                      <p className="text-sm font-medium">{tutor.nationality}</p>
                    </div>
                  )}
                  
                  {tutor.gender && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1">
                        <UserCircle className="h-3 w-3" />
                        Gender
                      </h4>
                      <p className="text-sm font-medium">{tutor.gender}</p>
                    </div>
                  )}
                </div>

                {/* Bio Section - Full Width */}
                {tutor.bio && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1 mb-2">
                      <FileText className="h-3 w-3" />
                      Bio
                    </h4>
                    <p className="text-sm text-gray-700">{tutor.bio}</p>
                  </div>
                )}

                {/* Education/Degrees Section */}
                {tutor.degree && tutor.degree.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-sm text-gray-600 flex items-center gap-1 mb-3">
                      <GraduationCap className="h-3 w-3" />
                      Education & Certifications
                    </h4>
                    <div className="space-y-3">
                      {tutor.degree.map((degree, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                  {degree}
                                </Badge>
                              </div>
                              {tutor.university && tutor.university[index] && (
                                <p className="text-sm font-medium text-gray-700 mt-1">
                                  {tutor.university[index]}
                                </p>
                              )}
                              {tutor.certification_file_link && tutor.certification_file_link[index] && (
                                <div className="mt-2">
                                  <a
                                    href={getImageUrl(tutor.certification_file_link[index])}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    <FileText className="h-3 w-3" />
                                    View Certificate
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {typeof tutor.created_at === 'string' ? new Date(tutor.created_at).toLocaleDateString() : new Date((tutor.created_at as any)._seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {getSignInMethodIcon(tutor.sign_in_method)}
                      <span>{getSignInMethodLabel(tutor.sign_in_method)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            ))}
          </div>
        </LoadingOverlay>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
              Load More Tutors
            </Button>
          </div>
        )}

        {tutors.length === 0 && !loading && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tutors found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || Object.keys(filters).length > 0 
                    ? 'No tutors match your search criteria.' 
                    : 'Tutors will appear here once they are added to the system.'
                  }
                </p>
                {hasPermission('tutors', 'write') && !searchTerm && Object.keys(filters).length === 0 && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Tutor
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Tutor Dialog */}
        <EnhancedTutorDialog
          open={isCreateDialogOpen || isEditDialogOpen}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedTutor(null);
            }
          }}
          tutor={selectedTutor}
          mode={dialogMode}
          onSave={dialogMode === 'create' ? handleCreateTutor : handleUpdateTutor}
          loading={loading}
          error={error}
        />
      </div>
    </AuthGuard>
  );
}

