import type { WaitlistFormData, WaitlistFormErrors } from './types';

export interface SignupFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface BioDataFormErrors {
  country?: string;
  city?: string;
  schoolName?: string;
  levelYear?: string;
  phoneNumber?: string;
}

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

export function validateSignupFields(params: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): SignupFormErrors {
  const errors: SignupFormErrors = {};
  if (!params.firstName.trim()) errors.firstName = 'First name is required.';
  if (!params.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!params.email.trim()) errors.email = 'School email is required.';
  else if (!EMAIL_RE.test(params.email.trim())) errors.email = 'Enter a valid email address.';
  if (!params.password) errors.password = 'Password is required.';
  else if (params.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  return errors;
}

export function validateBioDataFields(params: {
  country: string;
  city: string;
  schoolName: string;
  levelYear: string;
  phoneDigits: string;
}): BioDataFormErrors {
  const errors: BioDataFormErrors = {};
  if (!params.country.trim()) errors.country = 'Country is required.';
  if (!params.city.trim()) errors.city = 'City is required.';
  if (!params.schoolName.trim()) errors.schoolName = 'School name is required.';
  if (!params.levelYear.trim()) errors.levelYear = 'Level or year is required.';
  const digits = params.phoneDigits.replace(/\D/g, '');
  if (digits.length < 10) errors.phoneNumber = 'Enter a valid phone number.';
  return errors;
}
