// Script to process NHS hospitals CSV into TypeScript data structure
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, '../../../attached_assets/nhs_hospitals.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV lines and extract hospital names
const lines = csvContent.trim().split('\n');
const hospitals = lines
  .map(line => line.split(',')[0].trim())
  .filter(name => name && name.length > 0)
  .sort()
  .map((name, index) => ({
    id: index + 1,
    name: name,
    searchTerms: name.toLowerCase()
  }));

// Create TypeScript data structure
const tsContent = `// Auto-generated NHS Hospital data from authentic NHS CSV
// This file contains ${hospitals.length} authentic NHS hospitals and healthcare facilities

export interface NHSHospital {
  id: number;
  name: string;
  searchTerms: string;
}

export const nhsHospitals: NHSHospital[] = ${JSON.stringify(hospitals, null, 2)};

export function searchHospitals(query: string, limit: number = 10): NHSHospital[] {
  if (!query || query.length < 2) return [];
  
  const searchQuery = query.toLowerCase();
  
  return nhsHospitals
    .filter(hospital => 
      hospital.searchTerms.includes(searchQuery)
    )
    .slice(0, limit);
}

export function getHospitalByName(name: string): NHSHospital | undefined {
  return nhsHospitals.find(hospital => hospital.name === name);
}
`;

// Write the TypeScript file
const outputPath = path.join(__dirname, 'nhs-hospitals.ts');
fs.writeFileSync(outputPath, tsContent);

console.log(`Generated NHS hospitals data with ${hospitals.length} entries`);
console.log(`Output written to: ${outputPath}`);