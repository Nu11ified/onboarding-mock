'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Check } from 'lucide-react';

interface AssetProfile {
  id: string;
  profileKey: string;
  name: string;
  deviceCount: number;
  createdAt: string;
}

interface ProfileSelectionWidgetProps {
  onSelectExisting: (profileKey: string, profileName: string) => Promise<void>;
  onCreateNew: () => Promise<void>;
}

export function ProfileSelectionWidget({
  onSelectExisting,
  onCreateNew,
}: ProfileSelectionWidgetProps) {
  const [profiles, setProfiles] = useState<AssetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/profiles', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        
        if (data.success) {
          setProfiles(data.profiles || []);
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleSelectExisting = async () => {
    if (!selectedProfileId) return;
    
    const profile = profiles.find((p) => p.id === selectedProfileId);
    if (!profile) return;

    setIsSubmitting(true);
    try {
      await onSelectExisting(profile.profileKey, profile.name);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async () => {
    setIsSubmitting(true);
    try {
      await onCreateNew();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-purple-200 bg-white p-8 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        <span className="ml-2 text-sm text-slate-600">Loading profiles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Select Asset Profile
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Choose an existing profile or create a new one
        </p>
      </div>

      {/* Existing Profiles */}
      {profiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">Existing Profiles</p>
          <div className="grid gap-2">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className={`cursor-pointer transition-all ${
                  selectedProfileId === profile.id
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/20'
                    : 'border-purple-200 hover:border-purple-300'
                }`}
                onClick={() => setSelectedProfileId(profile.id)}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {profile.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {profile.deviceCount} device(s) • Created{' '}
                      {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedProfileId === profile.id && (
                    <Check className="h-5 w-5 text-purple-600" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        {selectedProfileId && (
          <Button
            onClick={handleSelectExisting}
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Selecting...
              </>
            ) : (
              'Use Selected Profile'
            )}
          </Button>
        )}

        <Button
          onClick={handleCreateNew}
          disabled={isSubmitting}
          variant="outline"
          className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Profile
        </Button>
      </div>
    </div>
  );
}
