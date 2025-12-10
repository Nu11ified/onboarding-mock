'use client';

import { useState, useEffect } from 'react';
import { 
  Server, 
  Copy, 
  Check, 
  HelpCircle, 
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Code,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BrokerDetails {
  endpoint: string;
  port: number;
  topic: string;
  username?: string;
  password?: string;
}

interface MqttBrokerValidationWidgetProps {
  brokerDetails: BrokerDetails;
  onValidated: () => Promise<void>;
  onHelp?: () => void;
}

type ValidationStatus = 'waiting' | 'connecting' | 'validating' | 'success' | 'error';

export function MqttBrokerValidationWidget({ 
  brokerDetails,
  onValidated,
  onHelp,
}: MqttBrokerValidationWidgetProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [status, setStatus] = useState<ValidationStatus>('waiting');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Simulate data validation process
  useEffect(() => {
    if (status === 'connecting') {
      const timer = setTimeout(() => {
        setStatus('validating');
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (status === 'validating') {
      const timer = setTimeout(() => {
        setStatus('success');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStartValidation = () => {
    setStatus('connecting');
  };

  const handleContinue = async () => {
    await onValidated();
  };

  const brokerFields = [
    { label: 'Endpoint', value: brokerDetails.endpoint, field: 'endpoint' },
    { label: 'Port', value: brokerDetails.port.toString(), field: 'port' },
    { label: 'Topic', value: brokerDetails.topic, field: 'topic' },
  ];

  if (brokerDetails.username) {
    brokerFields.push({ label: 'Username', value: brokerDetails.username, field: 'username' });
  }
  if (brokerDetails.password) {
    brokerFields.push({ label: 'Password', value: brokerDetails.password, field: 'password' });
  }

  return (
    <>
      <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm">
        {/* Header with Help Button */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              MQTT Broker Details
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Configure your machine to send data to this broker. We&apos;ll validate the data format automatically.
            </p>
          </div>
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-100 transition shrink-0"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Help me send data
          </button>
        </div>

        {/* Broker Details */}
        <div className="space-y-2 mb-4">
          {brokerFields.map((item) => (
            <div
              key={item.field}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">{item.label}:</span>
                <span className="text-sm font-mono text-slate-900">{item.value}</span>
              </div>
              <button
                onClick={() => copyToClipboard(item.value, item.field)}
                className={cn(
                  "rounded p-1.5 transition-colors",
                  copiedField === item.field
                    ? "bg-green-100 text-green-600"
                    : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                )}
                title="Copy to clipboard"
              >
                {copiedField === item.field ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Validation Status */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
          <div className="flex items-center gap-3">
            {status === 'waiting' && (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
                  <Server className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Waiting for data...</p>
                  <p className="text-xs text-slate-500">Configure your machine and start sending data</p>
                </div>
              </>
            )}
            {status === 'connecting' && (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Connecting to broker...</p>
                  <p className="text-xs text-slate-500">Establishing connection</p>
                </div>
              </>
            )}
            {status === 'validating' && (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-700">Validating data format...</p>
                  <p className="text-xs text-slate-500">Checking incoming data structure</p>
                </div>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Data validated successfully!</p>
                  <p className="text-xs text-slate-500">Your data format is acceptable</p>
                </div>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Validation failed</p>
                  <p className="text-xs text-slate-500">Please check your data format and try again</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status === 'waiting' && (
            <Button 
              onClick={handleStartValidation}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              I&apos;ve configured my machine
            </Button>
          )}
          {status === 'success' && (
            <Button 
              onClick={handleContinue}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Continue
            </Button>
          )}
          {status === 'error' && (
            <Button 
              onClick={handleStartValidation}
              variant="outline"
              className="flex-1"
            >
              Try again
            </Button>
          )}
        </div>

        {/* Note */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          Don&apos;t worry about the format — you can send data in your existing format. We&apos;ll validate it on our side.
        </p>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-slate-900">How to Send Data to MQTT</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Kepware */}
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-slate-900">Kepware</h4>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Use KEPServerEX IoT Gateway plug-in to connect.
                </p>
                <a
                  href="https://www.kepware.com/en-us/products/kepserverex/advanced-plug-ins/iot-gateway/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                >
                  View Documentation <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Ignition */}
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-slate-900">Ignition</h4>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Configure MQTT Transmission module from Cirrus Link.
                </p>
                <a
                  href="https://docs.chariot.io/display/CLD/MQTT+Transmission"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                >
                  View Documentation <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Generic MQTT */}
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-slate-900">Generic MQTT Client</h4>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Use any MQTT client library (Python, Node.js, etc.)
                </p>
                <div className="rounded-lg bg-slate-900 p-3 text-xs font-mono text-green-400 overflow-x-auto">
                  <pre>{`{
  "timestamp": ${Date.now()},
  "temperature": 72.5,
  "pressure": 101.3,
  "vibration": 0.45
}`}</pre>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 px-5 py-4">
              <Button
                onClick={() => setShowHelpModal(false)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
