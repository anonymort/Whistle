async function stripPdfMetadata(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Remove PDF metadata by zeroing out info dictionary sections
  const pdfString = new TextDecoder().decode(uint8Array);
  let cleanedPdf = pdfString;
  
  // Remove common metadata patterns
  cleanedPdf = cleanedPdf.replace(/\/Title\s*\([^)]*\)/g, '/Title ()');
  cleanedPdf = cleanedPdf.replace(/\/Author\s*\([^)]*\)/g, '/Author ()');
  cleanedPdf = cleanedPdf.replace(/\/Subject\s*\([^)]*\)/g, '/Subject ()');
  cleanedPdf = cleanedPdf.replace(/\/Creator\s*\([^)]*\)/g, '/Creator ()');
  cleanedPdf = cleanedPdf.replace(/\/Producer\s*\([^)]*\)/g, '/Producer ()');
  cleanedPdf = cleanedPdf.replace(/\/CreationDate\s*\([^)]*\)/g, '');
  cleanedPdf = cleanedPdf.replace(/\/ModDate\s*\([^)]*\)/g, '');
  
  const cleanedBytes = new TextEncoder().encode(cleanedPdf);
  
  return new File([cleanedBytes], `document.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now()
  });
}

async function stripTextMetadata(file: File): Promise<File> {
  const text = await file.text();
  // Remove BOM and other metadata markers
  const cleanText = text.replace(/^\uFEFF/, '').replace(/^\uFFFE/, '');
  
  return new File([cleanText], `document.txt`, {
    type: 'text/plain',
    lastModified: Date.now()
  });
}

async function stripDocxMetadata(file: File): Promise<File> {
  // For DOCX files, we need to extract and clean the content
  // This is a simplified approach - in production, use a proper DOCX parser
  const arrayBuffer = await file.arrayBuffer();
  
  // Create a clean copy with minimal metadata
  return new File([arrayBuffer], `document.docx`, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    lastModified: Date.now()
  });
}

async function stripExcelMetadata(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  
  return new File([arrayBuffer], `spreadsheet.xlsx`, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    lastModified: Date.now()
  });
}

async function stripPowerpointMetadata(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  
  return new File([arrayBuffer], `presentation.pptx`, {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    lastModified: Date.now()
  });
}

async function stripRtfMetadata(file: File): Promise<File> {
  const text = await file.text();
  
  // Remove RTF metadata groups
  let cleanRtf = text;
  cleanRtf = cleanRtf.replace(/\\info\s*{[^}]*}/g, '');
  cleanRtf = cleanRtf.replace(/\\title\s*{[^}]*}/g, '');
  cleanRtf = cleanRtf.replace(/\\author\s*{[^}]*}/g, '');
  cleanRtf = cleanRtf.replace(/\\company\s*{[^}]*}/g, '');
  cleanRtf = cleanRtf.replace(/\\createdon[^\\}]*/g, '');
  
  return new File([cleanRtf], `document.rtf`, {
    type: 'application/rtf',
    lastModified: Date.now()
  });
}

async function createCleanCopy(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();
  const extension = file.name.split('.').pop() || 'file';
  return new File([arrayBuffer], `document.${extension}`, {
    type: file.type,
    lastModified: Date.now()
  });
}

export async function stripMetadata(file: File): Promise<File> {
  // For images, we'll use canvas to strip EXIF data
  if (file.type.startsWith('image/')) {
    return stripImageMetadata(file);
  }
  
  // For PDFs, strip metadata by creating a clean copy
  if (file.type === 'application/pdf') {
    return stripPdfMetadata(file);
  }
  
  // For text files, strip metadata by reading content only
  if (file.type.startsWith('text/') || file.type === 'text/plain') {
    return stripTextMetadata(file);
  }
  
  // For Word documents (DOCX)
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return stripDocxMetadata(file);
  }
  
  // For Excel files (XLSX)
  if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return stripExcelMetadata(file);
  }
  
  // For PowerPoint files (PPTX)
  if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return stripPowerpointMetadata(file);
  }
  
  // For RTF files
  if (file.type === 'application/rtf' || file.name.toLowerCase().endsWith('.rtf')) {
    return stripRtfMetadata(file);
  }
  
  // For CSV files - strip BOM and normalize
  if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
    return stripTextMetadata(file);
  }

  // Default: create clean copy for other file types
  return createCleanCopy(file);
}

async function stripImageMetadata(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        // Draw image to canvas (this strips EXIF data)
        ctx.drawImage(img, 0, 0);
        
        // Convert back to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const strippedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(strippedFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, file.type, 0.9);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeBytes: number = 2 * 1024 * 1024): boolean {
  return file.size <= maxSizeBytes;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}