'use client';

import { useState } from 'react';
import { 
  Play, 
  ExternalLink,
  GraduationCap,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrainingVideoPanelProps {
  videoUrl?: string;
  title?: string; // Card Header
  description?: string; // Card Text
  duration?: string;
  thumbnailUrl?: string;
  className?: string;
  onVideoComplete?: () => void;
  headingTitle?: string; // Widget Heading
  headingDescription?: string; // Widget Description
}

// Helper function to extract video embed URL
function getEmbedUrl(url: string): { embedUrl: string; platform: string } | null {
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
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`,
          platform: 'YouTube',
        };
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          platform: 'Vimeo',
        };
      }
    }
    
    // Loom
    if (urlObj.hostname.includes('loom.com')) {
      const videoId = urlObj.pathname.split('/').pop();
      if (videoId) {
        return {
          embedUrl: `https://www.loom.com/embed/${videoId}`,
          platform: 'Loom',
        };
      }
    }
    
    // Default: try to embed directly
    return {
      embedUrl: url,
      platform: 'Video',
    };
  } catch {
    return null;
  }
}

export function TrainingVideoPanel({
  videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title = 'Getting Started with Machine Intelligence',
  description = 'Learn how to configure your machine, understand health scores, and set up predictive maintenance alerts in this comprehensive walkthrough.',
  duration = '5:30',
  thumbnailUrl,
  className,
  onVideoComplete,
  headingTitle = 'Training Video',
  headingDescription = 'Watch this video to learn how to get the most out of your machine intelligence setup.',
}: TrainingVideoPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoInfo = getEmbedUrl(videoUrl);

  const handlePlay = () => {
    setIsPlaying(true);
    // Optionally notify parent when video starts
    onVideoComplete?.();
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">{headingTitle}</h2>
        </div>
        <p className="text-sm text-slate-600">
          {headingDescription}
        </p>
      </div>

      {/* Video Player Container */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-lg mb-4">
        {!isPlaying ? (
          // Thumbnail with play overlay
          <button
            onClick={handlePlay}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            {/* Thumbnail or gradient background */}
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900">
                {/* Decorative elements */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-purple-500 blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full bg-pink-500 blur-3xl" />
                </div>
              </div>
            )}
            
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30 transition-all group-hover:bg-black/40" />
            
            {/* Play button */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-purple-600 shadow-xl transition-all group-hover:scale-110 group-hover:bg-white">
                <Play className="h-7 w-7 ml-1" fill="currentColor" />
              </div>
              <span className="mt-3 text-sm font-medium text-white/90">Click to play</span>
            </div>
            
            {/* Duration badge */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              <Clock className="h-3 w-3" />
              {duration}
            </div>
          </button>
        ) : (
          // Embedded video player
          <iframe
            src={videoInfo?.embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      {/* Video Info */}
      <div>
        <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {description}
              </p>
            </div>
            {videoInfo && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-purple-100 hover:text-purple-600 transition"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

        </div>

        {/* Next steps hint intentionally removed for this demo implementation */}
      </div>
    </div>
  );
}
