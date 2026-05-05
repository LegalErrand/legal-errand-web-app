import type { GeoResult } from './types';

export async function detectCountry(): Promise<GeoResult> {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      cache: 'no-store',
    });
    if (!res.ok) return { name: '', code: '' };
    const data = await res.json();
    return {
      name: (data.country_name as string) ?? '',
      code: (data.country_code as string) ?? '',
    };
  } catch {
    return { name: '', code: '' };
  }
}
