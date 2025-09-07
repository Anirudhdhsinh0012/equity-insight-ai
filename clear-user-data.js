// Simple script to clear user data for testing
// Run this in browser console to reset all user data

console.log('Clearing all user stock data...');

// Get all localStorage keys
const keys = Object.keys(localStorage);

// Find and remove all user stock data
keys.forEach(key => {
  if (key.startsWith('stocks_')) {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  }
});

console.log('User stock data cleared. Refresh the page to see changes.');
