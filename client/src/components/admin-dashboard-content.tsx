import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, FileText, Trash2, Eye, Clock, AlertTriangle, LogOut, Key, RotateCcw, Download } from "lucide-react";
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
}

interface AdminDashboardContentProps {
  onLogout: () => void;
}

export default function AdminDashboardContent({ onLogout }: AdminDashboardContentProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<{[key: number]: string}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'trust'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;
  const { toast } = useToast();

  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/submissions'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/submissions");
      const data = await response.json();
      return data.map((s: any) => ({
        ...s,
        submittedAt: new Date(s.submittedAt)
      }));
    }
  });

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

  // Sort and paginate submissions
  const sortedSubmissions = [...submissions].sort((a: Submission, b: Submission) => {
    if (sortBy === 'trust') {
      const aName = a.hospitalTrust || 'Unknown';
      const bName = b.hospitalTrust || 'Unknown';
      if (sortOrder === 'asc') {
        return aName.localeCompare(bName);
      } else {
        return bName.localeCompare(aName);
      }
    } else {
      // Sort by date
      const aDate = new Date(a.submittedAt).getTime();
      const bDate = new Date(b.submittedAt).getTime();
      if (sortOrder === 'asc') {
        return aDate - bDate;
      } else {
        return bDate - aDate;
      }
    }
  });

  const totalPages = Math.ceil(sortedSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = sortedSubmissions.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (newSortBy: 'date' | 'trust') => {
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WhistleLite Admin</h1>
                <p className="text-sm text-gray-600">NHS Whistleblowing Portal Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => purgeMutation.mutate()}
                disabled={purgeMutation.isPending}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Purge Old Data</span>
              </Button>
              <Button
                onClick={onLogout}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.submissionCount || 0}</div>
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
              <CardTitle className="text-sm font-medium">With Reply Email</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {submissions.filter((s: Submission) => s.replyEmail).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
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
                {/* Sorting and pagination controls */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === 'date' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSort('date')}
                    >
                      Sort by Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                    <Button
                      variant={sortBy === 'trust' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSort('trust')}
                    >
                      Sort by Trust {sortBy === 'trust' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, submissions.length)} of {submissions.length} submissions
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">ID</th>
                      <th className="text-left py-3 px-4">Hospital Trust</th>
                      <th className="text-left py-3 px-4">Submitted</th>
                      <th className="text-left py-3 px-4">Has File</th>
                      <th className="text-left py-3 px-4">Reply Email</th>
                      <th className="text-left py-3 px-4">Days Remaining</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubmissions.map((submission: Submission) => {
                      const daysRemaining = calculateDaysRemaining(submission.submittedAt);
                      return (
                        <tr key={submission.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">#{submission.id}</td>
                          <td className="py-3 px-4 text-sm">
                            {submission.hospitalTrust || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatDate(submission.submittedAt)}
                          </td>
                          <td className="py-3 px-4">
                            {submission.encryptedFile ? (
                              <Badge variant="secondary">Yes</Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {submission.replyEmail ? (
                              <Badge variant="secondary">Yes</Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={daysRemaining <= 7 ? "destructive" : "outline"}
                              className="flex items-center space-x-1 w-fit"
                            >
                              <Clock className="w-3 h-3" />
                              <span>{daysRemaining} days</span>
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
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