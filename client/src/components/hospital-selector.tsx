import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { NHS_HOSPITALS, type NHSHospital } from "@/data/nhs-hospitals";

interface HospitalSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function HospitalSelector({
  value = "",
  onValueChange,
  placeholder = "Search and select your NHS hospital/trust...",
  required = false
}: HospitalSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHospitals, setFilteredHospitals] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter hospitals based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredHospitals(NHS_HOSPITALS.slice(0, 50)); // Show first 50 by default
    } else {
      const filtered = NHS_HOSPITALS.filter(hospital =>
        hospital.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredHospitals(filtered.slice(0, 100)); // Limit to 100 results
    }
  }, [searchQuery]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchQuery(inputValue);
    
    // Only allow selection from the valid list
    if (inputValue === "" || NHS_HOSPITALS.includes(inputValue as NHSHospital)) {
      onValueChange(inputValue);
    }
    
    setOpen(true);
  };

  // Handle hospital selection
  const handleHospitalSelect = (hospital: string) => {
    setSearchQuery(hospital);
    onValueChange(hospital);
    setOpen(false);
    inputRef.current?.blur();
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Validate if current value is in the list
  const isValidSelection = value === "" || NHS_HOSPITALS.includes(value as NHSHospital);

  return (
    <div className="space-y-2">
      <Label htmlFor="hospital-selector" className="text-sm font-medium text-gray-700">
        NHS Hospital/Trust {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="hospital-selector"
            type="text"
            value={searchQuery || value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-10",
              !isValidSelection && value !== "" && "border-red-500 focus:border-red-500"
            )}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </Button>
        </div>

        {/* Validation message */}
        {!isValidSelection && value !== "" && (
          <p className="text-xs text-red-600 mt-1">
            Please select a hospital from the provided list
          </p>
        )}

        {/* Dropdown */}
        {open && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {filteredHospitals.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                No hospitals found matching "{searchQuery}"
              </div>
            ) : (
              <div className="py-1">
                {filteredHospitals.map((hospital, index) => (
                  <button
                    key={`${hospital}-${index}`}
                    type="button"
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between",
                      value === hospital && "bg-blue-50 text-blue-600"
                    )}
                    onClick={() => handleHospitalSelect(hospital)}
                  >
                    <span className="truncate">{hospital}</span>
                    {value === hospital && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Select the NHS hospital or trust where the incident occurred. Only valid NHS institutions are accepted.
      </p>
    </div>
  );
}