'use client';

import {
  Settings,
  Users,
  Activity,
  AlertCircle,
  Ticket,
  FileText,
  RefreshCw,
  BookOpen,
  Gauge,
  TrendingUp,
  UserCheck,
  Plus,
} from 'lucide-react';

interface ActionItem {
  question: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ActionCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ActionItem[];
}

const categories: ActionCategory[] = [
  {
    title: 'Onboarding & Management',
    icon: Settings,
    items: [
      {
        question: 'Can I onboard another machine?',
        description: 'Add more assets — demo or live — and monitor them from the same dashboard.',
        icon: Plus,
      },
      {
        question: 'Can I invite more users?',
        description: 'Bring teammates in to collaborate, receive alerts, and manage maintenance.',
        icon: Users,
      },
    ],
  },
  {
    title: 'Machine Insights & Exploration',
    icon: Gauge,
    items: [
      {
        question: 'Show me the live data for my machine.',
        description: 'Dive deeper into real-time telemetry and behavioral trends.',
        icon: Activity,
      },
      {
        question: 'What alerts or faults has my machine generated?',
        description: 'Review active or past issues and see how the AI diagnosed them.',
        icon: AlertCircle,
      },
      {
        question: 'Can I get recommendations for improving performance?',
        description: 'Get AI-generated insights or maintenance suggestions (from analytics or uploaded manuals).',
        icon: TrendingUp,
      },
    ],
  },
  {
    title: 'Ticketing & Maintenance Workflow',
    icon: Ticket,
    items: [
      {
        question: 'Show me all open tickets.',
        description: 'View, filter, or manage tickets created by the agent.',
        icon: FileText,
      },
      {
        question: 'Who is assigned to this ticket?',
        description: 'Quickly review or update responsibilities.',
        icon: UserCheck,
      },
      {
        question: 'Assign a new maintenance ticket.',
        description: 'Log manual tasks or actions based on observations.',
        icon: Plus,
      },
    ],
  },
  {
    title: 'Configuration & Optimization',
    icon: Settings,
    items: [
      {
        question: 'Can I update my channels/tags configuration?',
        description: 'Reconfigure data groups to change how analytics and alerts behave.',
        icon: Settings,
      },
      {
        question: 'Can I retrain the AI model?',
        description: 'Trigger a fresh learning cycle based on new or improved data.',
        icon: RefreshCw,
      },
    ],
  },
  {
    title: 'Knowledge & Documentation',
    icon: BookOpen,
    items: [
      {
        question: 'Do we have manuals uploaded for this machine?',
        description: 'Access documents that enable the AI to give contextual recommendations.',
        icon: FileText,
      },
      {
        question: 'Can you summarize this manual section?',
        description: 'Let the agent help understand tricky or long technical docs.',
        icon: BookOpen,
      },
    ],
  },
];

export function WhatCanIDoNextPanel() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 pr-10">What can I do next?</h3>
      {categories.map((category, categoryIdx) => (
        <div key={categoryIdx} className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <category.icon className="h-4 w-4 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{category.title}</h3>
          </div>
          
          <div className="space-y-3 pl-10">
            {category.items.map((item, itemIdx) => (
              <div key={itemIdx} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200">
                    <item.icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 mb-1">
                      "{item.question}"
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

