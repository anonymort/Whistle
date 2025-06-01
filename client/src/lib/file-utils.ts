export async function stripMetadata(file: File): Promise<File> {
  // For images, we'll use canvas to strip EXIF data
  if (file.type.startsWith('image/')) {
    return stripImageMetadata(file);
  }
  
  // For other file types, return as-is (in a real implementation, 
  // you'd use specific libraries for each file type)
  return file;
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
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw image to canvas (this strips EXIF data)
      ctx.drawImage(img, 0, 0);
      
      // Convert back to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create new file without metadata
          const strippedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(strippedFile);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, file.type, 0.9); // Use 0.9 quality for compression
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
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
