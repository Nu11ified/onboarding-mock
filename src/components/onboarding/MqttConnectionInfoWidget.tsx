'use client';

import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, Server, Hash, User, Key, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DeviceSpawnResponse } from '@/lib/onboarding/types';

interface MqttConnectionInfoWidgetProps {
  connection: Pick<DeviceSpawnResponse, 'brokerEndpoint' | 'brokerPort' | 'topic' | 'username' | 'password' | 'sampleSchema'>;
}

export function MqttConnectionInfoWidget({ connection }: MqttConnectionInfoWidgetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const connectionDetails = [
    {
      label: 'Broker Endpoint',
      value: connection.brokerEndpoint,
      icon: Server,
      field: 'endpoint',
    },
    {
      label: 'Port',
      value: connection.brokerPort.toString(),
      icon: Hash,
      field: 'port',
    },
    {
      label: 'Topic',
      value: connection.topic,
      icon: FileJson,
      field: 'topic',
    },
    {
      label: 'Username',
      value: connection.username,
      icon: User,
      field: 'username',
    },
    {
      label: 'Password',
      value: connection.password,
      icon: Key,
      field: 'password',
      sensitive: true,
    },
  ];

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">
          MQTT Connection Details
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Use these credentials to connect your device to our broker
        </p>
      </div>

      <div className="space-y-3">
        {connectionDetails.map((detail) => {
          const Icon = detail.icon;
          const isCopied = copiedField === detail.field;
          const showValue = !detail.sensitive || showPassword;

          return (
            <div
              key={detail.field}
              className="group relative rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-purple-200 hover:bg-purple-50/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700">
                      {detail.label}
                    </p>
                    <p className={cn(
                      "mt-1 text-sm font-mono break-all",
                      detail.sensitive && !showValue && "text-slate-400"
                    )}>
                      {showValue ? detail.value : '••••••••••••'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {detail.sensitive && (
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(detail.value, detail.field)}
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      isCopied
                        ? "bg-green-100 text-green-600"
                        : "text-slate-400 hover:bg-white hover:text-slate-600"
                    )}
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sample Schema */}
      {connection.sampleSchema && (
        <div className="mt-4">
          <button
            onClick={() => setShowSchema(!showSchema)}
            className="w-full flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50/50 p-3 text-left hover:bg-purple-50"
          >
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-slate-900">
                Sample Data Schema
              </span>
            </div>
            <span className="text-xs text-purple-600">
              {showSchema ? 'Hide' : 'Show'}
            </span>
          </button>

          {showSchema && (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-900 p-3">
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(connection.sampleSchema, null, 2)}
              </pre>
              <button
                onClick={() => copyToClipboard(JSON.stringify(connection.sampleSchema, null, 2), 'schema')}
                className="mt-2 flex items-center gap-1.5 rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                {copiedField === 'schema' ? (
                  <>
                    <Check className="h-3 w-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    Copy Schema
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Connection Instructions */}
      <div className="mt-4 rounded-lg bg-purple-50 p-3">
        <p className="text-xs font-semibold text-slate-900 mb-2">
          🔗 Quick Start
        </p>
        <ol className="space-y-1 text-xs text-slate-600">
          <li>1. Connect to the broker using the endpoint and port</li>
          <li>2. Authenticate with the username and password</li>
          <li>3. Publish data to the specified topic</li>
          <li>4. Follow the sample schema format for data structure</li>
        </ol>
      </div>

      {/* Additional Resources */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <a
          href="#"
          className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            // Handle documentation link
          }}
        >
          View MQTT Documentation
        </a>
        <span className="text-slate-300">•</span>
        <a
          href="#"
          className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            // Handle examples link
          }}
        >
          See Code Examples
        </a>
      </div>
    </div>
  );
}
