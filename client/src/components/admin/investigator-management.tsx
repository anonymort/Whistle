import { useState } from "react";
import { Users, Edit3, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Investigator {
  id: number;
  name: string;
  email: string;
  department: string | null;
  isActive: string;
}

interface InvestigatorManagementProps {
  investigators: Investigator[];
  onCreateInvestigator: (data: {
    name: string;
    email: string;
    department: string;
    password: string;
  }) => void;
  onUpdateInvestigator: (id: number, data: {
    name: string;
    email: string;
    department: string;
    isActive: string;
  }) => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export default function InvestigatorManagement({
  investigators,
  onCreateInvestigator,
  onUpdateInvestigator,
  isCreating,
  isUpdating
}: InvestigatorManagementProps) {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInvestigator, setEditingInvestigator] = useState<Investigator | null>(null);
  
  const [newInvestigator, setNewInvestigator] = useState({
    name: '',
    email: '',
    department: '',
    password: ''
  });

  const [editData, setEditData] = useState({
    name: '',
    email: '',
    department: '',
    isActive: ''
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestigator.name || !newInvestigator.email || !newInvestigator.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onCreateInvestigator(newInvestigator);
    setNewInvestigator({ name: '', email: '', department: '', password: '' });
    setCreateDialogOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestigator || !editData.name || !editData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onUpdateInvestigator(editingInvestigator.id, editData);
    setEditDialogOpen(false);
    setEditingInvestigator(null);
  };

  const openEditDialog = (investigator: Investigator) => {
    setEditingInvestigator(investigator);
    setEditData({
      name: investigator.name,
      email: investigator.email,
      department: investigator.department || '',
      isActive: investigator.isActive
    });
    setEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Investigator Management</span>
            </CardTitle>
            <CardDescription>
              Manage investigators who can be assigned to cases
            </CardDescription>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Add Investigator</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Investigator</DialogTitle>
                <DialogDescription>
                  Add a new investigator who can be assigned to cases
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Name *</Label>
                  <Input
                    id="create-name"
                    value={newInvestigator.name}
                    onChange={(e) => setNewInvestigator(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-email">Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={newInvestigator.email}
                    onChange={(e) => setNewInvestigator(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-department">Department</Label>
                  <Input
                    id="create-department"
                    value={newInvestigator.department}
                    onChange={(e) => setNewInvestigator(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Department or team"
                  />
                </div>
                
                <div>
                  <Label htmlFor="create-password">Password *</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={newInvestigator.password}
                    onChange={(e) => setNewInvestigator(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Secure password"
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Investigator"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {investigators.map((investigator: Investigator) => (
            <div key={investigator.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium">{investigator.name}</h4>
                  <Badge variant={investigator.isActive === 'true' ? 'default' : 'secondary'}>
                    {investigator.isActive === 'true' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{investigator.email}</p>
                {investigator.department && (
                  <p className="text-sm text-muted-foreground">{investigator.department}</p>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(investigator)}
                className="flex items-center space-x-1"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </Button>
            </div>
          ))}
          
          {investigators.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No investigators found. Create one to get started.
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Investigator</DialogTitle>
            <DialogDescription>
              Update investigator information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={editData.department}
                onChange={(e) => setEditData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Department or team"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editData.isActive} onValueChange={(value) => setEditData(prev => ({ ...prev, isActive: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update Investigator"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}