// ─── Waitlist ─────────────────────────────────────────────────────────────────

export const LEVELS = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
  '500 Level',
  'Final Year',
] as const;

export const TOTAL_SPOTS = 100;
export const SPOTS_TAKEN = 40;
export const SPOTS_LEFT = TOTAL_SPOTS - SPOTS_TAKEN;

// ─── Hero copy ────────────────────────────────────────────────────────────────

export const FEATURES = [
  'AI that breaks down any judgment, ratio decidendi, obiter dicta, key principles in plain English.',
  'Exam prep tailored to Nigerian Bar and semester exams with practice questions and model answers.',
  'Search thousands of Nigerian court judgments and legal precedents instantly.',
  'Study guides for contracts, torts, criminal law, constitutional law and more.',
] as const;

export const STATS = [
  { value: '100', label: 'Free Founding Spots' },
  { value: '3+', label: 'Study Tools Built' },
  { value: '0', label: 'Cost to Join' },
] as const;

// ─── Social share ─────────────────────────────────────────────────────────────

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://legalerrand.com';

export const WHATSAPP_SHARE_TEXT =
  `Hey! I just joined the waitlist for LegalErrand Academy — the AI study platform built for law students. Get your free founding member spot before it's gone: ${siteUrl}`;

// ─── Countries (ISO 3166-1) ───────────────────────────────────────────────────

export const COUNTRIES = [
  { name: 'Afghanistan', code: 'AF' },
  { name: 'Albania', code: 'AL' },
  { name: 'Algeria', code: 'DZ' },
  { name: 'Angola', code: 'AO' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Australia', code: 'AU' },
  { name: 'Austria', code: 'AT' },
  { name: 'Bangladesh', code: 'BD' },
  { name: 'Belgium', code: 'BE' },
  { name: 'Benin', code: 'BJ' },
  { name: 'Bolivia', code: 'BO' },
  { name: 'Botswana', code: 'BW' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Cameroon', code: 'CM' },
  { name: 'Canada', code: 'CA' },
  { name: 'Chad', code: 'TD' },
  { name: 'Chile', code: 'CL' },
  { name: 'China', code: 'CN' },
  { name: 'Colombia', code: 'CO' },
  { name: 'Congo (DRC)', code: 'CD' },
  { name: "Côte d'Ivoire", code: 'CI' },
  { name: 'Denmark', code: 'DK' },
  { name: 'Ecuador', code: 'EC' },
  { name: 'Egypt', code: 'EG' },
  { name: 'Ethiopia', code: 'ET' },
  { name: 'Finland', code: 'FI' },
  { name: 'France', code: 'FR' },
  { name: 'Gambia', code: 'GM' },
  { name: 'Germany', code: 'DE' },
  { name: 'Ghana', code: 'GH' },
  { name: 'Greece', code: 'GR' },
  { name: 'Guinea', code: 'GN' },
  { name: 'India', code: 'IN' },
  { name: 'Indonesia', code: 'ID' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Israel', code: 'IL' },
  { name: 'Italy', code: 'IT' },
  { name: 'Jamaica', code: 'JM' },
  { name: 'Japan', code: 'JP' },
  { name: 'Jordan', code: 'JO' },
  { name: 'Kenya', code: 'KE' },
  { name: 'Liberia', code: 'LR' },
  { name: 'Libya', code: 'LY' },
  { name: 'Madagascar', code: 'MG' },
  { name: 'Malawi', code: 'MW' },
  { name: 'Malaysia', code: 'MY' },
  { name: 'Mali', code: 'ML' },
  { name: 'Mauritius', code: 'MU' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Morocco', code: 'MA' },
  { name: 'Mozambique', code: 'MZ' },
  { name: 'Namibia', code: 'NA' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'New Zealand', code: 'NZ' },
  { name: 'Niger', code: 'NE' },
  { name: 'Nigeria', code: 'NG' },
  { name: 'Norway', code: 'NO' },
  { name: 'Pakistan', code: 'PK' },
  { name: 'Peru', code: 'PE' },
  { name: 'Philippines', code: 'PH' },
  { name: 'Poland', code: 'PL' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Romania', code: 'RO' },
  { name: 'Russia', code: 'RU' },
  { name: 'Rwanda', code: 'RW' },
  { name: 'Saudi Arabia', code: 'SA' },
  { name: 'Senegal', code: 'SN' },
  { name: 'Sierra Leone', code: 'SL' },
  { name: 'Singapore', code: 'SG' },
  { name: 'Somalia', code: 'SO' },
  { name: 'South Africa', code: 'ZA' },
  { name: 'South Korea', code: 'KR' },
  { name: 'Spain', code: 'ES' },
  { name: 'Sri Lanka', code: 'LK' },
  { name: 'Sudan', code: 'SD' },
  { name: 'Sweden', code: 'SE' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'Tanzania', code: 'TZ' },
  { name: 'Thailand', code: 'TH' },
  { name: 'Togo', code: 'TG' },
  { name: 'Trinidad and Tobago', code: 'TT' },
  { name: 'Tunisia', code: 'TN' },
  { name: 'Turkey', code: 'TR' },
  { name: 'Uganda', code: 'UG' },
  { name: 'Ukraine', code: 'UA' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'United States', code: 'US' },
  { name: 'Uruguay', code: 'UY' },
  { name: 'Venezuela', code: 'VE' },
  { name: 'Vietnam', code: 'VN' },
  { name: 'Zambia', code: 'ZM' },
  { name: 'Zimbabwe', code: 'ZW' },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];
