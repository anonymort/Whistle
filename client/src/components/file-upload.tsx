import { useState, useRef } from "react";
import { CloudUpload, File, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { stripMetadata } from "@/lib/file-utils";
import { encryptData } from "@/lib/encryption";

interface FileUploadProps {
  onFileProcessed: (file: File, encryptedData: string) => void;
  onFileRemoved: () => void;
  selectedFile: File | null;
}

export default function FileUpload({ onFileProcessed, onFileRemoved, selectedFile }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, JPG, PNG, or DOCX files only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Strip metadata from file
      const processedFile = await stripMetadata(file);
      
      // Read file as base64 for transmission
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 data (remove data:mime;base64, prefix)
          const base64 = result.split(',')[1];
          if (base64) {
            resolve(base64);
          } else {
            reject(new Error('Failed to extract base64 data'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(processedFile);
      });

      // Create file info object with metadata (no encryption, just metadata stripped)
      const fileInfo = {
        filename: processedFile.name,
        mimetype: processedFile.type,
        size: processedFile.size,
        data: base64Data
      };

      // Send as JSON string (HTTPS provides encryption)
      const fileData = JSON.stringify(fileInfo);
      
      onFileProcessed(file, fileData);

      toast({
        title: "File Processed",
        description: "File has been encrypted and metadata removed.",
      });

    } catch (error) {
      console.error("File processing error:", error);
      toast({
        title: "Processing Failed",
        description: "Unable to process file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemoved();
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  if (selectedFile) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <File className="w-5 h-5 text-gray-400 transition-transform duration-200 hover:scale-110" />
            <span className="text-sm text-gray-700 font-medium">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">({formatFileSize(selectedFile.size)})</span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="text-error hover:text-red-700 transition-all duration-200 hover:scale-110 hover:rotate-90"
            disabled={isProcessing}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {isProcessing && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-blue-600">
            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing and encrypting file...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.pptx,.txt,.csv"
        className="hidden"
        disabled={isProcessing}
      />
      
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`flex items-center justify-center w-full px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 group ${
          isProcessing 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-primary hover:bg-blue-50 hover:scale-[1.01] hover:shadow-md'
        }`}
      >
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="w-6 h-6 border border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 animate-pulse">Processing file...</p>
            </>
          ) : (
            <>
              <CloudUpload className="w-8 h-8 text-gray-400 mx-auto mb-2 transition-all duration-200 group-hover:text-primary group-hover:scale-110" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-primary transition-colors duration-200 group-hover:text-blue-700">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1 transition-colors duration-200 group-hover:text-gray-600">PDF, DOC, DOCX, PPT, CSV, TXT (max 2MB)</p>
            </>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Encrypting...</p>
          </div>
        </div>
      )}
    </div>
  );
}
