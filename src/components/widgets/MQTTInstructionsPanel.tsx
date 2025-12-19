'use client';

import { useState } from 'react';
import { 
  Server, 
  Settings, 
  Code, 
  ChevronRight, 
  Copy, 
  Check,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MQTTInstructionsPanelProps {
  brokerEndpoint?: string;
  brokerPort?: number;
  topic?: string;
  className?: string;
}

type InstructionOption = 'kepware' | 'ignition' | 'generic';

const INSTRUCTION_OPTIONS = [
  {
    id: 'kepware' as const,
    icon: Server,
    title: 'Kepware',
    subtitle: 'KEPServerEX Configuration',
    description: 'Connect using Kepware\'s IoT Gateway plug-in',
  },
  {
    id: 'ignition' as const,
    icon: Settings,
    title: 'Ignition',
    subtitle: 'Inductive Automation',
    description: 'Configure MQTT Transmission module',
  },
  {
    id: 'generic' as const,
    icon: Code,
    title: 'Generic MQTT',
    subtitle: 'Any MQTT Client',
    description: 'Standard MQTT broker connection',
  },
];

interface InstructionStepProps {
  step: number;
  title: string;
  children: React.ReactNode;
}

function InstructionStep({ step, title, children }: InstructionStepProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
        {step}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-slate-900">{title}</h4>
        <div className="mt-1.5 text-sm text-slate-600 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative mt-2 rounded-lg bg-slate-900 p-3">
      <code className="text-xs text-purple-300 break-all">{code}</code>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded p-1 text-slate-400 opacity-0 transition hover:bg-slate-800 hover:text-slate-200 group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function MQTTInstructionsPanel({
  brokerEndpoint = 'mqtt.industrialiq.ai',
  brokerPort = 8883,
  topic = 'telemetry',
  className,
}: MQTTInstructionsPanelProps) {
  const [selectedOption, setSelectedOption] = useState<InstructionOption | null>(null);

  const renderInstructions = (option: InstructionOption) => {
    switch (option) {
      case 'kepware':
        return (
          <div className="space-y-4">
            <InstructionStep step={1} title="Open IoT Gateway Configuration">
              <p>
                In KEPServerEX, right-click on <strong>IoT Gateway</strong> in the tree and select{' '}
                <strong>Add MQTT Client</strong>.
              </p>
            </InstructionStep>

            <InstructionStep step={2} title="Configure Broker Settings">
              <p>Enter your broker details:</p>
              <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs overflow-hidden">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">URL:</span>
                  <span className="font-mono text-slate-900 break-all">ssl://{brokerEndpoint}:{brokerPort}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">Topic:</span>
                  <span className="font-mono text-slate-900 break-all">{topic}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">QoS:</span>
                  <span className="font-mono text-slate-900">1</span>
                </div>
                <p className="text-amber-700 mt-2 pt-2 border-t border-slate-200">
                  <strong>Note:</strong> These are example values. Use the actual endpoint, port, and topic provided in the chat.
                </p>
              </div>
            </InstructionStep>

            <InstructionStep step={3} title="Add Tag Mapping">
              <p>
                Select the OPC tags you want to publish under <strong>Tag Browse</strong> and drag
                them to your MQTT client configuration.
              </p>
            </InstructionStep>

            <InstructionStep step={4} title="Enable and Test">
              <p>
                Enable the client and verify messages are being published using the Runtime
                Status panel.
              </p>
            </InstructionStep>

            <a
              href="https://www.kepware.com/en-us/products/kepserverex/advanced-plug-ins/iot-gateway/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Kepware IoT Gateway Documentation
            </a>
          </div>
        );

      case 'ignition':
        return (
          <div className="space-y-4">
            <InstructionStep step={1} title="Install MQTT Module">
              <p>
                Download and install the <strong>MQTT Transmission</strong> module from Cirrus Link
                in your Ignition Gateway.
              </p>
            </InstructionStep>

            <InstructionStep step={2} title="Configure MQTT Engine">
              <p>Navigate to <strong>Config → MQTT Transmission → Settings</strong> and add a new transmitter:</p>
              <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs overflow-hidden">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">Server URL:</span>
                  <span className="font-mono text-slate-900 break-all">ssl://{brokerEndpoint}:{brokerPort}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">Topic Namespace:</span>
                  <span className="font-mono text-slate-900 break-all">{topic}</span>
                </div>
                <p className="text-amber-700 mt-2 pt-2 border-t border-slate-200">
                  <strong>Note:</strong> These are example values. Use the actual endpoint, port, and topic provided in the chat.
                </p>
              </div>
            </InstructionStep>

            <InstructionStep step={3} title="Create Tag Groups">
              <p>
                In the Ignition Designer, create tag groups under <strong>MQTT Transmission</strong>{' '}
                and add the tags you want to publish.
              </p>
            </InstructionStep>

            <InstructionStep step={4} title="Configure Sparkplug Settings">
              <p>
                In the Sparkplug settings, set the <strong>Group ID</strong> to the MQTT topic that was provided in the chat.
              </p>
            </InstructionStep>

            <InstructionStep step={5} title="Verify Connection">
              <p>
                Check the Gateway Status page to confirm the MQTT connection is established and
                data is flowing.
              </p>
            </InstructionStep>

            <a
              href="https://docs.chariot.io/display/CLD/MQTT+Transmission"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              MQTT Transmission Documentation
            </a>
          </div>
        );

      case 'generic':
        return (
          <div className="space-y-4">
            <InstructionStep step={1} title="Connection Details">
              <p>Use any MQTT client library to connect with these settings:</p>
              <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs overflow-hidden">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">Broker:</span>
                  <span className="font-mono text-slate-900 break-all">{brokerEndpoint}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">Port:</span>
                  <span className="font-mono text-slate-900">{brokerPort} (TLS)</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-500">Topic:</span>
                  <span className="font-mono text-slate-900 break-all">{topic}</span>
                </div>
                <p className="text-amber-700 mt-2 pt-2 border-t border-slate-200">
                  <strong>Note:</strong> These are example values. Use the actual endpoint, port, and topic provided in the chat.
                </p>
              </div>
            </InstructionStep>

            <InstructionStep step={2} title="Message Format">
              <p>Send JSON payloads in this format:</p>
              <CopyableCode 
                code={`{
  "timestamp": ${Date.now()},
  "temperature": 72.5,
  "pressure": 101.3,
  "vibration": 0.45
}`} 
              />
            </InstructionStep>

            <InstructionStep step={3} title="Python Example">
              <CopyableCode 
                code={`import paho.mqtt.client as mqtt
import json, ssl

client = mqtt.Client()
client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
client.username_pw_set("YOUR_DEVICE_ID", "YOUR_PROFILE_KEY")
client.connect("${brokerEndpoint}", ${brokerPort})
client.publish("${topic}", json.dumps({
    "timestamp": 1234567890,
    "temperature": 72.5
}))`} 
              />
            </InstructionStep>

            <InstructionStep step={4} title="Verify Data">
              <p>
                After publishing, data should appear in your dashboard within a few seconds.
              </p>
            </InstructionStep>
          </div>
        );
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 pr-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <HelpCircle className="h-4 w-4 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">MQTT Configuration</h2>
        </div>
        <p className="text-sm text-slate-600">
          Choose your data source platform to see specific setup instructions.
        </p>
      </div>

      {/* Option Cards */}
      <div className="space-y-2 mb-6">
        {INSTRUCTION_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedOption === option.id;
          
          return (
            <button
              key={option.id}
              onClick={() => setSelectedOption(isSelected ? null : option.id)}
              className={cn(
                'w-full rounded-xl border p-4 text-left transition-all',
                isSelected
                  ? 'border-purple-300 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/50'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected ? 'bg-purple-200' : 'bg-slate-100'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isSelected ? 'text-purple-700' : 'text-slate-600'
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{option.title}</h3>
                      <span className="text-xs text-slate-500">{option.subtitle}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  'h-5 w-5 text-slate-400 transition-transform',
                  isSelected && 'rotate-90'
                )} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Instructions Content */}
      {selectedOption && (
        <div className="rounded-xl border border-purple-200 bg-white p-4">
          {renderInstructions(selectedOption)}
        </div>
      )}

      {!selectedOption && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12">
          <p className="text-sm text-slate-400">Select an option above to view setup instructions</p>
        </div>
      )}
    </div>
  );
}
