import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, FileText, Trash2, Eye, Clock, AlertTriangle, LogOut, Key, RotateCcw, Download, TrendingUp, CheckCircle, CircleX, AlertCircle, Pause, Settings, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";

import SubmissionFilters from "@/components/admin/submission-filters";
import SubmissionList from "@/components/admin/submission-list";
import InvestigatorManagement from "@/components/admin/investigator-management";
import CaseNotesPanel from "@/components/admin/case-notes-panel";
import SubmissionDetails from "@/components/admin/submission-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface Submission {
  id: number;
  encryptedMessage: string;
  encryptedFile: string | null;
  replyEmail: string | null;
  hospitalTrust: string | null;
  sha256Hash: string;
  submittedAt: Date;
  status: string;
  priority: string;
  assignedTo: string | null;
  category: string | null;
  eventDate: string | null;
  eventTime: string | null;
  riskLevel: string;
  lastUpdated: Date;
}

interface CaseNote {
  id: number;
  submissionId: number;
  note: string;
  createdBy: string;
  isInternal: string;
  noteType: string;
  createdAt: Date;
}

interface Investigator {
  id: number;
  name: string;
  email: string;
  department: string | null;
  isActive: string;
}

interface AdminDashboardContentProps {
  onLogout: () => void;
}

export default function AdminDashboardContent({ onLogout }: AdminDashboardContentProps) {
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

  // Data fetching queries
  const { data: submissions = [], isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery({
    queryKey: ['/api/admin/submissions'],
  });

  const { data: investigators = [], isLoading: investigatorsLoading, refetch: refetchInvestigators } = useQuery({
    queryKey: ['/api/admin/investigators'],
  });

  const { data: caseNotes = [], refetch: refetchCaseNotes } = useQuery({
    queryKey: ['/api/admin/case-notes', selectedSubmission?.id],
    enabled: !!selectedSubmission?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Mutations
  const decryptMutation = useMutation({
    mutationFn: async (encryptedData: string) => {
      const response = await apiRequest(`/api/admin/decrypt`, {
        method: 'POST',
        body: { encryptedData },
      });
      return response;
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
      await apiRequest(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
      });
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
      await apiRequest(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        body: updates,
      });
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
      await apiRequest('/api/admin/investigators', {
        method: 'POST',
        body: data,
      });
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
      await apiRequest(`/api/admin/investigators/${id}`, {
        method: 'PATCH',
        body: data,
      });
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
      await apiRequest('/api/admin/case-notes', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Note added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/case-notes', selectedSubmission?.id] });
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
      await apiRequest(`/api/admin/case-notes/${noteId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/case-notes', selectedSubmission?.id] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const keyRotationMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/admin/rotate-keys', {
        method: 'POST',
      });
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
    const submission_ = submissions.find((s: Submission) => s.encryptedMessage === submission.encryptedMessage);
    if (submission_) {
      decryptMutation.mutate(submission.encryptedMessage);
    }
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

  const handleDownloadFile = (fileData: string, fileName: string) => {
    try {
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Manage submissions and investigators</p>
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
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{submissions.filter((s: Submission) => s.status === 'new').length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">New</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{submissions.filter((s: Submission) => s.status === 'investigating').length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Investigating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{submissions.filter((s: Submission) => s.priority === 'critical').length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{submissions.filter((s: Submission) => {
                    const now = new Date();
                    const daysDiff = Math.ceil((now.getTime() - new Date(s.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
                    return Math.max(0, 20 - daysDiff) <= 7;
                  }).length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="investigators">Investigators</TabsTrigger>
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

        <TabsContent value="analytics">
          <AnalyticsDashboard submissions={submissions} investigators={investigators} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SubmissionDetails
        isOpen={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDecryptedData(null);
        }}
        submission={selectedSubmission}
        decryptedData={decryptedData}
        investigators={investigators}
        onAssign={handleAssign}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onDownloadFile={handleDownloadFile}
        isUpdating={updateSubmissionMutation.isPending}
      />

      <CaseNotesPanel
        isOpen={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        submission={selectedSubmission}
        caseNotes={caseNotes}
        onAddNote={(data) => createCaseNoteMutation.mutate(data)}
        onDeleteNote={(noteId) => deleteCaseNoteMutation.mutate(noteId)}
        isAdding={createCaseNoteMutation.isPending}
        isDeleting={deleteCaseNoteMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
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