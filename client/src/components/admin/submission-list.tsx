import { Eye, MessageSquare, User, Calendar, Flag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import type { Submission, Investigator } from "@shared/schema";

interface SubmissionListProps {
  submissions: Submission[];
  investigators: Investigator[];
  currentPage: number;
  itemsPerPage: number;
  onDecrypt: (submission: Submission) => void;
  onDelete: (id: number) => void;
  onViewNotes: (submission: Submission) => void;
  onAssign: (submissionId: number, investigatorName: string) => void;
  onStatusChange: (submissionId: number, status: string) => void;
  onPriorityChange: (submissionId: number, priority: string) => void;
}

export default function SubmissionList({
  submissions,
  investigators,
  currentPage,
  itemsPerPage,
  onDecrypt,
  onDelete,
  onViewNotes,
  onAssign,
  onStatusChange,
  onPriorityChange
}: SubmissionListProps) {
  const formatDate = (date: Date) => {
    return dayjs(date).format("MMM DD, YYYY [at] HH:mm");
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

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubmissions = submissions.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {paginatedSubmissions.map((submission: Submission) => {
        const assignedInvestigator = investigators.find((investigator: Investigator) => investigator.name === submission.assignedTo);
        const daysRemaining = calculateDaysRemaining(submission.submittedAt);

        return (
          <Card key={submission.id} className="w-full">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                    <Badge className={getPriorityColor(submission.priority)}>
                      {submission.priority}
                    </Badge>
                    <Badge className={getRiskLevelColor(submission.riskLevel)}>
                      {submission.riskLevel?.replace('_', ' ')}
                    </Badge>
                    {daysRemaining <= 7 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {daysRemaining} days left
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <p className="font-medium">{formatDate(submission.submittedAt)}</p>
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
                      <span className="text-muted-foreground">Hash ID:</span>
                      <p className="font-mono text-xs">{submission.sha256Hash.substring(0, 12)}...</p>
                    </div>
                  </div>

                  {submission.assignedTo && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4" />
                      <span className="text-muted-foreground">Assigned to:</span>
                      <span className="font-medium">{submission.assignedTo}</span>
                      {assignedInvestigator && (
                        <span className="text-muted-foreground">({assignedInvestigator.email})</span>
                      )}
                    </div>
                  )}

                  {submission.eventDate && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span className="text-muted-foreground">Event Date:</span>
                      <span className="font-medium">{submission.eventDate}</span>
                      {submission.eventTime && (
                        <span className="font-medium">at {submission.eventTime}</span>
                      )}
                    </div>
                  )}

                  {submission.encryptedFile && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Flag className="w-4 h-4" />
                      <span className="text-green-600 dark:text-green-400 font-medium">File attachment available</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    onClick={() => onDecrypt(submission)}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-1 min-h-[40px] px-3"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">View</span>
                  </Button>
                  
                  <Button
                    onClick={() => onViewNotes(submission)}
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-1 min-h-[40px] px-3"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Notes</span>
                  </Button>
                  
                  <Button
                    onClick={() => onDelete(submission.id)}
                    variant="destructive"
                    size="sm"
                    className="flex items-center justify-center gap-1 min-h-[40px] px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {submissions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No submissions found matching your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}