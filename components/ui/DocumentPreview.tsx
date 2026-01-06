"use client";

import React from 'react';

interface DocumentPreviewProps {
  url: string;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

export function DocumentPreview({ url }: DocumentPreviewProps) {
  if (!url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 rounded-lg min-h-[60vh]">
        No document URL provided.
      </div>
    );
  }

  const youtubeEmbedUrl = getYouTubeEmbedUrl(url);

  if (youtubeEmbedUrl) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={youtubeEmbedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }

  if (url.includes("docs.google.com")) {
    // Assuming the URL is already the correct embed URL
    return (
      <div className="w-full h-[80vh] bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full"
          frameBorder="0"
        >
          Loading document...
        </iframe>
      </div>
    );
  }
  
  // Fallback for other links (PDFs, etc.)
  // Modern browsers can embed PDFs in iframes as well.
  if (url.toLowerCase().endsWith('.pdf')) {
    return (
      <div className="w-full h-[80vh] bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full"
          title="PDF Preview"
        >
          Loading PDF...
        </iframe>
      </div>
    );
  }

  // Generic fallback for any other link
  return (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 rounded-lg min-h-[60vh]">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-lg"
      >
        This document format cannot be previewed directly.
        <br />
        Click here to open it in a new tab.
      </a>
    </div>
  );
}
