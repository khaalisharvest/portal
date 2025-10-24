// Validation schemas and functions

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateName = (name: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    errors.push('Name can only contain letters and spaces');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateRequired = (value: any, fieldName: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters long`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (value.length > maxLength) {
    errors.push(`${fieldName} must be less than ${maxLength} characters long`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateNumber = (value: any, fieldName: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (isNaN(value) || value === null || value === undefined) {
    errors.push(`${fieldName} must be a valid number`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMinValue = (value: number, minValue: number, fieldName: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (value < minValue) {
    errors.push(`${fieldName} must be at least ${minValue}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMaxValue = (value: number, maxValue: number, fieldName: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (value > maxValue) {
    errors.push(`${fieldName} must be less than ${maxValue}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateFileSize = (file: File, maxSize: number): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateFileType = (file: File, allowedTypes: string[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Combined validation function
export const validateForm = (data: Record<string, any>, rules: Record<string, any>): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  let isValid = true;
  
  for (const [field, value] of Object.entries(data)) {
    const fieldRules = rules[field];
    if (!fieldRules) continue;
    
    const fieldErrors: string[] = [];
    
    for (const rule of fieldRules) {
      const result = rule(value, field);
      if (!result.isValid) {
        fieldErrors.push(...result.errors);
        isValid = false;
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }
  
  return { isValid, errors };
};
