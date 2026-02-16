'use client';

import { useState } from 'react';
import { X, MessageSquare, Shield, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmsOtpFormWidget } from '@/components/onboarding/SmsOtpFormWidget';

// Common country codes
const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+1', country: 'CA', flag: '🇨🇦' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+971', country: 'AE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', flag: '🇸🇦' },
];

interface SMSConsentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (consent: boolean, phoneNumber?: string) => void;
  requirePhoneNumber?: boolean; // true = show phone input, false = just yes/no
  forceOtpVerification?: boolean; // for demos: always show OTP step after consent
  existingPhoneNumber?: string | null; // optional pre-filled E.164 phone
}

export function SMSConsentPopup({
  isOpen,
  onClose,
  onConsent,
  requirePhoneNumber = false,
  forceOtpVerification = false,
  existingPhoneNumber = null,
}: SMSConsentPopupProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');

  if (!isOpen) return null;

  const validatePhone = (phone: string): boolean => {
    // Basic validation: at least 7 digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  const handleResponse = async (consent: boolean) => {
    setPhoneError('');
    
    // If user clicks "Not Now", just close
    if (!consent) {
      localStorage.setItem('sms_consent', JSON.stringify({
        consent: false,
        phoneNumber: null,
        timestamp: new Date().toISOString(),
      }));
      await onConsent(false);
      onClose();
      return;
    }
    
    // If consenting and phone number is required, validate it
    if (consent && requirePhoneNumber) {
      if (!phoneNumber.trim()) {
        setPhoneError('Please enter your phone number');
        return;
      }
      if (!validatePhone(phoneNumber)) {
        setPhoneError('Please enter a valid phone number');
        return;
      }
      
      // Show OTP step instead of completing
      const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      setFullPhoneNumber(fullPhone);
      setShowOtpStep(true);
      return;
    }

    // For non-requirePhoneNumber flow (user already has phone on file)
    // If forced (demo links), still show OTP step so presenters can demo it.
    if (forceOtpVerification) {
      let phone = existingPhoneNumber || '';
      if (!phone) {
        try {
          const raw = localStorage.getItem('sms_consent');
          const parsed = raw ? JSON.parse(raw) : null;
          if (parsed?.phoneNumber) phone = parsed.phoneNumber;
        } catch {}
      }
      if (!phone) phone = '+15551234567';

      setFullPhoneNumber(phone);
      setShowOtpStep(true);
      return;
    }

    setIsSubmitting(true);
    try {
      localStorage.setItem('sms_consent', JSON.stringify({
        consent: true,
        phoneNumber: null, // Already have it
        timestamp: new Date().toISOString(),
      }));
      
      await onConsent(true);
      onClose();
    } catch (error) {
      console.error('Error handling SMS consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOtpVerified = async (_otp: string) => {
    setIsSubmitting(true);
    try {
      // Store consent preference with verified phone
      localStorage.setItem('sms_consent', JSON.stringify({
        consent: true,
        phoneNumber: fullPhoneNumber,
        verified: true,
        timestamp: new Date().toISOString(),
      }));
      
      // Call parent handler
      await onConsent(true, fullPhoneNumber);
      onClose();
    } catch (error) {
      console.error('Error handling SMS OTP:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  // If showing OTP step, render OTP widget
  if (showOtpStep) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-[calc(100vw-32px)] sm:max-w-md mx-4 max-h-[85vh] overflow-y-auto rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-1 shadow-2xl animate-fade-in-up">
          <div className="rounded-[22px] bg-white p-6 sm:p-8">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <SmsOtpFormWidget
              phoneNumber={fullPhoneNumber}
              onSubmit={handleOtpVerified}
              onResend={async () => {
                console.log('Resending SMS OTP to:', fullPhoneNumber);
                // In production, trigger SMS resend API
              }}
              embedded
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[calc(100vw-32px)] sm:max-w-md mx-4 max-h-[85vh] overflow-y-auto rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 p-1 shadow-2xl animate-fade-in-up">
        <div className="rounded-[22px] bg-white p-6 sm:p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <MessageSquare className="h-8 w-8" />
            </div>
          </div>

          {/* Title */}
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight text-slate-900">
            Stay Updated via SMS
          </h2>

          {/* Description */}
          <p className="mb-6 text-center text-sm text-slate-600 leading-relaxed">
            {requirePhoneNumber 
              ? "Enter your phone number to receive important notifications and alerts about your machines via SMS."
              : "Would you like to receive important notifications and alerts about your machines via SMS? You can manage this preference anytime in your settings."
            }
          </p>

          {/* Phone Number Input (only shown when requirePhoneNumber is true) */}
          {requirePhoneNumber && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <div className="flex gap-2">
                {/* Country Code Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-1 h-11 px-3 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <span>{selectedCountry.flag}</span>
                    <span className="text-slate-700">{countryCode}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                  
                  {showCountryDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                      {COUNTRY_CODES.map((country, idx) => (
                        <button
                          key={`${country.code}-${country.country}-${idx}`}
                          type="button"
                          onClick={() => {
                            setCountryCode(country.code);
                            setShowCountryDropdown(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-purple-50 transition-colors"
                        >
                          <span>{country.flag}</span>
                          <span className="text-slate-700">{country.country}</span>
                          <span className="text-slate-500 ml-auto">{country.code}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Phone Number Input */}
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="(555) 123-4567"
                  className="flex-1 h-11 px-4 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                />
              </div>
              {phoneError && (
                <p className="mt-2 text-sm text-red-600">{phoneError}</p>
              )}
            </div>
          )}

          {/* Benefits */}
          <div className="mb-6 space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Real-time Alerts</p>
                <p className="text-xs text-slate-600">Get instant notifications about critical machine events</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Secure & Private</p>
                <p className="text-xs text-slate-600">Your phone number is encrypted and never shared with third parties</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleResponse(true)}
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {isSubmitting ? 'Processing...' : 'Yes, Enable SMS Notifications'}
            </Button>
            <Button
              onClick={() => handleResponse(false)}
              disabled={isSubmitting}
              variant="outline"
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Not Now
            </Button>
          </div>

          {/* Footer Note */}
          <p className="mt-4 text-center text-xs text-slate-500">
            Standard message and data rates may apply. You can opt out at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
