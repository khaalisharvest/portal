/**
 * Pakistani Phone Number Validation Utility
 * Supports both formats but ALWAYS normalizes to international format with country code:
 * - International: +923001234567 → +923001234567
 * - National: 03001234567 → +923001234567
 * 
 * This ensures compatibility with:
 * - SMS verification services
 * - WhatsApp API integration
 * - International communication
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedNumber: string;
  error?: string;
}

/**
 * Validates and normalizes Pakistani phone numbers
 * @param phoneNumber - The phone number to validate
 * @returns PhoneValidationResult with validation status and normalized number
 */
export function validatePakistaniPhone(phoneNumber: string): PhoneValidationResult {
  // Remove all spaces, dashes, and parentheses
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Check if empty
  if (!cleaned) {
    return {
      isValid: false,
      normalizedNumber: '',
      error: 'Phone number is required'
    };
  }

  // Pakistani mobile number patterns
  const patterns = {
    // International format: +923001234567
    international: /^\+92(3[0-9]{9})$/,
    // National format: 03001234567
    national: /^(03[0-9]{9})$/,
    // Without country code: 3001234567
    withoutCountryCode: /^(3[0-9]{9})$/
  };

  // Check international format
  if (patterns.international.test(cleaned)) {
    return {
      isValid: true,
      normalizedNumber: cleaned // Already in correct format: +923001234567
    };
  }

  // Check national format (03xxxxxxxxx)
  if (patterns.national.test(cleaned)) {
    const normalized = '+92' + cleaned.substring(1); // Convert 03001234567 to +923001234567
    return {
      isValid: true,
      normalizedNumber: normalized // Always returns with country code for SMS/WhatsApp
    };
  }

  // Check without country code (3xxxxxxxxx)
  if (patterns.withoutCountryCode.test(cleaned)) {
    const normalized = '+92' + cleaned; // Convert 3001234567 to +923001234567
    return {
      isValid: true,
      normalizedNumber: normalized // Always returns with country code for SMS/WhatsApp
    };
  }

  // Invalid format
  return {
    isValid: false,
    normalizedNumber: '',
    error: 'Please enter a valid Pakistani phone number'
  };
}

/**
 * Formats a phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number string
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  const validation = validatePakistaniPhone(phoneNumber);
  
  if (!validation.isValid) {
    return phoneNumber; // Return original if invalid
  }

  // Format as +92 300 123 4567
  const number = validation.normalizedNumber;
  if (number.startsWith('+92')) {
    const digits = number.substring(3);
    return `+92 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
  }

  return number;
}

/**
 * Gets placeholder text for phone input
 * @returns Placeholder string
 */
export function getPhonePlaceholder(): string {
  return '+923001234567';
}

/**
 * Gets help text for phone input
 * @returns Help text string
 */
export function getPhoneHelpText(): string {
  return ''; // No help text needed - placeholder is sufficient
}

/**
 * Ensures phone number is in the correct format for SMS/WhatsApp APIs
 * @param phoneNumber - The phone number to format
 * @returns Phone number in international format with country code
 */
export function formatForSMS(phoneNumber: string): string {
  const validation = validatePakistaniPhone(phoneNumber);
  
  if (!validation.isValid) {
    throw new Error(`Invalid phone number: ${validation.error}`);
  }

  return validation.normalizedNumber; // Always returns +923001234567 format
}

/**
 * Validates if a phone number is ready for SMS/WhatsApp integration
 * @param phoneNumber - The phone number to check
 * @returns True if ready for SMS/WhatsApp APIs
 */
export function isReadyForSMS(phoneNumber: string): boolean {
  const validation = validatePakistaniPhone(phoneNumber);
  return validation.isValid && validation.normalizedNumber.startsWith('+92');
}
