"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";

interface MultiFileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: Record<string, string[]>;
  className?: string;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 10485760, // 10MB
  acceptedFileTypes = {
    "image/*": [".jpeg", ".png", ".gif", ".webp"],
    "application/pdf": [".pdf"],
  },
  className,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: any[]) => {
      setUploadError(null);
      if (fileRejections.length > 0) {
        const errors = fileRejections.map(({ file, errors }) => {
          const fileErrors = errors.map((err: any) => err.message).join(", ");
          return `${file.name}: ${fileErrors}`;
        });
        setUploadError(`File errors: ${errors.join("; ")}`);
      }

      if (acceptedFiles.length === 0) {
        return; // No valid files to process
      }

      // If maxFiles is 1, replace existing files, otherwise add
      const newFiles = maxFiles === 1 ? acceptedFiles : [...files, ...acceptedFiles];
      setFiles(newFiles);
      await handleUpload(newFiles);
    },
    [files, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxFileSize,
    accept: acceptedFileTypes,
  });

  const removeFile = (fileToRemove: File) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleUpload = async (filesToUpload: File[]) => {
    if (filesToUpload.length === 0) {
      setUploadError("No files to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    filesToUpload.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const response = await fetch("/api/cloudinary-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      onUploadComplete(data.urls);
      setFiles([]); // Clear files after successful upload
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input type="file" multiple {...getInputProps()} />
        <UploadCloudIcon className="mb-2 size-8 text-gray-400" />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop some files here, or click to select files</p>
        )}
        <p className="text-sm text-gray-500">
          Max {maxFiles} file(s), up to {maxFileSize / (1024 * 1024)}MB each.
          Accepted types: {Object.values(acceptedFileTypes).flat().join(", ")}
        </p>
      </div>

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {isUploading && (
        <div className="space-y-2">
          <h3 className="text-md font-medium">Uploading Files...</h3>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {files.length > 0 && !isUploading && (
        <div className="space-y-2">
          <h3 className="text-md font-medium">Selected Files:</h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {files.map((file, index) => (
              <li
                key={file.name + index}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  <FileIcon className="size-4 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeFile(file)}
                  className="text-gray-500 hover:text-destructive"
                >
                  <XIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { MultiFileUpload };
