import { createHash } from 'crypto';
import { auditLogger, AUDIT_ACTIONS } from './audit';

export interface VirusScanResult {
  isClean: boolean;
  threatName?: string;
  scanEngine: string;
  scanDate: Date;
  fileHash: string;
}

interface MalwareSignature {
  hash: string;
  name: string;
  severity: 'high' | 'medium' | 'low';
}

// Known malware signatures database (subset for demonstration)
const MALWARE_SIGNATURES: MalwareSignature[] = [
  { hash: 'd41d8cd98f00b204e9800998ecf8427e', name: 'Empty_File_Anomaly', severity: 'low' },
  { hash: '5d41402abc4b2a76b9719d911017c592', name: 'Test_Malware_Sample', severity: 'high' },
  // Additional signatures would be loaded from threat intelligence feeds
];

// Common malware file patterns
const SUSPICIOUS_PATTERNS = [
  /\.exe$/i,
  /\.scr$/i,
  /\.bat$/i,
  /\.cmd$/i,
  /\.com$/i,
  /\.pif$/i,
  /\.vbs$/i,
  /\.js$/i,
  /\.jar$/i,
  /\.app$/i,
];

// Suspicious content patterns (hex signatures)
const MALWARE_HEX_SIGNATURES = [
  '4D5A', // PE executable header
  '7F454C46', // ELF executable header
  'CAFEBABE', // Java class file
  'D0CF11E0A1B11AE1', // Microsoft Office compound document
];

export class VirusScanner {
  private scanCount = 0;
  private detectionCount = 0;

  async scanFile(fileBuffer: Buffer, fileName: string, userId?: string): Promise<VirusScanResult> {
    this.scanCount++;
    const fileHash = this.calculateFileHash(fileBuffer);
    const scanDate = new Date();

    // Multi-layer scanning approach
    const results = await Promise.all([
      this.signatureBasedScan(fileBuffer, fileHash),
      this.heuristicScan(fileBuffer, fileName),
      this.behaviorAnalysis(fileBuffer, fileName),
    ]);

    const isClean = results.every(result => result.isClean);
    const threatName = results.find(result => !result.isClean)?.threatName;

    if (!isClean) {
      this.detectionCount++;
      
      auditLogger.log({
        userId: userId || 'system',
        action: AUDIT_ACTIONS.SECURITY_THREAT_DETECTED,
        resource: 'file_upload',
        details: {
          fileName,
          fileHash,
          threatName,
          scanEngine: 'WhistleLite_Scanner',
          detectionMethod: results.map(r => r.scanEngine).join(', ')
        }
      });
    }

    const scanResult: VirusScanResult = {
      isClean,
      threatName,
      scanEngine: 'WhistleLite_Multi_Engine',
      scanDate,
      fileHash
    };

    auditLogger.log({
      userId: userId || 'system',
      action: 'file_virus_scan',
      resource: 'security_scan',
      details: {
        fileName,
        fileHash,
        isClean,
        scanEngine: scanResult.scanEngine,
        totalScans: this.scanCount,
        totalDetections: this.detectionCount
      }
    });

    return scanResult;
  }

  private calculateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async signatureBasedScan(buffer: Buffer, fileHash: string): Promise<{ isClean: boolean; threatName?: string; scanEngine: string }> {
    // Check against known malware signatures
    const matchedSignature = MALWARE_SIGNATURES.find(sig => sig.hash === fileHash);
    
    if (matchedSignature) {
      return {
        isClean: false,
        threatName: matchedSignature.name,
        scanEngine: 'Signature_Scanner'
      };
    }

    return {
      isClean: true,
      scanEngine: 'Signature_Scanner'
    };
  }

  private async heuristicScan(buffer: Buffer, fileName: string): Promise<{ isClean: boolean; threatName?: string; scanEngine: string }> {
    // Check file extension against suspicious patterns
    const hasSuspiciousExtension = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(fileName));
    
    if (hasSuspiciousExtension) {
      return {
        isClean: false,
        threatName: 'Suspicious_File_Extension',
        scanEngine: 'Heuristic_Scanner'
      };
    }

