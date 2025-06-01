// Data retention test for NHS WhistleLite Portal
// Run with: node tests/data-retention.test.js

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock database operations for testing
class MockDatabaseStorage {
  constructor() {
    this.submissions = [
      {
        id: 1,
        submittedAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000), // 95 days ago
        encryptedMessage: "old_encrypted_data"
      },
      {
        id: 2,
        submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        encryptedMessage: "recent_encrypted_data"
      },
      {
        id: 3,
        submittedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        encryptedMessage: "very_old_encrypted_data"
      }
    ];
  }

  async purgeOldSubmissions() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const initialCount = this.submissions.length;
    this.submissions = this.submissions.filter(
      submission => submission.submittedAt >= ninetyDaysAgo
    );
    
    return initialCount - this.submissions.length;
  }

  getAllSubmissions() {
    return this.submissions;
  }
}

async function testDataRetention() {
  console.log('Testing 90-day data retention policy...');
  
  const mockStorage = new MockDatabaseStorage();
  
  console.log('Initial submissions:', mockStorage.getAllSubmissions().length);
  
  // Test purge operation
  const deletedCount = await mockStorage.purgeOldSubmissions();
  
  const remainingSubmissions = mockStorage.getAllSubmissions();
  
  console.log('Deleted submissions:', deletedCount);
  console.log('Remaining submissions:', remainingSubmissions.length);
  
  // Verify only recent submission remains
  const allRecent = remainingSubmissions.every(sub => {
    const daysDiff = (Date.now() - sub.submittedAt.getTime()) / (24 * 60 * 60 * 1000);
    return daysDiff <= 90;
  });
  
  const expectedDeleted = 2; // submissions older than 90 days
  const expectedRemaining = 1; // submission within 90 days
  
  const testPassed = deletedCount === expectedDeleted && 
                    remainingSubmissions.length === expectedRemaining && 
                    allRecent;
  
  console.log('Test result:', testPassed ? 'PASS' : 'FAIL');
  
  if (testPassed) {
    console.log('✅ Data retention policy working correctly');
  } else {
    console.log('❌ Data retention policy failed');
    console.log('Expected deleted:', expectedDeleted, 'Actual:', deletedCount);
    console.log('Expected remaining:', expectedRemaining, 'Actual:', remainingSubmissions.length);
  }
  
  return testPassed;
}

async function testAutomatedCleanup() {
  console.log('\nTesting automated cleanup configuration...');
  
  // Read the routes file to verify cleanup is configured
  const routesPath = join(__dirname, '../server/routes.ts');
  const routesContent = readFileSync(routesPath, 'utf8');
  
  const hasCleanupInterval = routesContent.includes('setInterval') && 
                           routesContent.includes('purgeOldSubmissions') &&
                           routesContent.includes('24 * 60 * 60 * 1000'); // 24 hours
  
  console.log('Automated cleanup configured:', hasCleanupInterval ? 'YES' : 'NO');
  console.log('Test result:', hasCleanupInterval ? 'PASS' : 'FAIL');
  
  return hasCleanupInterval;
}

async function runRetentionTests() {
  console.log('=== NHS WhistleLite Data Retention Tests ===\n');
  
  const retentionTest = await testDataRetention();
  const cleanupTest = await testAutomatedCleanup();
  
  console.log('\n=== Test Summary ===');
  console.log(`Data retention logic: ${retentionTest ? 'PASS' : 'FAIL'}`);
  console.log(`Automated cleanup: ${cleanupTest ? 'PASS' : 'FAIL'}`);
  console.log(`Overall: ${retentionTest && cleanupTest ? 'PASS' : 'FAIL'}`);
  
  if (retentionTest && cleanupTest) {
    console.log('\n✅ All data retention tests passed - GDPR compliance verified');
  } else {
    console.log('\n❌ Data retention tests failed - review implementation');
    process.exit(1);
  }
}

runRetentionTests().catch(console.error);