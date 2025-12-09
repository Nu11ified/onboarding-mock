'use client';

import { useState } from 'react';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';

interface VideoWidgetProps {
  url: string;
  title: string;
  description?: string;
}

// Helper function to extract video ID and platform
function parseVideoUrl(url: string): { platform: 'youtube' | 'vimeo' | 'microsoft' | 'generic'; embedUrl: string; thumbnailUrl?: string } | null {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      if (videoId) {
        return {
          platform: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        };
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return {
          platform: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
        };
      }
    }
    
    // Microsoft Stream / OneDrive / SharePoint
    if (urlObj.hostname.includes('microsoft') || 
        urlObj.hostname.includes('sharepoint') || 
        urlObj.hostname.includes('onedrive') ||
        urlObj.hostname.includes('stream.microsoft')) {
      return {
        platform: 'microsoft',
        embedUrl: url,
      };
    }
    
    // Generic - try to embed directly
    return {
      platform: 'generic',
      embedUrl: url,
    };
  } catch {
    return null;
  }
}


export function VideoWidget({ url, title, description }: VideoWidgetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const videoInfo = parseVideoUrl(url);
  
  if (!videoInfo) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-900">Invalid Video URL</h3>
            <p className="mt-1 text-sm text-red-700">The provided URL could not be parsed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm min-[500px]:max-w-xl mx-auto rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      {/* Video Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        {!isPlaying && !hasError ? (
          // Thumbnail / Play overlay
          <button
            onClick={() => setIsPlaying(true)}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            {/* Thumbnail background */}
            {videoInfo.thumbnailUrl ? (
              <img 
                src={videoInfo.thumbnailUrl} 
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-slate-100" />
            )}
            
            {/* Play button */}
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all group-hover:scale-110 group-hover:bg-purple-700">
              <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
            </div>
          </button>
        ) : hasError ? (
          // Error state
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">Unable to load video</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-purple-600 hover:underline"
            >
              Open in new tab →
            </a>
          </div>
        ) : (
          // Embedded video
          <iframe
            src={videoInfo.embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setHasError(true)}
          />
        )}
      </div>
      
      {/* Title & Description */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1 text-slate-400 hover:bg-purple-50 hover:text-purple-600"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        {description && (
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
