
import DOMPurify from 'dompurify';

/**
 * Sanitizes string input to prevent Cross-Site Scripting (XSS) attacks.
 * Uses DOMPurify to strip dangerous tags (script, iframe, object, etc).
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return DOMPurify.sanitize(input);
};

/**
 * Validates that an ID is numeric and 4 digits (specific to ADT logic)
 */
export const validateId = (id: string): boolean => {
  const regex = /^\d{4}$/;
  return regex.test(id);
};

/**
 * Simple obfuscation for local storage data (Not true encryption, but prevents casual snooping)
 * In a real production app, sensitive data should not be stored in LocalStorage at all.
 */
export const encryptLocal = (data: any): string => {
  try {
    return btoa(JSON.stringify(data));
  } catch (e) {
    return '';
  }
};

export const decryptLocal = (data: string): any => {
  try {
    return JSON.parse(atob(data));
  } catch (e) {
    return null;
  }
};
