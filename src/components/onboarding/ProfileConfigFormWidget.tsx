'use client';

import { useState } from 'react';
import { validateProfileConfig } from '@/lib/onboarding/utils';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle } from 'lucide-react';
import type { ProfileConfig } from '@/lib/onboarding/types';

interface ProfileConfigFormWidgetProps {
  onSubmit: (config: ProfileConfig) => Promise<void>;
  initialConfig?: Partial<ProfileConfig>;
}

export function ProfileConfigFormWidget({ 
  onSubmit, 
  initialConfig = {} 
}: ProfileConfigFormWidgetProps) {
  const [config, setConfig] = useState<Partial<ProfileConfig>>({
    profileName: initialConfig.profileName || '',
    trainingSeconds: initialConfig.trainingSeconds || 200,
    daysToMaintenance: initialConfig.daysToMaintenance || 30,
    cycleDuration: initialConfig.cycleDuration || 20,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof ProfileConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const validationErrors = validateProfileConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(config as ProfileConfig);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to create profile']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Configure Your Device Profile
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Set up the parameters for your machine monitoring
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Name */}
        <div>
          <label htmlFor="profileName" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
            Profile Name
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              title="A descriptive name for your machine"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </label>
          <input
            id="profileName"
            type="text"
            value={config.profileName}
            onChange={(e) => handleChange('profileName', e.target.value)}
            placeholder="e.g., Injection Molding Machine"
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
        </div>

        {/* Training Seconds */}
        <div>
          <label htmlFor="trainingSeconds" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
            Training Period (seconds)
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              title="How long the AI needs to learn normal behavior (minimum 10 seconds)"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </label>
          <input
            id="trainingSeconds"
            type="number"
            min="10"
            value={config.trainingSeconds}
            onChange={(e) => handleChange('trainingSeconds', parseInt(e.target.value) || 0)}
            placeholder="200"
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-slate-500">
            Recommended: 200+ seconds for accurate anomaly detection
          </p>
        </div>

        {/* Days to Maintenance */}
        <div>
          <label htmlFor="daysToMaintenance" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
            Days Between Maintenance
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              title="Scheduled maintenance interval for predictive alerts"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </label>
          <input
            id="daysToMaintenance"
            type="number"
            min="1"
            value={config.daysToMaintenance}
            onChange={(e) => handleChange('daysToMaintenance', parseInt(e.target.value) || 0)}
            placeholder="30"
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
        </div>

        {/* Cycle Duration */}
        <div>
          <label htmlFor="cycleDuration" className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
            Cycle Duration (seconds)
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              title="How long one complete machine cycle takes (split counter)"
            >
              <HelpCircle className="h-3 w-3" />
            </button>
          </label>
          <input
            id="cycleDuration"
            type="number"
            min="1"
            value={config.cycleDuration}
            onChange={(e) => handleChange('cycleDuration', parseInt(e.target.value) || 0)}
            placeholder="20"
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-slate-500">
            Used to track production cycles and efficiency
          </p>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="rounded-lg bg-red-50 p-3">
            <ul className="space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-xs text-red-600">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Profile...
            </>
          ) : (
            'Create Profile & Continue'
          )}
        </Button>
      </form>

      <div className="mt-4 rounded-lg bg-purple-50 p-3">
        <p className="text-xs text-slate-600">
          💡 <span className="font-semibold">Tip:</span> These settings can be adjusted later in your dashboard
        </p>
      </div>
    </div>
  );
}
