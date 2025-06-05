import { useState } from "react";
import { MessageSquare, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import dayjs from "dayjs";

interface CaseNote {
  id: number;
  submissionId: number;
  note: string;
  createdBy: string;
  isInternal: string;
  noteType: string;
  createdAt: Date;
}

interface Submission {
  id: number;
  sha256Hash: string;
  hospitalTrust: string | null;
  status: string;
}

interface CaseNotesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  caseNotes: CaseNote[];
  onAddNote: (data: {
    submissionId: number;
    note: string;
    noteType: string;
    isInternal: string;
  }) => void;
  onDeleteNote: (noteId: number) => void;
  isAdding: boolean;
  isDeleting: boolean;
}

export default function CaseNotesPanel({
  isOpen,
  onClose,
  submission,
  caseNotes,
  onAddNote,
  onDeleteNote,
  isAdding,
  isDeleting
}: CaseNotesPanelProps) {
  const [newNote, setNewNote] = useState({
    note: '',
    noteType: 'investigation',
    isInternal: 'false'
  });
  const [showInternalNotes, setShowInternalNotes] = useState(true);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission || !newNote.note.trim()) return;

    onAddNote({
      submissionId: submission.id,
      ...newNote
    });

    setNewNote({
      note: '',
      noteType: 'investigation',
      isInternal: 'false'
    });
  };

  const filteredNotes = caseNotes.filter(note => 
    showInternalNotes || note.isInternal === 'false'
  );

  const getNoteTypeColor = (noteType: string) => {
    switch (noteType) {
      case 'investigation': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
      case 'communication': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'decision': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
      case 'evidence': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatNoteType = (noteType: string) => {
    return noteType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Case Notes</span>
          </DialogTitle>
          <DialogDescription>
            {submission && (
              <>
                Case ID: {submission.sha256Hash.substring(0, 12)}... | 
                Trust: {submission.hospitalTrust || 'Not specified'} | 
                Status: {submission.status}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Note Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Note</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <Label htmlFor="note-content">Note Content</Label>
                  <Textarea
                    id="note-content"
                    value={newNote.note}
                    onChange={(e) => setNewNote(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Enter case note details..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="note-type">Note Type</Label>
                    <Select value={newNote.noteType} onValueChange={(value) => setNewNote(prev => ({ ...prev, noteType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select note type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investigation">Investigation</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="decision">Decision</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="is-internal"
                      checked={newNote.isInternal === 'true'}
                      onCheckedChange={(checked) => setNewNote(prev => ({ 
                        ...prev, 
                        isInternal: checked ? 'true' : 'false' 
                      }))}
                    />
                    <Label htmlFor="is-internal">Internal note (not visible to whistleblower)</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isAdding || !newNote.note.trim()}>
                    {isAdding ? "Adding..." : "Add Note"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notes List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Case Notes ({filteredNotes.length})</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInternalNotes(!showInternalNotes)}
                    className="flex items-center space-x-1"
                  >
                    {showInternalNotes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{showInternalNotes ? 'Hide' : 'Show'} Internal</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getNoteTypeColor(note.noteType)}>
                          {formatNoteType(note.noteType)}
                        </Badge>
                        {note.isInternal === 'true' && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteNote(note.id)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {note.note}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                      <span>By: {note.createdBy}</span>
                      <span>{dayjs(note.createdAt).format("MMM DD, YYYY [at] HH:mm")}</span>
                    </div>
                  </div>
                ))}

                {filteredNotes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {caseNotes.length === 0 
                      ? "No notes have been added to this case yet." 
                      : "No notes match the current filter."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}