import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, FileText, Trash2, Eye, Clock, AlertTriangle, LogOut, Key, RotateCcw, Download, Filter, X, Edit3, MessageSquare, User, Calendar, Flag, TrendingUp, CheckCircle, CircleX, AlertCircle, Pause, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<{[key: number]: string}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'trust' | 'status' | 'priority'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTrusts, setSelectedTrusts] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [editingCase, setEditingCase] = useState<Submission | null>(null);
  const [caseNotes, setCaseNotes] = useState<{[key: number]: CaseNote[]}>({});
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [newInvestigator, setNewInvestigator] = useState({ name: '', email: '', department: '' });
  const [editingInvestigator, setEditingInvestigator] = useState<Investigator | null>(null);
  const itemsPerPage = 10;
  const { toast } = useToast();

  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/submissions'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/submissions");
      const data = await response.json();
      return data.map((s: any) => ({
        ...s,
        submittedAt: new Date(s.submittedAt),
        lastUpdated: s.lastUpdated ? new Date(s.lastUpdated) : new Date(s.submittedAt)
      }));
    }
  });

  const { data: investigators = [] } = useQuery({
    queryKey: ['/api/admin/investigators'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/investigators");
      return response.json();
    }
  });

  // Case Management Mutations
  const updateCaseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/submission/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      toast({
        title: "Case Updated",
        description: "Case details updated successfully.",
      });
      setEditingCase(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update case.",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ submissionId, note, noteType }: { submissionId: number; note: string; noteType: string }) => {
      const response = await apiRequest("POST", `/api/admin/submission/${submissionId}/notes`, {
        note,
        noteType,
        isInternal: 'true'
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const submissionId = variables.submissionId;
      setCaseNotes(prev => ({
        ...prev,
        [submissionId]: [data, ...(prev[submissionId] || [])]
      }));
      setNewNote('');
      toast({
        title: "Note Added",
        description: "Case note added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add note.",
        variant: "destructive",
      });
    },
  });

  // Investigator Management Mutations
  const createInvestigatorMutation = useMutation({
    mutationFn: async (investigator: { name: string; email: string; department: string }) => {
      const response = await apiRequest("POST", "/api/admin/investigators", investigator);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investigators'] });
      setNewInvestigator({ name: '', email: '', department: '' });
      toast({
        title: "Investigator Added",
        description: "New investigator has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create investigator.",
        variant: "destructive",
      });
    },
  });

  const updateInvestigatorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/investigators/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/investigators'] });
      setEditingInvestigator(null);
      toast({
        title: "Investigator Updated",
        description: "Investigator details updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update investigator.",
        variant: "destructive",
      });
    },
  });

  // Enhanced case update with email notification
  const updateCaseWithNotificationMutation = useMutation({
    mutationFn: async ({ id, updates, previousAssignee }: { id: number; updates: any; previousAssignee?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/submission/${id}`, updates);
      
      // Send email notification if assignee changed
      if (updates.assignedTo && updates.assignedTo !== previousAssignee && updates.assignedTo !== "unassigned") {
        try {
          await apiRequest("POST", "/api/admin/notify-assignment", {
            submissionId: id,
            investigatorName: updates.assignedTo
          });
        } catch (error) {
          console.warn("Failed to send email notification:", error);
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      toast({
        title: "Case Updated",
        description: "Case details updated and investigator notified.",
      });
      setEditingCase(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update case.",
        variant: "destructive",
      });
    },
  });

  // Utility functions for case management
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <CircleX className="h-4 w-4 text-blue-500" />;
      case 'under_review': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'investigating': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <Pause className="h-4 w-4 text-gray-500" />;
      default: return <CircleX className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'under_review': return 'secondary';
      case 'investigating': return 'destructive';
      case 'resolved': return 'outline';
      case 'closed': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const fetchCaseNotes = async (submissionId: number) => {
    if (!caseNotes[submissionId]) {
      try {
        const response = await apiRequest("GET", `/api/admin/submission/${submissionId}/notes`);
        const notes = await response.json();
        setCaseNotes(prev => ({
          ...prev,
          [submissionId]: notes.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }))
        }));
      } catch (error) {
        console.error("Failed to fetch case notes:", error);
      }
    }
  };

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/stats");
      return response.json();
    }
  });

  const purgeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/purge");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purge Complete",
        description: `Removed ${data.purgedCount} old submissions`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: () => {
      toast({
        title: "Purge Failed",
        description: "Unable to purge old submissions",
        variant: "destructive",
      });
    }
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submissionId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/submission/${submissionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      // Fix pagination when deleting last item on current page
      const newTotalItems = submissions.length - 1;
      const newTotalPages = Math.ceil(newTotalItems / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      
      toast({
        title: "Submission Deleted",
        description: "The submission and associated files have been permanently removed",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Unable to delete submission",
        variant: "destructive",
      });
    }
  });

  const decryptMutation = useMutation({
    mutationFn: async (encryptedData: string) => {
      const response = await apiRequest("POST", "/api/admin/decrypt", {
        encryptedData
      });
      return response.json();
    },
    onSuccess: (data, encryptedData) => {
      // Find the submission ID that matches this encrypted data
      const submission = submissions.find((s: Submission) => s.encryptedMessage === encryptedData);
      if (submission) {
        setDecryptedContent(prev => ({
          ...prev,
          [submission.id]: data.decryptedText
        }));
      }
    },
    onError: () => {
      toast({
        title: "Decryption Failed",
        description: "Unable to decrypt submission content",
        variant: "destructive",
      });
    },
  });

  const handleDecrypt = (submission: Submission) => {
    if (!decryptedContent[submission.id]) {
      decryptMutation.mutate(submission.encryptedMessage);
    }
  };

  const { data: publicKey } = useQuery({
    queryKey: ['/api/admin/public-key'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/public-key");
      return response.json();
    }
  });

  const rotateKeysMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/rotate-keys");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Keys Rotated",
        description: "Encryption keys have been rotated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/public-key'] });
    },
    onError: () => {
      toast({
        title: "Key Rotation Failed",
        description: "Unable to rotate encryption keys",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy 'at' HH:mm");
  };

  const calculateDaysRemaining = (submissionDate: Date) => {
    const ninetyDaysLater = new Date(submissionDate);
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);
    const now = new Date();
    const diffTime = ninetyDaysLater.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Advanced filtering with status and priority
  const filteredSubmissions = submissions.filter((submission: Submission) => {
    // Trust filter
    const trustMatch = selectedTrusts.length === 0 || 
      selectedTrusts.includes(submission.hospitalTrust || 'Unknown');
    
    // Status filter
    const statusMatch = statusFilter === 'all' || submission.status === statusFilter;
    
    // Priority filter  
    const priorityMatch = priorityFilter === 'all' || submission.priority === priorityFilter;
    
    return trustMatch && statusMatch && priorityMatch;
  });

  // Enhanced sorting with status and priority options
  const sortedSubmissions = [...filteredSubmissions].sort((a: Submission, b: Submission) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'trust':
        const aName = a.hospitalTrust || 'Unknown';
        const bName = b.hospitalTrust || 'Unknown';
        comparison = aName.localeCompare(bName);
        break;
      case 'status':
        const statusOrder = ['new', 'under_review', 'investigating', 'resolved', 'closed'];
        const aStatusIndex = statusOrder.indexOf(a.status);
        const bStatusIndex = statusOrder.indexOf(b.status);
        comparison = aStatusIndex - bStatusIndex;
        break;
      case 'priority':
        const priorityOrder = ['critical', 'high', 'medium', 'low'];
        const aPriorityIndex = priorityOrder.indexOf(a.priority);
        const bPriorityIndex = priorityOrder.indexOf(b.priority);
        comparison = aPriorityIndex - bPriorityIndex;
        break;
      default: // date
        const aDate = new Date(a.submittedAt).getTime();
        const bDate = new Date(b.submittedAt).getTime();
        comparison = aDate - bDate;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(startIndex, startIndex + itemsPerPage);

  // Get unique hospital trusts for filter dropdown
  const uniqueTrusts = Array.from(new Set(
    submissions.map((s: Submission) => s.hospitalTrust || 'Unknown')
  )).sort();

  const handleSort = (newSortBy: 'date' | 'trust' | 'status' | 'priority') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleDelete = (submissionId: number) => {
    if (window.confirm('Are you sure you want to permanently delete this submission? This action cannot be undone.')) {
      deleteSubmissionMutation.mutate(submissionId);
    }
  };

  return (
    <div className="min-h-screen bg-bg-soft">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">WhistleLite Admin</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">NHS Whistleblowing Portal Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button
                onClick={() => purgeMutation.mutate()}
                disabled={purgeMutation.isPending}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-xs sm:text-sm"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Purge Old Data</span>
                <span className="sm:hidden">Purge</span>
              </Button>
              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-xs sm:text-sm"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Stats Cards with Case Management Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissionCount || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Cases</CardTitle>
              <CircleX className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter((s: Submission) => s.status === 'new').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investigating</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter((s: Submission) => s.status === 'investigating').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter((s: Submission) => s.priority === 'critical').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Files</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter((s: Submission) => s.encryptedFile).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter((s: Submission) => calculateDaysRemaining(s.submittedAt) <= 7).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different admin functions */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="investigators">Investigators</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Submissions Management</CardTitle>
                <CardDescription>
                  All submissions are encrypted and will be automatically deleted after 90 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Enhanced Sorting and filtering controls with Case Management */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      variant={sortBy === 'date' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSort('date')}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Sort by Date</span>
                      <span className="sm:hidden">Date</span>
                      {sortBy === 'date' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                    <Button
                      variant={sortBy === 'status' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Sort by Status</span>
                      <span className="sm:hidden">Status</span>
                      {sortBy === 'status' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                    <Button
                      variant={sortBy === 'priority' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSort('priority')}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Sort by Priority</span>
                      <span className="sm:hidden">Priority</span>
                      {sortBy === 'priority' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                    <Button
                      variant={sortBy === 'trust' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSort('trust')}
                      className="text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Sort by Trust</span>
                      <span className="sm:hidden">Trust</span>
                      {sortBy === 'trust' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </Button>
                    
                    {/* Hospital Trust Filter */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-xs sm:text-sm"
                        >
                          <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Filter by Trust</span>
                          <span className="sm:hidden">Filter</span>
                          {selectedTrusts.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {selectedTrusts.length}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Select Hospital Trusts</span>
                            {selectedTrusts.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTrusts([])}
                                className="h-6 px-2"
                              >
                                <X className="w-3 h-3" />
                                Clear
                              </Button>
                            )}
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {uniqueTrusts.map((trust: string) => (
                              <div key={trust} className="flex items-center space-x-2">
                                <Checkbox
                                  id={trust}
                                  checked={selectedTrusts.includes(trust)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedTrusts([...selectedTrusts, trust]);
                                    } else {
                                      setSelectedTrusts(selectedTrusts.filter(t => t !== trust));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor={trust}
                                  className="text-sm cursor-pointer truncate flex-1"
                                  title={trust}
                                >
                                  {trust}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Priority Filter */}
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="All Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedSubmissions.length)} of {sortedSubmissions.length} cases
                    {(selectedTrusts.length > 0 || statusFilter !== 'all' || priorityFilter !== 'all') && (
                      <span className="text-blue-600 ml-1">(filtered)</span>
                    )}
                  </div>
                </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No submissions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">ID</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Status</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Priority</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">Hospital Trust</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Submitted</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">File</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">Assigned To</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Days Left</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubmissions.map((submission: Submission) => {
                      const daysRemaining = calculateDaysRemaining(submission.submittedAt);
                      const assignedInvestigator = investigators.find(inv => inv.name === submission.assignedTo);
                      return (
                        <tr key={submission.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 sm:py-3 px-2 sm:px-4 font-mono text-xs sm:text-sm">#{submission.id}</td>
                          
                          {/* Status Column */}
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(submission.status)}
                              <Badge variant={getStatusBadgeVariant(submission.status) as any} className="text-xs">
                                {submission.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </td>
                          
                          {/* Priority Column */}
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            <Badge className={`text-xs ${getPriorityColor(submission.priority)}`}>
                              {submission.priority.toUpperCase()}
                            </Badge>
                          </td>
                          
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm hidden sm:table-cell">
                            {submission.hospitalTrust || 'Unknown'}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                            <div className="flex flex-col">
                              <span>{formatDate(submission.submittedAt)}</span>
                              <span className="text-xs text-gray-500 sm:hidden">
                                {submission.hospitalTrust || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            {submission.encryptedFile ? (
                              <Badge variant="secondary" className="text-xs">Yes</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">No</Badge>
                            )}
                          </td>
                          {/* Assigned To Column */}
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm hidden md:table-cell">
                            {assignedInvestigator ? (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3 text-gray-400" />
                                <span className="text-xs">{assignedInvestigator.name}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">Unassigned</Badge>
                            )}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <Badge 
                              variant={daysRemaining <= 7 ? "destructive" : "outline"}
                              className="flex items-center space-x-1 w-fit text-xs"
                            >
                              <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">{daysRemaining} days</span>
                              <span className="sm:hidden">{daysRemaining}d</span>
                            </Badge>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div className="flex gap-1">
                              {/* Case Management Button */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingCase(submission);
                                      fetchCaseNotes(submission.id);
                                    }}
                                    className="text-xs"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Case Management - #{submission.id}</DialogTitle>
                                    <DialogDescription>
                                      Submitted: {formatDate(submission.submittedAt)} | Trust: {submission.hospitalTrust || 'Unknown'}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Case Details */}
                                    <div className="space-y-4">
                                      <h3 className="font-semibold">Case Details</h3>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Status</Label>
                                          <Select 
                                            value={editingCase?.status || submission.status}
                                            onValueChange={(value) => 
                                              setEditingCase(prev => prev ? {...prev, status: value} : null)
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="new">New</SelectItem>
                                              <SelectItem value="under_review">Under Review</SelectItem>
                                              <SelectItem value="investigating">Investigating</SelectItem>
                                              <SelectItem value="resolved">Resolved</SelectItem>
                                              <SelectItem value="closed">Closed</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div>
                                          <Label>Priority</Label>
                                          <Select 
                                            value={editingCase?.priority || submission.priority}
                                            onValueChange={(value) => 
                                              setEditingCase(prev => prev ? {...prev, priority: value} : null)
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="low">Low</SelectItem>
                                              <SelectItem value="medium">Medium</SelectItem>
                                              <SelectItem value="high">High</SelectItem>
                                              <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div className="col-span-2">
                                          <Label>Assign to Investigator</Label>
                                          <Select 
                                            value={editingCase?.assignedTo || submission.assignedTo || "unassigned"}
                                            onValueChange={(value) => 
                                              setEditingCase(prev => prev ? {...prev, assignedTo: value === "unassigned" ? null : value} : null)
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select investigator" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="unassigned">Unassigned</SelectItem>
                                              {investigators.map((inv: any) => (
                                                <SelectItem key={inv.id} value={inv.name}>{inv.name} - {inv.department}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div className="col-span-2">
                                          <Label>Category</Label>
                                          <Select 
                                            value={editingCase?.category || submission.category || "uncategorized"}
                                            onValueChange={(value) => 
                                              setEditingCase(prev => prev ? {...prev, category: value === "uncategorized" ? null : value} : null)
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="uncategorized">Not categorized</SelectItem>
                                              <SelectItem value="patient_safety">Patient Safety</SelectItem>
                                              <SelectItem value="clinical_governance">Clinical Governance</SelectItem>
                                              <SelectItem value="financial_irregularity">Financial Irregularity</SelectItem>
                                              <SelectItem value="data_protection">Data Protection</SelectItem>
                                              <SelectItem value="staff_conduct">Staff Conduct</SelectItem>
                                              <SelectItem value="discrimination">Discrimination</SelectItem>
                                              <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      
                                      <Button 
                                        onClick={() => {
                                          if (editingCase) {
                                            updateCaseWithNotificationMutation.mutate({
                                              id: submission.id,
                                              updates: {
                                                status: editingCase.status,
                                                priority: editingCase.priority,
                                                assignedTo: editingCase.assignedTo === "unassigned" ? null : editingCase.assignedTo,
                                                category: editingCase.category === "uncategorized" ? null : editingCase.category
                                              },
                                              previousAssignee: submission.assignedTo
                                            });
                                          }
                                        }}
                                        disabled={updateCaseWithNotificationMutation.isPending}
                                        className="w-full"
                                      >
                                        Update Case Details
                                      </Button>
                                    </div>
                                    
                                    {/* Case Notes */}
                                    <div className="space-y-4">
                                      <h3 className="font-semibold">Case Notes</h3>
                                      
                                      {/* Add Note Form */}
                                      <div className="border rounded-lg p-4 space-y-4">
                                        <div>
                                          <Label>Note Type</Label>
                                          <Select value={noteType} onValueChange={setNoteType}>
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="general">General</SelectItem>
                                              <SelectItem value="investigation">Investigation</SelectItem>
                                              <SelectItem value="follow_up">Follow Up</SelectItem>
                                              <SelectItem value="resolution">Resolution</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <div>
                                          <Label>Note</Label>
                                          <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Add a case note..."
                                            className="w-full p-2 border rounded-md resize-none"
                                            rows={3}
                                          />
                                        </div>
                                        
                                        <Button 
                                          onClick={() => {
                                            if (newNote.trim()) {
                                              addNoteMutation.mutate({
                                                submissionId: submission.id,
                                                note: newNote.trim(),
                                                noteType
                                              });
                                            }
                                          }}
                                          disabled={!newNote.trim() || addNoteMutation.isPending}
                                          size="sm"
                                        >
                                          Add Note
                                        </Button>
                                      </div>
                                      
                                      {/* Existing Notes */}
                                      <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {(caseNotes[submission.id] || []).map((note: any) => (
                                          <div key={note.id} className="border rounded-lg p-3 bg-gray-50">
                                            <div className="flex justify-between items-start mb-2">
                                              <Badge variant="outline" className="text-xs">
                                                {note.noteType.replace('_', ' ').toUpperCase()}
                                              </Badge>
                                              <span className="text-xs text-gray-500">
                                                {format(note.createdAt, 'MMM dd, yyyy HH:mm')}
                                              </span>
                                            </div>
                                            <p className="text-sm">{note.note}</p>
                                            <p className="text-xs text-gray-500 mt-1">by {note.createdBy}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {/* View Details Button */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedSubmission(submission)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Submission Details</DialogTitle>
                                  <DialogDescription>
                                    Submission #{submission.id} - {formatDate(submission.submittedAt)}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">SHA256 Hash:</label>
                                    <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                                      {submission.sha256Hash}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Message Content:</label>
                                    {decryptedContent[submission.id] ? (
                                      <div className="bg-green-50 border border-green-200 rounded mt-1 p-3">
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                          {decryptedContent[submission.id]}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="bg-gray-50 border border-gray-200 rounded mt-1 p-3">
                                        <p className="text-xs text-gray-500 mb-2">Content is encrypted</p>
                                        <Button
                                          onClick={() => handleDecrypt(submission)}
                                          disabled={decryptMutation.isPending}
                                          size="sm"
                                          className="bg-blue-600 hover:bg-blue-700"
                                        >
                                          {decryptMutation.isPending ? "Decrypting..." : "Decrypt Content"}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  {submission.encryptedFile && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Attached File:</label>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded flex-1">
                                          File attached ({submission.encryptedFile.length} characters)
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(`/api/admin/download/${submission.id}`, '_blank')}
                                          className="text-xs"
                                        >
                                          <Download className="w-3 h-3 mr-1" />
                                          Download
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {submission.replyEmail && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Reply Email:</label>
                                      <p className="text-sm text-gray-600 mt-1">{submission.replyEmail}</p>
                                    </div>
                                  )}
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-center space-x-2">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                      <span className="text-sm font-medium text-yellow-800">Auto-Delete Warning</span>
                                    </div>
                                    <p className="text-sm text-yellow-700 mt-1">
                                      This submission will be automatically deleted in {daysRemaining} days 
                                      ({format(new Date(submission.submittedAt.getTime() + 90 * 24 * 60 * 60 * 1000), "MMM dd, yyyy")})
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(submission.id)}
                              disabled={deleteSubmissionMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="investigators">
            <Card>
              <CardHeader>
                <CardTitle>Investigator Management</CardTitle>
                <CardDescription>
                  Manage investigators who can be assigned to cases. When assigned, they will receive email notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Investigator */}
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Add New Investigator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newInvestigator.name}
                        onChange={(e) => setNewInvestigator(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newInvestigator.email}
                        onChange={(e) => setNewInvestigator(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@nhs.uk"
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={newInvestigator.department}
                        onChange={(e) => setNewInvestigator(prev => ({ ...prev, department: e.target.value }))}
                        placeholder="e.g. Patient Safety"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => createInvestigatorMutation.mutate(newInvestigator)}
                    disabled={createInvestigatorMutation.isPending || !newInvestigator.name || !newInvestigator.email}
                    className="mt-4"
                  >
                    Add Investigator
                  </Button>
                </div>

                {/* Existing Investigators */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Current Investigators</h3>
                  <div className="grid gap-4">
                    {investigators.map((investigator: Investigator) => (
                      <div key={investigator.id} className="border rounded-lg p-4">
                        {editingInvestigator?.id === investigator.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={editingInvestigator.name}
                                  onChange={(e) => setEditingInvestigator(prev => 
                                    prev ? { ...prev, name: e.target.value } : null
                                  )}
                                />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={editingInvestigator.email}
                                  onChange={(e) => setEditingInvestigator(prev => 
                                    prev ? { ...prev, email: e.target.value } : null
                                  )}
                                />
                              </div>
                              <div>
                                <Label>Department</Label>
                                <Input
                                  value={editingInvestigator.department || ''}
                                  onChange={(e) => setEditingInvestigator(prev => 
                                    prev ? { ...prev, department: e.target.value } : null
                                  )}
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateInvestigatorMutation.mutate({
                                  id: investigator.id,
                                  updates: {
                                    name: editingInvestigator.name,
                                    email: editingInvestigator.email,
                                    department: editingInvestigator.department
                                  }
                                })}
                                disabled={updateInvestigatorMutation.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingInvestigator(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{investigator.name}</h4>
                              <p className="text-sm text-gray-600">{investigator.email}</p>
                              {investigator.department && (
                                <p className="text-sm text-gray-500">{investigator.department}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  investigator.isActive === 'yes' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {investigator.isActive === 'yes' ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingInvestigator(investigator)}
                            >
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>Encryption Management</span>
                  </CardTitle>
                  <CardDescription>
                    Manage encryption keys and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Public Key:</label>
                    <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                      {publicKey?.publicKey || 'Loading...'}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => rotateKeysMutation.mutate()}
                      disabled={rotateKeysMutation.isPending}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{rotateKeysMutation.isPending ? 'Rotating...' : 'Rotate Keys'}</span>
                    </Button>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Key Rotation Warning</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Rotating keys will invalidate all existing encrypted submissions. Only rotate if necessary for security.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}