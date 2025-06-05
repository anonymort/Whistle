import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, FileText, Trash2, Eye, Clock, AlertTriangle, LogOut, Key, ChevronLeft, ChevronRight } from "lucide-react";
import SubmissionFilters from "@/components/admin/submission-filters";
import SubmissionList from "@/components/admin/submission-list";
import InvestigatorManagement from "@/components/admin/investigator-management";
import CaseNotesPanel from "@/components/admin/case-notes-panel";
import SubmissionDetails from "@/components/admin/submission-details";
import AggregatedReporting from "@/components/admin/aggregated-reporting";
import GDPRDataRequestPanel from "@/components/admin/gdpr-data-request-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { submitData, apiRequest, queryClient } from "@/lib/queryClient";
import dayjs from "dayjs";

// Import types from shared schema instead of redefining them
import type { Submission, CaseNote, Investigator } from "@shared/schema";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboardContent({ onLogout }: AdminDashboardProps) {
  const { toast } = useToast();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [decryptedData, setDecryptedData] = useState<{ message: string; fileName?: string; fileData?: string } | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [keyRotationDialogOpen, setKeyRotationDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [trustFilter, setTrustFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [reportingTimeRange, setReportingTimeRange] = useState("30days");

  // Data fetching
  const { data: submissions = [], isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery<Submission[]>({
    queryKey: ['/api/admin/submissions'],
  });

  const { data: investigators = [], isLoading: investigatorsLoading, refetch: refetchInvestigators } = useQuery<Investigator[]>({
    queryKey: ['/api/admin/investigators'],
  });

  const { data: caseNotes = [], refetch: refetchCaseNotes } = useQuery<CaseNote[]>({
    queryKey: ['/api/admin/case-notes', selectedSubmission?.id],
    enabled: !!selectedSubmission?.id,
  });

  const { data: stats = { total: 0, new: 0, investigating: 0, critical: 0, withFiles: 0, urgent: 0 } } = useQuery<{
    total: number;
    new: number;
    investigating: number;
    critical: number;
    withFiles: number;
    urgent: number;
  }>({
    queryKey: ['/api/admin/stats'],
  });

  // Mutations
  const decryptMutation = useMutation({
    mutationFn: async (encryptedData: string) => {
      return await submitData('/api/admin/decrypt', { encryptedData });
    },
    onSuccess: (data) => {
      setDecryptedData(data);
      setDetailsDialogOpen(true);
    },
    onError: (error) => {
      toast({
        title: "Decryption failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/submissions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      setDeleteConfirmOpen(false);
      setSubmissionToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return await apiRequest('PATCH', `/api/admin/submissions/${id}`, updates);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createInvestigatorMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; department: string; password: string }) => {
      return await submitData('/api/admin/investigators', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Investigator created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investigators'] });
    },
    onError: (error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInvestigatorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PATCH', `/api/admin/investigators/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Investigator updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investigators'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCaseNoteMutation = useMutation({
    mutationFn: async (data: { submissionId: number; note: string; noteType: string; isInternal: string }) => {
      return await submitData('/api/admin/case-notes', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Case note added successfully",
      });
      refetchCaseNotes();
    },
    onError: (error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCaseNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest('DELETE', `/api/admin/case-notes/${noteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Case note deleted successfully",
      });
      refetchCaseNotes();
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const keyRotationMutation = useMutation({
    mutationFn: async () => {
      return await submitData('/api/admin/rotate-keys', {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Encryption keys rotated successfully",
      });
      setKeyRotationDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Key rotation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleDecrypt = (submission: Submission) => {
    setSelectedSubmission(submission);
    decryptMutation.mutate(submission.encryptedMessage);
  };

  const handleDelete = (id: number) => {
    setSubmissionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleViewNotes = (submission: Submission) => {
    setSelectedSubmission(submission);
    setNotesDialogOpen(true);
  };

  const handleAssign = (submissionId: number, investigatorName: string) => {
    updateSubmissionMutation.mutate({
      id: submissionId,
      updates: { assignedTo: investigatorName }
    });
  };

  const handleStatusChange = (submissionId: number, status: string) => {
    updateSubmissionMutation.mutate({
      id: submissionId,
      updates: { status }
    });
  };

  const handlePriorityChange = (submissionId: number, priority: string) => {
    updateSubmissionMutation.mutate({
      id: submissionId,
      updates: { priority }
    });
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setTrustFilter([]);
    setCategoryFilter([]);
    setSortBy("newest");
  };

  // Data processing
  const filteredSubmissions = submissions.filter((submission: Submission) => {
    if (statusFilter.length > 0 && !statusFilter.includes(submission.status)) return false;
    if (priorityFilter.length > 0 && !priorityFilter.includes(submission.priority)) return false;
    if (trustFilter.length > 0 && !trustFilter.includes(submission.hospitalTrust || 'Unknown')) return false;
    if (categoryFilter.length > 0 && !categoryFilter.includes(submission.category || 'uncategorized')) return false;
    return true;
  });

  const sortedSubmissions = [...filteredSubmissions].sort((a: Submission, b: Submission) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'trust':
        return (a.hospitalTrust || '').localeCompare(b.hospitalTrust || '');
      case 'newest':
      default:
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    }
  });

  const availableTrusts = Array.from(new Set(
    submissions.map((s: Submission) => s.hospitalTrust || 'Unknown')
  )).sort();

  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);

  if (submissionsLoading || investigatorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Manage submissions and investigators</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Dialog open={keyRotationDialogOpen} onOpenChange={setKeyRotationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Rotate Keys</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rotate Encryption Keys</DialogTitle>
                <DialogDescription>
                  This will generate new encryption keys. This is a security measure that should be performed regularly.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setKeyRotationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => keyRotationMutation.mutate()} disabled={keyRotationMutation.isPending}>
                  {keyRotationMutation.isPending ? "Rotating..." : "Rotate Keys"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={onLogout} variant="outline" className="flex items-center space-x-2">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{stats.total || 0}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{submissions.filter((s: Submission) => s.status === 'new').length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">New</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{submissions.filter((s: Submission) => s.status === 'investigating').length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Investigating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{submissions.filter((s: Submission) => s.priority === 'critical').length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{submissions.filter((s: Submission) => s.encryptedFile).length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">With Files</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 sm:p-3 lg:p-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-orange-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{submissions.filter((s: Submission) => {
                  const daysSinceSubmission = Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
                  return daysSinceSubmission <= 7;
                }).length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          <TabsTrigger value="submissions" className="text-xs sm:text-sm px-2 py-2">Submissions</TabsTrigger>
          <TabsTrigger value="investigators" className="text-xs sm:text-sm px-2 py-2">Investigators</TabsTrigger>
          <TabsTrigger value="reporting" className="text-xs sm:text-sm px-2 py-2">Reporting</TabsTrigger>
          <TabsTrigger value="gdpr-sar" className="text-xs sm:text-sm px-2 py-2">GDPR SAR</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Submissions ({sortedSubmissions.length})</CardTitle>
                  <CardDescription>Manage and review all submissions</CardDescription>
                </div>
                <SubmissionFilters
                  statusFilter={statusFilter}
                  priorityFilter={priorityFilter}
                  trustFilter={trustFilter}
                  categoryFilter={categoryFilter}
                  sortBy={sortBy}
                  availableTrusts={availableTrusts}
                  onStatusFilterChange={setStatusFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  onTrustFilterChange={setTrustFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  onSortByChange={setSortBy}
                  onClearFilters={clearFilters}
                />
              </div>
            </CardHeader>
            <CardContent>
              <SubmissionList
                submissions={sortedSubmissions}
                investigators={investigators}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                onDecrypt={handleDecrypt}
                onDelete={handleDelete}
                onViewNotes={handleViewNotes}
                onAssign={handleAssign}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedSubmissions.length)} of {sortedSubmissions.length} submissions
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investigators">
          <InvestigatorManagement
            investigators={investigators}
            onCreateInvestigator={(data) => createInvestigatorMutation.mutate(data)}
            onUpdateInvestigator={(id, data) => updateInvestigatorMutation.mutate({ id, data })}
            isCreating={createInvestigatorMutation.isPending}
            isUpdating={updateInvestigatorMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="reporting">
          <AggregatedReporting
            timeRange={reportingTimeRange}
            onTimeRangeChange={setReportingTimeRange}
          />
        </TabsContent>

        <TabsContent value="gdpr-sar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>GDPR Subject Access Requests</span>
              </CardTitle>
              <CardDescription>
                Search and export personal data to fulfill GDPR Article 15 requests. 
                Individuals have the right to access their personal data within 30 days of request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GDPRDataRequestPanel 
                submissions={submissions}
                onDecrypt={handleDecrypt}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SubmissionDetails
        submission={selectedSubmission}
        decryptedData={decryptedData}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        investigators={investigators}
        onAssign={handleAssign}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />

      <CaseNotesPanel
        submission={selectedSubmission}
        caseNotes={caseNotes}
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        onAddNote={(data) => 
          createCaseNoteMutation.mutate(data)
        }
        onDeleteNote={(noteId) => deleteCaseNoteMutation.mutate(noteId)}
        isAddingNote={createCaseNoteMutation.isPending}
        isDeletingNote={deleteCaseNoteMutation.isPending}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => submissionToDelete && deleteMutation.mutate(submissionToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}