    // Check for executable headers in non-executable files
    const hexString = buffer.toString('hex', 0, Math.min(20, buffer.length)).toUpperCase();
    const hasMaliciousHeader = MALWARE_HEX_SIGNATURES.some(sig => hexString.startsWith(sig));

    if (hasMaliciousHeader) {
      return {
        isClean: false,
        threatName: 'Executable_Header_In_Document',
        scanEngine: 'Heuristic_Scanner'
      };
    }

    // Check for suspicious content patterns
    const contentString = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
    
    // Look for script injection patterns
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
    ];

    const hasScriptInjection = scriptPatterns.some(pattern => pattern.test(contentString));
    
    if (hasScriptInjection && !fileName.toLowerCase().endsWith('.html')) {
      return {
        isClean: false,
        threatName: 'Script_Injection_Detected',
        scanEngine: 'Heuristic_Scanner'
      };
    }

    return {
      isClean: true,
      scanEngine: 'Heuristic_Scanner'
    };
  }

  private async behaviorAnalysis(buffer: Buffer, fileName: string): Promise<{ isClean: boolean; threatName?: string; scanEngine: string }> {
    // Analyze file size anomalies
    if (buffer.length === 0) {
      return {
        isClean: false,
        threatName: 'Empty_File_Anomaly',
        scanEngine: 'Behavior_Analyzer'
      };
    }

    // Check for extremely large files that might be zip bombs
    if (buffer.length > 100 * 1024 * 1024) { // 100MB
      return {
        isClean: false,
        threatName: 'Oversized_File_Risk',
        scanEngine: 'Behavior_Analyzer'
      };
    }

    // Check for suspicious file name patterns
    const suspiciousNamePatterns = [
      /^\.+/, // Files starting with dots (hidden files)
      /[<>:"|?*]/, // Invalid filename characters
      /\.{2,}/, // Multiple consecutive dots
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i, // Windows reserved names
    ];

    const hasSuspiciousName = suspiciousNamePatterns.some(pattern => pattern.test(fileName));
    
    if (hasSuspiciousName) {
      return {
        isClean: false,
        threatName: 'Suspicious_Filename_Pattern',
        scanEngine: 'Behavior_Analyzer'
      };
    }

    // Check entropy for packed/encrypted content
    const entropy = this.calculateEntropy(buffer);
    if (entropy > 7.5) { // High entropy might indicate packed malware
      return {
        isClean: false,
        threatName: 'High_Entropy_Suspicious_Content',
        scanEngine: 'Behavior_Analyzer'
      };
    }

    return {
      isClean: true,
      scanEngine: 'Behavior_Analyzer'
    };
  }

  private calculateEntropy(buffer: Buffer): number {
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < buffer.length; i++) {
      frequencies[buffer[i]]++;
    }

    let entropy = 0;
    const length = buffer.length;

    for (let i = 0; i < 256; i++) {
      if (frequencies[i] > 0) {
        const p = frequencies[i] / length;
        entropy -= p * Math.log2(p);
      }
    }

    return entropy;
  }

  // For integration with external virus scanning APIs
  async scanWithExternalService(buffer: Buffer, fileName: string, apiKey?: string): Promise<VirusScanResult> {
    if (!apiKey) {
      // Return local scan results if no external API key provided
      return this.scanFile(buffer, fileName);
    }

    try {
      // This would integrate with services like VirusTotal, Malware Bazaar, etc.
      // Implementation depends on specific service chosen
      
      // For now, return enhanced local scanning
      return this.scanFile(buffer, fileName);
    } catch (error) {
      console.error('External virus scan failed, falling back to local scan:', error);
      return this.scanFile(buffer, fileName);
    }
  }

  getStatistics() {
    return {
      totalScans: this.scanCount,
      totalDetections: this.detectionCount,
      detectionRate: this.scanCount > 0 ? (this.detectionCount / this.scanCount) * 100 : 0
    };
  }
}

export const virusScanner = new VirusScanner();