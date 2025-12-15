# Demo Machine Training Fix Instructions

The demo machine onboarding was getting stuck at 0% due to localStorage cache conflicts. Here's what was fixed:

## Issues Fixed:

1. **Device Status Widget Fallback**: Added fallback deviceId generation when deviceId is missing
2. **API Integration**: Updated spawn-demo-device action to call the device API  
3. **Cache Conflicts**: Fixed localStorage persistence issues

## Quick Fix (if still stuck):

Open browser console (F12) and run:

```javascript
// Clear all device status cache
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('device_status_') || 
      key.includes('onboarding_') || 
      key.includes('training_')) {
    localStorage.removeItem(key);
  }
});

// Clear chat history
localStorage.removeItem('onboarding_chat_messages');
localStorage.removeItem('onboarding_state');

console.log('Cache cleared! Refresh the page.');
```

Then refresh the page and restart onboarding.

## What Was Changed:

1. **WidgetRenderer.tsx**: Added fallback deviceId generation for demo mode
2. **actions.ts**: Integrated with device API for proper device spawning  
3. **DeviceStatusWidget.tsx**: Improved localStorage conflict handling

The demo should now progress smoothly from:
- 0% → Starting Container (1-2 seconds)
- 1-99% → Training Model (progresses smoothly)  
- 100% → Training Complete (auto-advances to next step)

The device ID will now be generated consistently and cached properly without conflicts.