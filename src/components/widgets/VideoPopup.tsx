'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Video, Link2, Type, FileText } from 'lucide-react';

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { url: string; title: string; description: string }) => void;
}

export function VideoPopup({ isOpen, onClose, onSubmit }: VideoPopupProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urlError, setUrlError] = useState('');

  const validateUrl = (value: string) => {
    if (!value.trim()) {
      setUrlError('Video URL is required');
      return false;
    }
    try {
      new URL(value);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateUrl(url)) return;
    if (!title.trim()) return;

    onSubmit({
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
    });

    // Reset form
    setUrl('');
    setTitle('');
    setDescription('');
    setUrlError('');
    onClose();
  };

  const handleClose = () => {
    setUrl('');
    setTitle('');
    setDescription('');
    setUrlError('');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[calc(100vw-32px)] sm:max-w-lg mx-4 max-h-[85vh] animate-fade-in-up">
        <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-1 shadow-2xl max-h-[85vh] overflow-y-auto">
          <div className="rounded-[22px] bg-white p-4 sm:p-6">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                <Video className="h-8 w-8" />
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight text-slate-900">
              Add Video
            </h2>
            <p className="mb-6 text-center text-sm text-slate-500">
              Share a video from YouTube, Vimeo, Microsoft Stream, or any video URL
            </p>

            {/* Form */}
            <div className="space-y-4">
              {/* Video URL */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Link2 className="h-4 w-4 text-purple-500" />
                  Video URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) validateUrl(e.target.value);
                  }}
                  onBlur={() => validateUrl(url)}
                  placeholder="https://youtube.com/watch?v=..."
                  className={`w-full rounded-xl border px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 ${
                    urlError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-purple-200 focus:border-purple-400 focus:ring-purple-400/20'
                  }`}
                />
                {urlError && (
                  <p className="mt-1 text-xs text-red-500">{urlError}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Type className="h-4 w-4 text-purple-500" />
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for the video"
                  className="w-full rounded-xl border border-purple-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Description
                  <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a brief description..."
                  rows={3}
                  className="w-full rounded-xl border border-purple-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-xl border border-slate-200 px-6 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!url.trim() || !title.trim() || !!urlError}
                className="flex-1 rounded-xl bg-purple-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
