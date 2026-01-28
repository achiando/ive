"use client";

import { deleteProjectDocument } from '@/lib/actions/project';
import { ProjectDocument } from '@prisma/client';
import { Download, File as FileIcon, ImageIcon, Trash2, Video } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface DocumentCardProps {
  document: ProjectDocument;
  canManageDocuments: boolean;
  onDeleteSuccess: (documentId: string) => void;
}

const getFileIcon = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');
  const isVideo = ['mp4', 'webm', 'ogg'].includes(extension || '');

  if (isImage) return <ImageIcon className="w-6 h-6 text-blue-500" />;
  if (isVideo) return <Video className="w-6 h-6 text-red-500" />;
  return <FileIcon className="w-6 h-6 text-gray-500" />;
};

export function DocumentCard({ document, canManageDocuments, onDeleteSuccess }: DocumentCardProps) {
  const isImage = document.fileType?.startsWith('image/');
  const isVideo = document.fileType?.startsWith('video/');
  const fileName = document.fileName || document.fileUrl.split('/').pop() || 'Document';

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteProjectDocument(document.id);
      toast.success('Document deleted successfully.');
      onDeleteSuccess(document.id);
    } catch (err: any) {
      toast.error('Failed to delete document.', {
        description: err.message,
      });
      console.error('Error deleting document:', err);
    }
  };

  const handleDownload = async (docUrl: string, fileName?: string) => {
    const toastId = `download-${Date.now()}`;

    try {
      toast.loading("Preparing download...", { id: toastId });
     console.log(docUrl);

      const res = await fetch("/api/cloudinary/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: docUrl,
          fileName }),
      });

      if (!res.ok) throw new Error("Failed to get signed URL");

      const { url } = await res.json();

      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName || docUrl.split("/").pop() || "file";
      link.target = "_blank";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      toast.success("Download started", { id: toastId });
    } catch (err: any) {
      console.error("Download failed:", err);
      toast.error("Download failed", {
        id: toastId,
        description: err?.message || "Please try again",
      });
    }
  };


  // const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
  //   e.preventDefault();
  //   const originalUrl = e.currentTarget.href;
  //   const toastId = `download-${Date.now()}`;

  //   try {
  //       toast.loading('Preparing download...', { id: toastId });

  //       const publicId = extractPublicId(originalUrl);
  //       if (!publicId) {
  //           throw new Error('Could not determine the public ID of the file.');
  //       }

  //       const urlParts = originalUrl.split('.');
  //       const fileExtension = urlParts.length > 1 ? urlParts.pop() : undefined;

  //       if (!fileExtension) {
  //           throw new Error('Could not determine the file extension from the URL.');
  //       }

  //       // Get the signed URL from our API
  //       const signedUrlResponse = await fetch('/api/signed-url', {
  //           method: 'POST',
  //           headers: {
  //               'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify({ publicId, fileExtension }),
  //       });

  //       if (!signedUrlResponse.ok) {
  //           const errorData = await signedUrlResponse.json();
  //           throw new Error(errorData.error || 'Failed to get a download link.');
  //       }

  //       const { url: signedUrl } = await signedUrlResponse.json();

  //       toast.loading('Starting download...', { id: toastId });

  //       // We can directly use the signed URL to download without needing fetch + blob
  //       const link = window.document.createElement('a');
  //       link.href = signedUrl;
  //       // The 'download' attribute is not strictly necessary with a signed URL that has the right content-disposition,
  //       // but it's good practice to include it as a fallback.
  //       link.download = fileName;
  //       window.document.body.appendChild(link);
  //       link.click();
  //       window.document.body.removeChild(link);

  //       toast.success('Download initiated!', { id: toastId });

  //   } catch (error: any) {
  //       console.error('Download failed:', error);
  //       toast.error('Download failed.', { id: toastId, description: error.message || 'Please try again later.' });
  //   }
  // };

  return (
    <div className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow duration-200">
      <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
        {isImage ? (
          <Image
            src={document.fileUrl}
            alt={fileName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : isVideo ? (
          <video className="w-full h-full object-cover" controls>
            <source src={document.fileUrl} type={document.fileType ?? undefined} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {getFileIcon(document.fileUrl)}
            <span className="mt-2 text-sm text-gray-500 truncate w-full px-2">
              {fileName}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
          <a
            href={document.fileUrl}
            onClick={(e) => {
              e.preventDefault();
              handleDownload(document.fileUrl, fileName);
            }}
            className="p-2 bg-white bg-opacity-80 rounded-full text-gray-700 hover:text-blue-600 mr-2"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
          {canManageDocuments && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-2 bg-white bg-opacity-80 rounded-full text-gray-700 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <div className="p-3 border-t">
        <div className="flex justify-between items-center">
          <a
            href={document.fileUrl}
            onClick={(e) => {
              e.preventDefault();
              handleDownload(document.fileUrl, fileName);
            }}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate max-w-[80%] cursor-pointer"
            title={fileName}
          >
            {fileName}
          </a>
          <span className="text-xs text-gray-500">
            {document.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
        </div>
      </div>
    </div>
  );
}
