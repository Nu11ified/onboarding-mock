'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Channel {
  id: string;
  name: string;
  description: string;
  group: string | null;
  enabled: boolean;
}

interface ChannelConfigurationWidgetProps {
  onSubmit: (mapping: Record<string, string>) => void;
}

// Mock channels
const MOCK_CHANNELS: Channel[] = Array.from({ length: 15 }, (_, i) => ({
  id: `ch-${i + 1}`,
  name: `Temp-${(i + 1).toString().padStart(3, '0')}`,
  description: 'Furnace Temperature A1',
  group: 'Temperature Sensors',
  enabled: true,
}));

export function ChannelConfigurationWidget({ onSubmit }: ChannelConfigurationWidgetProps) {
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [groups, setGroups] = useState<string[]>(['Temperature Sensors', 'Vibration', 'Pressure']);
  const [page, setPage] = useState(1);
  
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(channels.length / PAGE_SIZE);
  const currentChannels = channels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleChannel = (id: string) => {
    setChannels(prev => prev.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const handleGroupChange = (id: string, newGroup: string) => {
    setChannels(prev => prev.map(c => 
      c.id === id ? { ...c, group: newGroup } : c
    ));
  };

  const handleSubmit = () => {
    const mapping = channels.reduce((acc, curr) => {
      if (curr.enabled && curr.group) {
        acc[curr.name] = curr.group;
      }
      return acc;
    }, {} as Record<string, string>);
    onSubmit(mapping);
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-white p-5 shadow-sm w-full max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-slate-900">
          Configure Your Channels
        </h3>
        <p className="text-sm font-medium text-slate-700 mt-1">
          Select, group, or disable channels as needed
        </p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          You can modify your channel setup below. Group related channels or disable any you don&apos;t need before continuing.
        </p>
      </div>

      {/* Channels List */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Channels
        </label>
        <div className="space-y-3">
          {currentChannels.map((channel) => (
            <div 
              key={channel.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-white"
            >
              <Switch
                checked={channel.enabled}
                onCheckedChange={() => handleToggleChannel(channel.id)}
              />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {channel.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {channel.description}
                </p>
              </div>

              <div className="relative w-36 shrink-0">
                <select
                  value={channel.group || ''}
                  onChange={(e) => handleGroupChange(channel.id, e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:border-purple-400 focus:outline-none pr-8"
                >
                  {groups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="text-sm font-medium text-slate-900">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-500"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Footer Action */}
      <Button 
        onClick={handleSubmit}
        className="w-full rounded-xl bg-purple-700 py-6 text-base font-semibold hover:bg-purple-800"
      >
        Save Configuration
      </Button>
    </div>
  );
}
