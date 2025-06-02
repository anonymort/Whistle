import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  LogOut, 
  Calendar, 
  AlertTriangle, 
  MessageSquare,
  Eye,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

interface InvestigatorDashboardProps {
  investigator: any;
  onLogout: () => void;
}

export default function InvestigatorDashboard({ investigator, onLogout }: InvestigatorDashboardProps) {
  const [selectedCase, setSelectedCase] = useState<Submission | null>(null);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [caseNotes, setCaseNotes] = useState<{[key: number]: CaseNote[]}>({});
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const { toast } = useToast();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['/api/investigator/submissions'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/investigator/submissions");
      return response.json();
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
    onSuccess: (newNote, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/submission', variables.submissionId, 'notes'] });
      setNewNote('');
      toast({
        title: "Note Added",
        description: "Case note has been added successfully.",
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

  const handleDecrypt = async (submission: Submission) => {
    try {
      const response = await apiRequest("POST", "/api/admin/decrypt", {
        encryptedData: submission.encryptedMessage
      });
      const result = await response.json();
      setDecryptedData(result);
      setSelectedCase(submission);
    } catch (error) {
      toast({
        title: "Decryption Failed",
        description: "Unable to decrypt case data.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'new': 'default',
      'under_review': 'secondary', 
      'investigating': 'outline',
      'resolved': 'secondary',
      'closed': 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'critical': 'destructive',
      'high': 'outline',
      'medium': 'secondary',
      'low': 'default'
    };
    return <Badge variant={variants[priority] || 'default'}>{priority}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Investigator Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {investigator.name}</p>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cases List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Assigned Cases ({submissions.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Cases assigned to you for investigation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No cases currently assigned to you.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((submission: Submission) => (
                        <div 
                          key={submission.id} 
                          className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedCase?.id === submission.id ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => handleDecrypt(submission)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">Case #{submission.id}</h3>
                              <p className="text-sm text-gray-600">
                                {submission.hospitalTrust || 'Trust not specified'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(submission.status)}
                              {getPriorityBadge(submission.priority)}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(submission.submittedAt)}
                            </span>
                            {submission.priority === 'critical' && (
                              <span className="flex items-center text-red-600">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Critical
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Case Details */}
            <div>
              {selectedCase ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="h-5 w-5" />
                      <span>Case #{selectedCase.id}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {decryptedData && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Message</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border">
                            <p className="text-sm whitespace-pre-wrap">{decryptedData.message}</p>
                          </div>
                        </div>
                        
                        {decryptedData.fileContent && (
                          <div>
                            <Label className="text-sm font-medium">Attached File</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded border">
                              <p className="text-xs text-gray-600">File attached (encrypted)</p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label>Status</Label>
                            <div className="mt-1">{getStatusBadge(selectedCase.status)}</div>
                          </div>
                          <div>
                            <Label>Priority</Label>
                            <div className="mt-1">{getPriorityBadge(selectedCase.priority)}</div>
                          </div>
                        </div>

                        {selectedCase.replyEmail && (
                          <div>
                            <Label>Reply Email</Label>
                            <p className="text-sm text-gray-600 mt-1">{selectedCase.replyEmail}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Add Note Section */}
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium">Add Investigation Note</Label>
                      <div className="space-y-3 mt-2">
                        <Select value={noteType} onValueChange={setNoteType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Note type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="investigation">Investigation</SelectItem>
                            <SelectItem value="communication">Communication</SelectItem>
                            <SelectItem value="decision">Decision</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Enter your investigation notes..."
                          rows={3}
                        />
                        
                        <Button
                          onClick={() => {
                            if (selectedCase && newNote.trim()) {
                              addNoteMutation.mutate({
                                submissionId: selectedCase.id,
                                note: newNote,
                                noteType
                              });
                            }
                          }}
                          disabled={addNoteMutation.isPending || !newNote.trim()}
                          size="sm"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Select a case to view details</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}