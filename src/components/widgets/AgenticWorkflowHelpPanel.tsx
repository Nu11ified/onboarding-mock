'use client';

import { CheckCircle2 } from 'lucide-react';

export function AgenticWorkflowHelpPanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 pr-10">What can the Agentic Workflow do?</h3>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Real-Time Monitoring</h4>
            <p className="text-sm text-slate-600">
              Continuously watches telemetry and identifies abnormalities as they happen.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">AI Health Scoring</h4>
            <p className="text-sm text-slate-600">
              Calculates a dynamic health score using live behavior and historical patterns.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Automatic Alerts & Root-Cause Detection</h4>
            <p className="text-sm text-slate-600">
              Notifies you when something goes wrong and explains what caused it.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Smart Ticket Creation</h4>
            <p className="text-sm text-slate-600">
              Automatically generates detailed maintenance tickets with evidence and recommendations.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Team Collaboration</h4>
            <p className="text-sm text-slate-600">
              Invite others to monitor the device and assign alerts or tickets to the right people.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Continuous Learning</h4>
            <p className="text-sm text-slate-600">
              Improves predictions and insights as more data is received.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 mb-1">Ticket Hierarchy Overview</h4>
            <p className="text-sm text-slate-600">
              When an event occurs on a device, a parent ticket is created to record the issue. If additional related events occur later, child tickets are created under the same parent ticket to track those follow-up issues, while the parent ticket reflects the most recent event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

