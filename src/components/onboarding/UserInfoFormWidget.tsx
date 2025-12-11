'use client';

import { useState } from 'react';
import { isValidEmail } from '@/lib/onboarding/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface UserInfoFormWidgetProps {
  onSubmit: (userInfo: UserInfo) => Promise<void>;
  initialValues?: Partial<UserInfo>;
  mode?: 'demo' | 'live';
}

export function UserInfoFormWidget({ 
  onSubmit, 
  initialValues = {},
  mode = 'demo'
}: UserInfoFormWidgetProps) {
  const [formData, setFormData] = useState<UserInfo>({
    email: initialValues.email || '',
    firstName: initialValues.firstName || '',
    lastName: initialValues.lastName || '',
    phoneNumber: initialValues.phoneNumber || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserInfo, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof UserInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserInfo, string>> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[\d\s\-+()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
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
        email: err instanceof Error ? err.message : 'Failed to submit. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-slate-900">
          Set up your machine
        </h3>
        <p className="mt-1.5 text-sm text-slate-600">
          To get started and save your session so you can come back later, I just need a few details from you:
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            We&apos;ll send a one-time verification code (OTP) to this email to confirm it&apos;s you
          </p>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Name Fields - Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1.5 block text-xs font-semibold text-slate-700">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              placeholder="John"
              className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              disabled={loading}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              placeholder="Doe"
              className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
              disabled={loading}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber" className="mb-1.5 block text-xs font-semibold text-slate-700">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full rounded-lg border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={loading}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            For recovery or notifications
          </p>
          {errors.phoneNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
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
