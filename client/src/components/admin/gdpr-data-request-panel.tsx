import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Download, Eye, Calendar, Mail, User, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitData } from "@/lib/queryClient";
import { format } from "date-fns";

interface Submission {
  id: number;
  encryptedMessage: string;
  encryptedFile: string | null;
  contactMethod: string | null;
  encryptedContactDetails: string | null;
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

interface GDPRDataRequestPanelProps {
  submissions: Submission[];
  onDecrypt: (submission: Submission) => void;
}

interface SARRequest {
  id: string;
  requestDate: Date;
  requesterName: string;
  requesterEmail: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability';
  searchCriteria: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  dueDate: Date;
  notes: string;
  matchedSubmissions: number[];
}

export default function GDPRDataRequestPanel({ submissions, onDecrypt }: GDPRDataRequestPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<'name' | 'email' | 'hash' | 'trust'>('name');
  const [matchedSubmissions, setMatchedSubmissions] = useState<Submission[]>([]);
  const [sarRequests, setSarRequests] = useState<SARRequest[]>([]);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    requesterName: '',
    requesterEmail: '',
    requestType: 'access' as const,
    searchCriteria: '',
    notes: ''
  });
  
  const { toast } = useToast();

  // Search for submissions containing personal data
  const searchMutation = useMutation({
    mutationFn: async (searchData: { term: string; type: string }) => {
      return await submitData('/api/admin/gdpr/search', searchData);
    },
    onSuccess: (data) => {
      setMatchedSubmissions(data.submissions || []);
      toast({
        title: "Search completed",
        description: `Found ${data.submissions?.length || 0} matching submissions`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export personal data for SAR
  const exportMutation = useMutation({
    mutationFn: async (submissionIds: number[]) => {
      return await submitData('/api/admin/gdpr/export', { submissionIds });
    },
    onSuccess: (data) => {
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export completed",
        description: "Personal data exported successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }
    
    searchMutation.mutate({ term: searchTerm, type: searchType });
  };

  const handleExport = (submissionIds: number[]) => {
    if (submissionIds.length === 0) {
      toast({
        title: "No submissions selected",
        description: "Please select submissions to export",
        variant: "destructive",
      });
      return;
    }
    
    exportMutation.mutate(submissionIds);
  };

  const createSARRequest = () => {
    if (!newRequest.requesterName || !newRequest.requesterEmail) {
      toast({
        title: "Required fields missing",
        description: "Please fill in requester name and email",
        variant: "destructive",
      });
      return;
    }

    const request: SARRequest = {
      id: `SAR-${Date.now()}`,
      requestDate: new Date(),
      ...newRequest,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      matchedSubmissions: []
    };

    setSarRequests(prev => [...prev, request]);
    setNewRequest({
      requesterName: '',
      requesterEmail: '',
      requestType: 'access',
      searchCriteria: '',
      notes: ''
    });
    setShowNewRequestForm(false);

    toast({
      title: "SAR request created",
      description: `Request ${request.id} has been logged`,
    });
  };

  return (
    <div className="space-y-6">
      {/* SAR Request Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sarRequests.filter(r => r.status !== 'completed').length}</div>
            <p className="text-xs text-muted-foreground">Pending & Processing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {sarRequests.filter(r => {
                const daysUntilDue = Math.ceil((r.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return daysUntilDue <= 7 && r.status !== 'completed';
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Urgent attention needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Completed (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sarRequests.filter(r => r.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* New SAR Request */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Subject Access Requests</CardTitle>
              <CardDescription>
                Manage GDPR Article 15 requests for personal data access
              </CardDescription>
            </div>
            <Button onClick={() => setShowNewRequestForm(!showNewRequestForm)}>
              {showNewRequestForm ? 'Cancel' : 'New Request'}
            </Button>
          </div>
        </CardHeader>
        
        {showNewRequestForm && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Requester Name</label>
                  <Input
                    value={newRequest.requesterName}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, requesterName: e.target.value }))}
                    placeholder="John Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Requester Email</label>
                  <Input
                    type="email"
                    value={newRequest.requesterEmail}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, requesterEmail: e.target.value }))}
                    placeholder="john.smith@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Request Type</label>
                <Select 
                  value={newRequest.requestType} 
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, requestType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="access">Data Access (Article 15)</SelectItem>
                    <SelectItem value="rectification">Data Rectification (Article 16)</SelectItem>
                    <SelectItem value="erasure">Data Erasure (Article 17)</SelectItem>
                    <SelectItem value="portability">Data Portability (Article 20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search Criteria</label>
                <Input
                  value={newRequest.searchCriteria}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, searchCriteria: e.target.value }))}
                  placeholder="Name, email, staff ID, or other identifying information"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details about the request..."
                  className="h-20"
                />
              </div>

              <Button onClick={createSARRequest} className="w-full">
                Create SAR Request
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Personal Data Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Personal Data Search</span>
          </CardTitle>
          <CardDescription>
            Search encrypted submissions for personal data matching an individual's request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={searchType} onValueChange={(value) => setSearchType(value as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Search by Name</SelectItem>
                <SelectItem value="email">Search by Email</SelectItem>
                <SelectItem value="hash">Search by Hash</SelectItem>
                <SelectItem value="trust">Search by Trust</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Enter ${searchType}...`}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            
            <Button 
              onClick={handleSearch} 
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {matchedSubmissions.length > 0 && (
            <div className="space-y-4">
              <Separator />
              
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Search Results ({matchedSubmissions.length})</h3>
                <Button
                  onClick={() => handleExport(matchedSubmissions.map(s => s.id))}
                  disabled={exportMutation.isPending}
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportMutation.isPending ? 'Exporting...' : 'Export All'}
                </Button>
              </div>

              <div className="space-y-2">
                {matchedSubmissions.map((submission) => (
                  <Card key={submission.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">ID: {submission.id}</Badge>
                          <Badge variant={submission.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {submission.priority}
                          </Badge>
                          <Badge variant="outline">{submission.status}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Submitted: {format(new Date(submission.submittedAt), 'PPP')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <span>Hash: {submission.sha256Hash.substring(0, 16)}...</span>
                          </div>
                          
                          {submission.hospitalTrust && (
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span>{submission.hospitalTrust}</span>
                            </div>
                          )}
                          
                          {submission.contactMethod && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>Contact: {submission.contactMethod}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDecrypt(submission)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Decrypt
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleExport([submission.id])}
                          disabled={exportMutation.isPending}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GDPR Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>GDPR Compliance Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Article 15 - Right of Access</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Respond within 30 days of request</li>
                <li>• Provide copy of personal data being processed</li>
                <li>• Include purposes of processing</li>
                <li>• Specify retention periods</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Data Export Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Structured, machine-readable format</li>
                <li>• Include all personal data categories</li>
                <li>• Verify requester identity before export</li>
                <li>• Log all access and export activities</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Always verify the identity of the data subject before providing 
              personal data. Maintain detailed logs of all SAR activities for audit compliance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}