// ─── Waitlist ─────────────────────────────────────────────────────────────────

export interface WaitlistFormData {
  firstName: string;
  email: string;
  universityName: string;
  phone: string;
  level: string;
  country: string;
}

export interface WaitlistFormErrors {
  firstName?: string;
  email?: string;
  universityName?: string;
  phone?: string;
  level?: string;
  country?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UploadResponse {
  url: string;
  key: string;
}

// ─── Geo ──────────────────────────────────────────────────────────────────────

export interface GeoResult {
  name: string;
  code: string;
}
