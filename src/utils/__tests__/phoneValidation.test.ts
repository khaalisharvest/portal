/**
 * Test cases for Pakistani phone number validation
 * This demonstrates that all formats are correctly normalized to +923001234567
 */

import { validatePakistaniPhone, formatForSMS, isReadyForSMS } from '../phoneValidation';

// Test cases
const testCases = [
  // International format (should remain unchanged)
  { input: '+923001234567', expected: '+923001234567', description: 'International format' },
  { input: '+92 300 123 4567', expected: '+923001234567', description: 'International with spaces' },
  { input: '+92-300-123-4567', expected: '+923001234567', description: 'International with dashes' },
  
  // National format (should add country code)
  { input: '03001234567', expected: '+923001234567', description: 'National format' },
  { input: '03 001 234 567', expected: '+923001234567', description: 'National with spaces' },
  { input: '03-001-234-567', expected: '+923001234567', description: 'National with dashes' },
  
  // Without country code (should add country code)
  { input: '3001234567', expected: '+923001234567', description: 'Without country code' },
  { input: '3 001 234 567', expected: '+923001234567', description: 'Without country code with spaces' },
  
  // Invalid cases
  { input: '+1234567890', expected: null, description: 'Wrong country code' },
  { input: '0300123456', expected: null, description: 'Too short' },
  { input: '030012345678', expected: null, description: 'Too long' },
  { input: '1234567890', expected: null, description: 'Wrong starting digit' },
  { input: '', expected: null, description: 'Empty string' },
];

console.log('🧪 Testing Pakistani Phone Number Validation\n');

testCases.forEach(({ input, expected, description }) => {
  const result = validatePakistaniPhone(input);
  const isValid = result.isValid && result.normalizedNumber === expected;
  
  console.log(`${isValid ? '✅' : '❌'} ${description}:`);
  console.log(`   Input: "${input}"`);
  console.log(`   Expected: "${expected}"`);
  console.log(`   Got: "${result.normalizedNumber}"`);
  console.log(`   Valid: ${result.isValid}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  console.log('');
});

// Test SMS/WhatsApp compatibility
console.log('📱 Testing SMS/WhatsApp Compatibility\n');

const smsTestCases = [
  '+923001234567',
  '03001234567',
  '3001234567',
  '+1234567890', // Invalid
];

smsTestCases.forEach(phone => {
  const isReady = isReadyForSMS(phone);
  const formatted = isReady ? formatForSMS(phone) : 'N/A';
  
  console.log(`${isReady ? '✅' : '❌'} Phone: "${phone}"`);
  console.log(`   Ready for SMS/WhatsApp: ${isReady}`);
  console.log(`   Formatted: "${formatted}"`);
  console.log('');
});

export {}; // Make this a module
