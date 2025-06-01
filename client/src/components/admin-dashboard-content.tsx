import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shield, Users, FileText, Trash2, Eye, Clock, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface Submission {
  id: number;
  encryptedMessage: string;
  encryptedFile: string | null;
  replyEmail: string | null;
  sha256Hash: string;
  submittedAt: Date;
}

interface AdminDashboardContentProps {
  onLogout: () => void;
}

export default function AdminDashboardContent({ onLogout }: AdminDashboardContentProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
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

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              All submissions are encrypted and will be automatically deleted after 90 days
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      <th className="text-left py-3 px-4">Submitted</th>
                      <th className="text-left py-3 px-4">Has File</th>
                      <th className="text-left py-3 px-4">Reply Email</th>
                      <th className="text-left py-3 px-4">Days Remaining</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission: Submission) => {
                      const daysRemaining = calculateDaysRemaining(submission.submittedAt);
                      return (
                        <tr key={submission.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono text-sm">#{submission.id}</td>
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
                                    <label className="text-sm font-medium text-gray-700">Encrypted Message:</label>
                                    <p className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 break-all max-h-32 overflow-y-auto">
                                      {submission.encryptedMessage.substring(0, 200)}...
                                    </p>
                                  </div>
                                  {submission.encryptedFile && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-700">Encrypted File:</label>
                                      <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded mt-1">
                                        File attached (encrypted, {submission.encryptedFile.length} characters)
                                      </p>
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}