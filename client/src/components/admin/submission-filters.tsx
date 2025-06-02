import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubmissionFiltersProps {
  statusFilter: string[];
  priorityFilter: string[];
  trustFilter: string[];
  categoryFilter: string[];
  sortBy: string;
  availableTrusts: string[];
  onStatusFilterChange: (filter: string[]) => void;
  onPriorityFilterChange: (filter: string[]) => void;
  onTrustFilterChange: (filter: string[]) => void;
  onCategoryFilterChange: (filter: string[]) => void;
  onSortByChange: (sortBy: string) => void;
  onClearFilters: () => void;
}

export default function SubmissionFilters({
  statusFilter,
  priorityFilter,
  trustFilter,
  categoryFilter,
  sortBy,
  availableTrusts,
  onStatusFilterChange,
  onPriorityFilterChange,
  onTrustFilterChange,
  onCategoryFilterChange,
  onSortByChange,
  onClearFilters
}: SubmissionFiltersProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const handleStatusChange = (status: string, checked: boolean) => {
    if (checked) {
      onStatusFilterChange([...statusFilter, status]);
    } else {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    }
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    if (checked) {
      onPriorityFilterChange([...priorityFilter, priority]);
    } else {
      onPriorityFilterChange(priorityFilter.filter(p => p !== priority));
    }
  };

  const handleTrustChange = (trust: string, checked: boolean) => {
    if (checked) {
      onTrustFilterChange([...trustFilter, trust]);
    } else {
      onTrustFilterChange(trustFilter.filter(t => t !== trust));
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      onCategoryFilterChange([...categoryFilter, category]);
    } else {
      onCategoryFilterChange(categoryFilter.filter(c => c !== category));
    }
  };

  const activeFiltersCount = statusFilter.length + priorityFilter.length + trustFilter.length + categoryFilter.length;

  return (
    <div className="flex items-center space-x-2">
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-1 sm:space-x-2 text-sm">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-primary text-white text-xs rounded-full px-1 min-w-[16px] text-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 sm:w-80 p-3 sm:p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearFilters();
                  setFilterOpen(false);
                }}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="space-y-2 mt-1">
                {['new', 'investigating', 'resolved', 'closed'].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={statusFilter.includes(status)}
                      onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm capitalize">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-sm font-medium">Priority</label>
              <div className="space-y-2 mt-1">
                {['low', 'medium', 'high', 'critical'].map((priority) => (
                  <div key={priority} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={priorityFilter.includes(priority)}
                      onCheckedChange={(checked) => handlePriorityChange(priority, checked as boolean)}
                    />
                    <label htmlFor={`priority-${priority}`} className="text-sm capitalize">
                      {priority}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium">Category</label>
              <div className="space-y-2 mt-1">
                {['patient_safety', 'clinical_governance', 'infection_control', 'medication_safety', 'equipment_safety', 'staffing_safety'].map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={categoryFilter.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                    />
                    <label htmlFor={`category-${category}`} className="text-sm">
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Filter */}
            <div>
              <label className="text-sm font-medium">Hospital Trust</label>
              <div className="max-h-32 overflow-y-auto space-y-2 mt-1">
                {availableTrusts.slice(0, 10).map((trust) => (
                  <div key={trust} className="flex items-center space-x-2">
                    <Checkbox
                      id={`trust-${trust}`}
                      checked={trustFilter.includes(trust)}
                      onCheckedChange={(checked) => handleTrustChange(trust, checked as boolean)}
                    />
                    <label htmlFor={`trust-${trust}`} className="text-sm">
                      {trust}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Select value={sortBy} onValueChange={onSortByChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="priority">Priority</SelectItem>
          <SelectItem value="status">Status</SelectItem>
          <SelectItem value="trust">Hospital Trust</SelectItem>
        </SelectContent>
      </Select>

      {activeFiltersCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="flex items-center space-x-1 text-xs"
        >
          <X className="w-3 h-3" />
          <span>Clear</span>
        </Button>
      )}
    </div>
  );
}