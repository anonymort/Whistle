/**
 * NHS Hospital Validation Service
 * Server-side validation for authentic NHS hospital selection
 */

import fs from 'fs';
import path from 'path';

interface NHSHospital {
  id: number;
  name: string;
  searchTerms: string;
}

let nhsHospitals: NHSHospital[] = [];

// Load NHS hospitals data on server startup
function loadNHSHospitals(): void {
  try {
    const csvPath = path.join(__dirname, '../attached_assets/nhs_hospitals.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV lines and extract hospital names
    const lines = csvContent.trim().split('\n');
    nhsHospitals = lines
      .map(line => {
        // Handle CSV with potential quoted values
        const firstField = line.split(',')[0];
        // Remove quotes if present and trim
        return firstField.replace(/^"|"$/g, '').trim();
      })
      .filter(name => name && name.length > 0 && !name.includes('"'))
      .sort()
      .map((name, index) => ({
        id: index + 1,
        name: name,
        searchTerms: name.toLowerCase()
      }));

    console.log(`✓ Loaded ${nhsHospitals.length} authentic NHS hospitals for validation`);
  } catch (error) {
    console.error('Failed to load NHS hospitals data:', error);
    // Initialize with empty array if file loading fails
    nhsHospitals = [];
  }
}

/**
 * Validate that a hospital name is an authentic NHS facility
 */
export function validateNHSHospital(hospitalName: string): boolean {
  if (!hospitalName || typeof hospitalName !== 'string') {
    return false;
  }

  // Ensure hospitals are loaded
  if (nhsHospitals.length === 0) {
    loadNHSHospitals();
  }

  // Check for exact match
  return nhsHospitals.some(hospital => hospital.name === hospitalName.trim());
}

/**
 * Get hospital by exact name match
 */
export function getNHSHospitalByName(hospitalName: string): NHSHospital | undefined {
  if (!hospitalName || typeof hospitalName !== 'string') {
    return undefined;
  }

  // Ensure hospitals are loaded
  if (nhsHospitals.length === 0) {
    loadNHSHospitals();
  }

  return nhsHospitals.find(hospital => hospital.name === hospitalName.trim());
}

/**
 * Get total count of NHS hospitals
 */
export function getNHSHospitalCount(): number {
  if (nhsHospitals.length === 0) {
    loadNHSHospitals();
  }
  return nhsHospitals.length;
}

/**
 * Initialize NHS hospital validation service
 */
export function initializeNHSHospitalValidator(): void {
  loadNHSHospitals();
}

// Auto-initialize when module is imported
initializeNHSHospitalValidator();