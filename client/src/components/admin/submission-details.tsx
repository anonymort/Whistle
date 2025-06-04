import { useState } from "react";
import { Eye, Download, Shield, AlertTriangle, Calendar, User, Flag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import type { Submission, Investigator } from "@shared/schema";

interface SubmissionDetailsProps {
  submission: Submission | null;
  decryptedData: {
    message: string;
    fileName?: string;
    fileData?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investigators: Investigator[];
  onAssign: (submissionId: number, investigatorName: string) => void;
  onStatusChange: (submissionId: number, status: string) => void;
  onPriorityChange: (submissionId: number, priority: string) => void;
}

export default function SubmissionDetails({
  submission,
  decryptedData,
  open,
  onOpenChange,
  investigators,
  onAssign,
  onStatusChange,
  onPriorityChange
}: SubmissionDetailsProps) {
  const [assignTo, setAssignTo] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');

  if (!submission) return null;

  const formatDate = (date: Date) => {
    return format(new Date(date), "EEEE, MMMM dd, yyyy 'at' HH:mm");
  };

  const calculateDaysRemaining = (submissionDate: Date) => {
    const now = new Date();
    const daysDiff = Math.ceil((now.getTime() - new Date(submissionDate).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 20 - daysDiff);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
      case 'investigating': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very_high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  const daysRemaining = calculateDaysRemaining(submission.submittedAt);
  const assignedInvestigator = investigators.find(inv => inv.name === submission.assignedTo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Submission Details</span>
          </DialogTitle>
          <DialogDescription>
            Case ID: {submission.sha256Hash.substring(0, 12)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getStatusColor(submission.status)}>
              {submission.status}
            </Badge>
            <Badge className={getPriorityColor(submission.priority)}>
              {submission.priority} priority
            </Badge>
            <Badge className={getRiskLevelColor(submission.riskLevel)}>
              {submission.riskLevel?.replace('_', ' ')} risk
            </Badge>
            {daysRemaining <= 7 && (
              <Badge variant="destructive" className="animate-pulse">
                <Clock className="w-3 h-3 mr-1" />
                {daysRemaining} days left
              </Badge>
            )}
          </div>

          {/* Submission Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p className="font-medium">{formatDate(submission.lastUpdated)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Hospital Trust:</span>
                  <p className="font-medium">{submission.hospitalTrust || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{submission.category?.replace('_', ' ') || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact Method:</span>
                  <p className="font-medium">{submission.contactMethod || 'Anonymous'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Full Hash ID:</span>
                  <p className="font-mono text-xs break-all">{submission.sha256Hash}</p>
                </div>
              </div>

              {submission.eventDate && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="text-muted-foreground">Event Date:</span>
                    <span className="font-medium">{submission.eventDate}</span>
                    {submission.eventTime && (
                      <span className="font-medium">at {submission.eventTime}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment and Status Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Assign to Investigator</label>
                  <div className="flex space-x-2 mt-1">
                    <Select value={assignTo} onValueChange={setAssignTo}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select investigator" />
                      </SelectTrigger>
                      <SelectContent>
                        {investigators.filter(inv => inv.isActive === 'true').map((investigator) => (
                          <SelectItem key={investigator.id} value={investigator.name}>
                            {investigator.name} - {investigator.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        if (assignTo) {
                          onAssign(submission.id, assignTo);
                          setAssignTo('');
                        }
                      }}
                      disabled={!assignTo}
                      size="sm"
                    >
                      Assign
                    </Button>
                  </div>
                  {assignedInvestigator && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-3 h-3" />
                        <span>Currently assigned to: <strong>{assignedInvestigator.name}</strong></span>
                      </div>
                      <p className="text-muted-foreground text-xs">{assignedInvestigator.email}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Update Status</label>
                  <div className="flex space-x-2 mt-1">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        if (newStatus) {
                          onStatusChange(submission.id, newStatus);
                          setNewStatus('');
                        }
                      }}
                      disabled={!newStatus}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Update Priority</label>
                  <div className="flex space-x-2 mt-1">
                    <Select value={newPriority} onValueChange={setNewPriority}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        if (newPriority) {
                          onPriorityChange(submission.id, newPriority);
                          setNewPriority('');
                        }
                      }}
                      disabled={!newPriority}
                      size="sm"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decrypted Content */}
          {decryptedData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Decrypted Content</span>
                </CardTitle>
                <CardDescription>
                  This content has been decrypted and is visible only to authorized personnel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Message Content</label>
                    <Textarea
                      value={decryptedData.message}
                      readOnly
                      rows={8}
                      className="mt-1 font-mono text-sm bg-muted"
                    />
                  </div>

                  {decryptedData.fileName && decryptedData.fileData && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Flag className="w-4 h-4" />
                          <span className="font-medium">Attached File</span>
                        </div>
                        <Button
                          onClick={() => {
                            const blob = new Blob([decryptedData.fileData!], { type: 'application/octet-stream' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = decryptedData.fileName!;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        File: {decryptedData.fileName}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!decryptedData && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Content not yet decrypted. Use the "View" button to decrypt and view the submission details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}