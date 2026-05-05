import type { WaitlistFormData, WaitlistFormErrors } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s\+\-\(\)]{7,20}$/;

export function validateWaitlistForm(data: WaitlistFormData): WaitlistFormErrors {
  const errors: WaitlistFormErrors = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_RE.test(data.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!data.universityName.trim()) {
    errors.universityName = 'University name is required';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!PHONE_RE.test(data.phone)) {
    errors.phone = 'Enter a valid phone number';
  }

  if (!data.level) {
    errors.level = 'Please select your level';
  }

  if (!data.country) {
    errors.country = 'Please select your country';
  }

  return errors;
}
