import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl } from "@/components/ui/form";
import { searchHospitals, getHospitalByName, type NHSHospital } from "@/data/nhs-hospitals";
import { cn } from "@/lib/utils";

interface NHSHospitalSearchProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function NHSHospitalSearch({ 
  value, 
  onValueChange, 
  placeholder = "Search NHS hospitals and trusts...",
  disabled = false 
}: NHSHospitalSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NHSHospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<NHSHospital | null>(null);

  // Initialize selected hospital from value
  useEffect(() => {
    if (value) {
      const hospital = getHospitalByName(value);
      setSelectedHospital(hospital || null);
    } else {
      setSelectedHospital(null);
    }
  }, [value]);

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchHospitals(searchQuery, 15);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelect = (hospital: NHSHospital) => {
    setSelectedHospital(hospital);
    onValueChange(hospital.name);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSelectedHospital(null);
    onValueChange("");
    setSearchQuery("");
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedHospital && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">
                  {selectedHospital ? selectedHospital.name : placeholder}
                </span>
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Type to search 736 NHS hospitals..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {searchQuery.length < 2 ? (
                <CommandEmpty>Type at least 2 characters to search NHS hospitals</CommandEmpty>
              ) : searchResults.length === 0 ? (
                <CommandEmpty>
                  No NHS hospitals found matching "{searchQuery}". 
                  Please check spelling or try a different term.
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchResults.map((hospital) => (
                    <CommandItem
                      key={hospital.id}
                      value={hospital.name}
                      onSelect={() => handleSelect(hospital)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedHospital?.id === hospital.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{hospital.name}</span>
                        <span className="text-xs text-muted-foreground">
                          NHS Hospital/Trust
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedHospital && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>✓ Authentic NHS facility selected</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-auto p-1 text-xs"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}