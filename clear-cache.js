// Clear onboarding cache - run this in browser console
try {
  // Clear device status cache
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('device_status_')) {
      console.log('Removing:', key);
      localStorage.removeItem(key);
    }
  });
  
  // Clear onboarding state
  localStorage.removeItem('onboarding_state');
  localStorage.removeItem('onboarding_chat_messages');
  localStorage.removeItem('onboarding_machine');
  localStorage.removeItem('training_complete');
  
  console.log('Cache cleared! Refresh the page to restart onboarding.');
} catch (e) {
  console.error('Error clearing cache:', e);
}