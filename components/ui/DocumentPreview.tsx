"use client";

import { ExternalLink } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from './button';

interface DocumentPreviewProps {
  url: string;
  onUserInteraction?: () => void; // New prop
}

// Declare YT globally for TypeScript
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
};

export function DocumentPreview({ url, onUserInteraction }: DocumentPreviewProps) {
  const youtubePlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [youTubeApiReady, setYouTubeApiReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame Player API script
    if (getYouTubeVideoId(url) && !window.YT && !document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      tag.id = 'youtube-iframe-api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setYouTubeApiReady(true);
      };
    } else if (window.YT) {
      setYouTubeApiReady(true);
    }

    return () => {
      // Cleanup YouTube player
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy();
      }
    };
  }, [url]);

  useEffect(() => {
    // Check if mobile on mount and on resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Tailwind's md breakpoint
    };
    // Initial check
    checkMobile();
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Effect for handling iframe scroll and direct link clicks
  useEffect(() => {
    if (!onUserInteraction) return;

    // Direct link interaction
    const handleLinkClick = () => {
      onUserInteraction();
    };

    // Iframe scroll interaction (Google Docs/PDFs)
    const handleIframeScroll = () => {
      onUserInteraction();
    };

    if (!getYouTubeVideoId(url) && !url.includes("docs.google.com") && !url.toLowerCase().endsWith('.pdf')) {
      // This is the generic fallback link
      const linkElement = iframeRef.current?.parentElement?.querySelector('a');
      if (linkElement) {
        linkElement.addEventListener('click', handleLinkClick);
      }
      return () => {
        if (linkElement) {
          linkElement.removeEventListener('click', handleLinkClick);
        }
      };
    } else if (iframeRef.current && (url.includes("docs.google.com") || url.toLowerCase().endsWith('.pdf'))) {
      // Attempt to attach scroll listener to iframe
      // This is highly likely to be blocked by cross-origin policy
      const iframe = iframeRef.current;
      try {
        // Accessing contentDocument/contentWindow.document is often blocked
        // This part might not work for cross-origin iframes
        iframe.contentWindow?.addEventListener('scroll', handleIframeScroll, { passive: true });
        iframe.contentDocument?.addEventListener('scroll', handleIframeScroll, { passive: true });
        console.log("Attempted to attach scroll listener to iframe.");
      } catch (e) {
        console.warn("Could not attach scroll listener to iframe due to cross-origin policy:", e);
        // Fallback: Consider any click on the iframe as interaction if scroll is blocked
        iframe.addEventListener('click', handleIframeScroll, { once: true });
      }

      return () => {
        try {
          iframe.contentWindow?.removeEventListener('scroll', handleIframeScroll);
          iframe.contentDocument?.removeEventListener('scroll', handleIframeScroll);
        } catch (e) {
          // Ignore errors during cleanup for cross-origin iframes
        }
        iframe.removeEventListener('click', handleIframeScroll);
      };
    }
  }, [url, onUserInteraction, youTubeApiReady]); // youTubeApiReady added as a dependency

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 rounded-lg min-h-[60vh]">
        No document URL provided.
      </div>
    );
  }

  const youtubeVideoId = getYouTubeVideoId(url);

  if (youtubeVideoId) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <div id="youtube-player" className="w-full h-full"></div>
        {youTubeApiReady && (
          <YouTubePlayer
            videoId={youtubeVideoId}
            onPlay={() => onUserInteraction && onUserInteraction()}
            playerRef={youtubePlayerRef}
          />
        )}
      </div>
    );
  }

  if (url.includes("docs.google.com")) {
    return (
      <div className="relative w-full h-full">
        <div className="w-full h-[calc(100vh-200px)] sm:h-[70vh] md:h-[80vh] rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full"
            frameBorder="0"
            title="Document Preview"
            allowFullScreen
          >
            Loading document...
          </iframe>
        </div>
        {/* Floating button for mobile */}
        {isMobile && (
          <Button
            onClick={openInNewTab}
            size="lg"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg p-3 h-14 w-14 md:hidden"
            aria-label="Open in new tab"
          >
            <ExternalLink className="h-6 w-6" />
          </Button>
        )}
      </div>

    );
  }

  if (url.toLowerCase().endsWith('.pdf')) {
    return (
      <div className="w-full h-[80vh] bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full"
          title="PDF Preview"
        >
          Loading PDF...
        </iframe>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500 rounded-lg min-h-[60vh]">
      <a
        ref={linkRef}
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

// Helper component for YouTube Player
interface YouTubePlayerProps {
  videoId: string;
  onPlay: () => void;
  playerRef: React.MutableRefObject<any>;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, onPlay, playerRef }) => {
  useEffect(() => {
    if (window.YT && videoId) {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
        },
        events: {
          onReady: (event: any) => {
            // console.log("YouTube player ready:", event);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              onPlay();
            }
          },
        },
      });
    }
  }, [videoId, onPlay, playerRef]);

  return null; // YouTubePlayer component doesn't render anything itself, it just manages the player
};
