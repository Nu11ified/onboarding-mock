'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, RefreshCw, Wrench, HelpCircle } from 'lucide-react';

interface MachineDetails {
  trainingTimeSeconds: number;
  splitCounterSeconds: number;
  daysToMaintenance: number;
}

interface MachineDetailsFormWidgetProps {
  onSubmit: (details: MachineDetails) => Promise<void>;
  initialValues?: Partial<MachineDetails>;
}

export function MachineDetailsFormWidget({ 
  onSubmit, 
  initialValues = {}
}: MachineDetailsFormWidgetProps) {
  const [formData, setFormData] = useState<MachineDetails>({
    trainingTimeSeconds: initialValues.trainingTimeSeconds || 200,
    splitCounterSeconds: initialValues.splitCounterSeconds || 20,
    daysToMaintenance: initialValues.daysToMaintenance || 30,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof MachineDetails, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof MachineDetails, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MachineDetails, string>> = {};

    if (formData.trainingTimeSeconds < 10) {
      newErrors.trainingTimeSeconds = 'Training time must be at least 10 seconds';
    }

    if (formData.splitCounterSeconds < 1) {
      newErrors.splitCounterSeconds = 'Split counter must be at least 1 second';
    }

    if (formData.daysToMaintenance < 1) {
      newErrors.daysToMaintenance = 'Days to maintenance must be at least 1 day';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setErrors({ 
        trainingTimeSeconds: err instanceof Error ? err.message : 'Failed to submit. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">
          Machine Configuration
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          I need a few details about your device to configure AI insights and predictive analytics:
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Training Time */}
        <div>
          <label htmlFor="trainingTime" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Training Time (seconds)
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 ml-auto"
              title="Duration for the AI to learn your machine's normal patterns before inferencing begins"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </label>
          <input
            id="trainingTime"
            type="number"
            min="10"
            value={formData.trainingTimeSeconds}
            onChange={(e) => handleChange('trainingTimeSeconds', e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            How long the AI should train on your machine&apos;s data
          </p>
          {errors.trainingTimeSeconds && (
            <p className="mt-1 text-xs text-red-600">{errors.trainingTimeSeconds}</p>
          )}
        </div>

        {/* Split Counter */}
        <div>
          <label htmlFor="splitCounter" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Split Counter (seconds)
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 ml-auto"
              title="The typical period or cycle time of your device's behavior"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </label>
          <input
            id="splitCounter"
            type="number"
            min="1"
            value={formData.splitCounterSeconds}
            onChange={(e) => handleChange('splitCounterSeconds', e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            The typical cycle period of your device&apos;s behavior
          </p>
          {errors.splitCounterSeconds && (
            <p className="mt-1 text-xs text-red-600">{errors.splitCounterSeconds}</p>
          )}
        </div>

        {/* Days to Maintenance */}
        <div>
          <label htmlFor="daysToMaintenance" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Wrench className="h-3.5 w-3.5 text-slate-400" />
            Days to Maintenance (days)
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 ml-auto"
              title="The usual maintenance interval recommended by the manufacturer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </label>
          <input
            id="daysToMaintenance"
            type="number"
            min="1"
            value={formData.daysToMaintenance}
            onChange={(e) => handleChange('daysToMaintenance', e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            The usual maintenance interval recommended by the manufacturer
          </p>
        {errors.daysToMaintenance && (
            <p className="mt-1 text-xs text-red-600">{errors.daysToMaintenance}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </form>
    </div>
  );
}
