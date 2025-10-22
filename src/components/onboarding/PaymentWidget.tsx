'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentWidgetProps {
  onSubmit: (paymentData: {
    plan: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
  }) => void;
}

const PAYMENT_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$99',
    period: '/month',
    features: ['Up to 5 devices', 'Basic analytics', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$299',
    period: '/month',
    features: ['Up to 20 devices', 'Advanced analytics', 'Priority support', 'Custom dashboards'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited devices', 'Enterprise analytics', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
  },
];

export function PaymentWidget({ onSubmit }: PaymentWidgetProps) {
  const [selectedPlan, setSelectedPlan] = useState('professional');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    onSubmit({
      plan: selectedPlan,
      cardNumber,
      expiry,
      cvv,
    });
  };

  return (
    <div className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">Select Your Plan</h3>
      
      {/* Plan Selection */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {PAYMENT_PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan.id)}
            className={cn(
              'relative rounded-lg border-2 p-3 text-left transition-all hover:border-purple-300',
              selectedPlan === plan.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-slate-200 bg-white'
            )}
          >
            {plan.recommended && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-2 py-0.5 text-xs font-medium text-white">
                Recommended
              </div>
            )}
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-lg font-bold text-slate-900">{plan.price}</span>
              <span className="text-xs text-slate-500">{plan.period}</span>
            </div>
            <div className="mb-2 text-sm font-semibold text-slate-700">{plan.name}</div>
            <ul className="space-y-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-purple-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="cardNumber" className="mb-1 block text-xs font-medium text-slate-700">
            Card Number
          </label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            maxLength={19}
            required
            disabled={isSubmitting}
            className="text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="expiry" className="mb-1 block text-xs font-medium text-slate-700">
              Expiry Date
            </label>
            <Input
              id="expiry"
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              maxLength={5}
              required
              disabled={isSubmitting}
              className="text-sm"
            />
          </div>
          <div>
            <label htmlFor="cvv" className="mb-1 block text-xs font-medium text-slate-700">
              CVV
            </label>
            <Input
              id="cvv"
              type="text"
              placeholder="123"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              maxLength={4}
              required
              disabled={isSubmitting}
              className="text-sm"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isSubmitting ? 'Processing...' : 'Complete Payment'}
        </Button>

        <p className="text-xs text-slate-500">
          Your payment information is encrypted and secure.
        </p>
      </form>
    </div>
  );
}
