'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';

interface UserInvitationWidgetProps {
  onSubmit: (users: Array<{ name: string; email: string; role: string }>) => Promise<void>;
}

export function UserInvitationWidget({ onSubmit }: UserInvitationWidgetProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('Operator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit([{ name: name.trim(), email: email.trim(), role }]);
      // Clear form on success
      setName('');
      setEmail('');
      setRole('Operator');
    } catch (err) {
      setError('Failed to add user. Please try again.');
      console.error('User invitation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-purple-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Invite Team Members
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Add users who can view and manage this device
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label
            htmlFor="userName"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Name
          </label>
          <input
            id="userName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="userEmail"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Email
          </label>
          <input
            id="userEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@company.com"
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="userRole"
            className="mb-1.5 block text-xs font-semibold text-slate-700"
          >
            Role
          </label>
          <select
            id="userRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-purple-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            disabled={isSubmitting}
          >
            <option value="Operator">Operator</option>
            <option value="Technician">Technician</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !name.trim() || !email.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding User...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </>
        )}
      </Button>
    </form>
  );
}
