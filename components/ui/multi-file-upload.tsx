"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FileIcon, LinkIcon, UploadCloudIcon, XIcon } from "lucide-react"; // Import LinkIcon
import React, { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "./input"; // Assuming Input component is available
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"; // Assuming Tabs components are available

interface MultiFileUploadProps {
  /** Array of file URLs to display as already uploaded */
  value?: string[];
  /** Callback when files are selected/removed */
  onChange?: (urls: string[]) => void;
  /** Callback when files are successfully uploaded */
  onUploadComplete?: (urls: string[]) => void;
  /** Callback when the last file is removed */
  onRemove?: () => void;
  maxFiles?: number;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Accepted file types in MIME type format */
  acceptedFileTypes?: Record<string, string[]>;
  /** Alternative way to specify file types (for backward compatibility) */
  fileTypes?: string[];
  className?: string;
  /** Optional: Whether to show the link tab for adding URLs directly */
  showLinkTab?: boolean;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  value = [],
  onChange,
  onUploadComplete,
  onRemove,
  maxFiles = 10,
  maxFileSize = 10485760, // 10MB
  acceptedFileTypes: propAcceptedFileTypes,
  fileTypes,
  className,
  showLinkTab = true, // Default to false
}) => {
  const acceptedFileTypes = React.useMemo(() => {
    if (propAcceptedFileTypes) return propAcceptedFileTypes;
    if (fileTypes?.length) {
      return fileTypes.reduce((acc, type) => {
        acc[type] = [];
        return acc;
      }, {} as Record<string, string[]>);
    }
    return {
      "image/*": [".jpeg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
    };
  }, [propAcceptedFileTypes, fileTypes]);

  const [files, setFiles] = useState<File[]>([]);
  const [currentUrls, setCurrentUrls] = useState<string[]>(value || []);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"file" | "link">(showLinkTab ? "link" : "link"); // Default to link tab
  const [linkInput, setLinkInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Only update if the value has actually changed
    if (JSON.stringify(value || []) !== JSON.stringify(currentUrls)) {
      setCurrentUrls(value || []);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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
        return;
      }

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

  const removeFile = (fileToRemove: File | string, index?: number) => {
    if (typeof fileToRemove === 'string') {
      const newUrls = currentUrls.filter((_, i) => i !== index);
      setCurrentUrls(newUrls);
      onChange?.(newUrls);
      if (newUrls.length === 0 && files.length === 0) {
        onRemove?.();
      }
    } else {
      setFiles((prevFiles) => {
        const newFiles = prevFiles.filter((file) => file !== fileToRemove);
        if (newFiles.length === 0 && currentUrls.length === 0) {
          onRemove?.();
        }
        return newFiles;
      });
    }
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
      const newUrls = [...currentUrls, ...data.urls];
      setCurrentUrls(newUrls);
      onChange?.(newUrls);
      onUploadComplete?.(data.urls);
      setFiles([]);
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = () => {
    if (linkInput.trim() && !currentUrls.includes(linkInput.trim())) {
      const newUrls = [...currentUrls, linkInput.trim()];
      setCurrentUrls(newUrls);
      onChange?.(newUrls);
      setLinkInput("");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {showLinkTab ? (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "file" | "link")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <LinkIcon className="mr-2 h-4 w-4" /> Add Link
            </TabsTrigger>
             <TabsTrigger value="file">
              <UploadCloudIcon className="mr-2 h-4 w-4" /> File Upload
            </TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="mt-4">
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
          </TabsContent>
          <TabsContent value="link" className="mt-4">
            <div className="flex flex-col space-y-2">
              <Input
                placeholder="Paste your link here"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
              />
              <Button onClick={handleAddLink} disabled={!linkInput.trim()}>
                Add Link
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
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
      )}

      {uploadError && (
        <p className="text-sm text-destructive">{uploadError}</p>
      )}

      {isUploading && (
        <div className="space-y-2">
          <h3 className="text-md font-medium">Uploading Files...</h3>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {(files.length > 0 || currentUrls.length > 0) && !isUploading && (
        <div className="space-y-2">
          <h3 className="text-md font-medium">
            {files.length > 0 ? 'Selected Files' : 'Uploaded Files'}:
          </h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {files.map((file, index) => (
              <li
                key={`file-${index}`}
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
            {currentUrls.map((url, index) => {
              const fileName = url.split('/').pop() || `link-${index}`; // Use link-index for links
              return (
                <li
                  key={`url-${index}`}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4 text-gray-500" /> {/* Use LinkIcon for links */}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {fileName}
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeFile(url, index)}
                    className="text-gray-500 hover:text-destructive"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export { MultiFileUpload };
