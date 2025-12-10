'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Channel {
  id: number;
  name: string;
  group: string;
  enabled: boolean;
}

interface ChannelConfigurationWidgetProps {
  onSubmit: (mapping: Record<string, string>) => void;
}

// Realistic sensor channel names
const CHANNEL_NAMES = [
  'Gyro X', 'Gyro Y', 'Gyro Z',
  'Accel X', 'Accel Y', 'Accel Z',
  'Vibration X', 'Vibration Y', 'Vibration Z',
  'Temperature', 'Pressure', 'Humidity',
  'Current', 'Voltage', 'RPM',
];

const INITIAL_GROUPS = ['Motion', 'Environmental', 'Electrical'];

const MOCK_CHANNELS: Channel[] = CHANNEL_NAMES.map((name, i) => ({
  id: i + 1,
  name,
  group: i < 9 ? 'Motion' : i < 12 ? 'Environmental' : 'Electrical',
  enabled: true,
}));

export function ChannelConfigurationWidget({ onSubmit }: ChannelConfigurationWidgetProps) {
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [groups, setGroups] = useState<string[]>(INITIAL_GROUPS);
  const [page, setPage] = useState(1);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);
  
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(channels.length / PAGE_SIZE);
  const currentChannels = channels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleChannel = (id: number) => {
    setChannels(prev => prev.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const handleGroupChange = (id: number, newGroup: string) => {
    setChannels(prev => prev.map(c => 
      c.id === id ? { ...c, group: newGroup } : c
    ));
  };

  const handleAddGroup = () => {
    if (newGroupName.trim() && !groups.includes(newGroupName.trim())) {
      setGroups(prev => [...prev, newGroupName.trim()]);
      setNewGroupName('');
      setShowAddGroup(false);
    }
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
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">
          Configure Your Channels
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Organize channels into groups. Each group will have its own health score.
        </p>
      </div>

      {/* Groups Management */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Groups
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-purple-400 focus:outline-none pr-8"
              defaultValue=""
            >
              <option value="" disabled>View groups ({groups.length})</option>
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {!showAddGroup ? (
            <button
              onClick={() => setShowAddGroup(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
              title="Add new group"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                placeholder="Group name"
                className="w-28 rounded-lg border border-purple-200 px-2 py-1.5 text-sm focus:border-purple-400 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { setShowAddGroup(false); setNewGroupName(''); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Channels List */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Channels
        </label>
        <div className="space-y-2">
          {currentChannels.map((channel) => (
            <div 
              key={channel.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-white"
            >
              <Switch
                checked={channel.enabled}
                onCheckedChange={() => handleToggleChannel(channel.id)}
              />
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-medium text-slate-600">
                  {channel.id}
                </span>
                <p className="text-sm font-medium text-slate-900 truncate">
                  {channel.name}
                </p>
              </div>

              <div className="relative w-32 shrink-0">
                <select
                  value={channel.group}
                  onChange={(e) => handleGroupChange(channel.id, e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 focus:border-purple-400 focus:outline-none pr-6"
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
