import type {
  ApiResponse,
  PaginatedResponse,
  WaitlistFormData,
  LoginRequest,
  LoginResponseData,
  RegisterRequest,
  VerifyEmailRequest,
  VerifyEmailResponseData,
  VerifyOtpResponse,
  QuestionStats,
  HealthResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
  UploadCompleteRequest,
  UpdateBioDataRequest,
  UpdateAvatarRequest,
  AvatarUrlData,
  LibraryDocument,
  SignedUrlData,
  BookmarkData,
  DashboardData,
  Goal,
  ActivityItem,
  Question,
  QuestionAttempt,
  Note,
  NoteTemplate,
  NoteAnalysis,
  CreateNoteRequest,
  CaseExplanation,
  CaseHistoryItem,
  ExplainCaseRequest,
  ResearchSession,
  SearchResearchRequest,
  SearchResearchResponse,
  AiConversation,
  AiConversationDetail,
  AiChatRequest,
  AiChatResponse,
  SocraticStartRequest,
  SocraticStartResponse,
  SocraticRespondRequest,
  AuthUserSummary,
  AchievementsData,
  ReasoningScoreData,
} from './types';

import { getAccessToken } from './authStorage';
import { forceLogoutToLogin } from './session';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3003/api/v1';

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/google',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-verification-otp',
  '/auth/forgot-password',
  '/auth/verify-otp',
  '/auth/reset-password',
];

function isPublicAuthPath(path: string): boolean {
  const pathname = path.split('?')[0];
  return PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function handleUnauthorized(path: string, headers: Headers): void {
  if (isPublicAuthPath(path)) return;
  const sentAuth = headers.has('Authorization');
  if (sentAuth || getAccessToken()) {
    forceLogoutToLogin();
  }
}

/** User-facing message from thrown API/network errors. */
export function getFetchErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    // Network-level errors (connection refused, DNS failure, etc.)
    const msg = error.message.toLowerCase();
    if (
      msg.includes('fetch failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network request failed') ||
      msg.includes('econnrefused')
    ) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    try {
      const parsed = JSON.parse(error.message) as { message?: string; error?: string };
      if (parsed.error && parsed.message && /failed|error/i.test(parsed.message)) {
        // Prefer the specific validation/detail when the top-level message is generic.
        return parsed.error.length < 180 ? parsed.error : parsed.message;
      }
      return parsed.message ?? parsed.error ?? error.message;
    } catch {
      return error.message;
    }
  }
  return 'Something went wrong. Please try again.';
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { headers: incomingHeaders, ...rest } = options;

  const mergedHeaders = new Headers();
  if (incomingHeaders) {
    new Headers(incomingHeaders).forEach((value, key) => {
      if (key.toLowerCase() === 'content-type') return;
      mergedHeaders.set(key, value);
    });
  }
  mergedHeaders.set('Content-Type', 'application/json; charset=utf-8');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorized(path, mergedHeaders);
    }
    const body = await res.text().catch(() => res.statusText);
    throw new Error(body || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export async function submitWaitlist(data: WaitlistFormData): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/waitlist', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

// ─── Generic GET with revalidation ───────────────────────────────────────────

export async function fetchWithCache<T>(path: string, revalidate = 60): Promise<T> {
  return apiFetch<T>(path, {
    next: { revalidate },
  } as RequestInit);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponseData>> {
  return apiFetch<ApiResponse<LoginResponseData>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

export async function googleAuth(data: {
  accessToken: string;
  accountType?: 'Undergraduate' | 'Law School Student';
  referralCode?: string;
}): Promise<ApiResponse<LoginResponseData>> {
  return apiFetch<ApiResponse<LoginResponseData>>('/auth/google', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

export async function register(data: RegisterRequest): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

export async function verifyEmail(
  data: VerifyEmailRequest
): Promise<ApiResponse<VerifyEmailResponseData>> {
  return apiFetch<ApiResponse<VerifyEmailResponseData>>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

export async function resendVerificationOtp(email: string): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/auth/resend-verification-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });
}

export async function forgotPassword(email: string): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<ApiResponse<VerifyOtpResponse>> {
  return apiFetch<ApiResponse<VerifyOtpResponse>>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
    cache: 'no-store',
  });
}

export async function resetPassword(resetToken: string, newPassword: string): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword }),
    cache: 'no-store',
  });
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<HealthResponse> {
  return fetchWithCache<HealthResponse>('/health', 60);
}

// ─── Library ──────────────────────────────────────────────────────────────────

export async function getUploadUrl(
  data: PresignedUrlRequest,
  token: string
): Promise<ApiResponse<PresignedUrlResponse>> {
  return apiFetch<ApiResponse<PresignedUrlResponse>>('/library/upload-url', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

export async function completeUpload(
  data: UploadCompleteRequest,
  token: string
): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/library/upload/complete', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

// ─── User ─────────────────────────────────────────────────────────────────────

/** Ensures every field exists so backends can destructure `req.body` safely. */
function serializeBioDataBody(data: UpdateBioDataRequest): string {
  return JSON.stringify({
    username: data.username ?? '',
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    country: data.country ?? '',
    city: data.city ?? '',
    schoolName: data.schoolName ?? '',
    levelYear: data.levelYear ?? '',
    matricNumber: data.matricNumber ?? '',
    phoneNumber: data.phoneNumber ?? '',
  });
}

export async function updateBioData(
  data: UpdateBioDataRequest,
  token: string
): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/user/bio-data', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: serializeBioDataBody(data),
    cache: 'no-store',
  });
}

export async function updateAvatar(data: UpdateAvatarRequest, token: string): Promise<ApiResponse> {
  return apiFetch<ApiResponse>('/user/avatar', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

// ─── Authed GET/POST/PUT/DELETE helpers ───────────────────────────────────────

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function authedGet<T>(
  path: string,
  token: string,
  qs?: Record<string, string | number | undefined>
): Promise<T> {
  const params = qs
    ? new URLSearchParams(
        Object.entries(qs)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch<T>(`${path}${params ? `?${params}` : ''}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });
}

async function authedPost<T>(path: string, token: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    headers: authHeaders(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function authedPut<T>(path: string, token: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    headers: authHeaders(token),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function authedDelete<T>(path: string, token: string): Promise<T> {
  return apiFetch<T>(path, {
    method: 'DELETE',
    headers: authHeaders(token),
    cache: 'no-store',
  });
}

// ─── Auth: current user ───────────────────────────────────────────────────────

export function getCurrentUser(token: string): Promise<ApiResponse<AuthUserSummary>> {
  return authedGet<ApiResponse<AuthUserSummary>>('/auth/me', token);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getDashboard(token: string): Promise<ApiResponse<DashboardData>> {
  return authedGet<ApiResponse<DashboardData>>('/dashboard', token);
}

export function getDashboardGoals(token: string): Promise<ApiResponse<Goal[]>> {
  return authedGet<ApiResponse<Goal[]>>('/dashboard/goals', token);
}

export function getDashboardActivity(
  token: string,
  params?: { type?: string; page?: number; limit?: number }
): Promise<ApiResponse<ActivityItem[]>> {
  return authedGet(
    '/dashboard/activity',
    token,
    params as Record<string, string | number | undefined>
  );
}

// ─── Questions ────────────────────────────────────────────────────────────────

export function getRandomQuestion(token: string, subject?: string): Promise<ApiResponse<Question>> {
  return authedGet<ApiResponse<Question>>(
    '/questions/random',
    token,
    subject ? { subject } : undefined
  );
}

export function submitAnswer(
  id: string,
  answer: string,
  token: string
): Promise<ApiResponse<QuestionAttempt>> {
  return authedPost<ApiResponse<QuestionAttempt>>(`/questions/${id}/submit`, token, { answer });
}

// ─── Library ──────────────────────────────────────────────────────────────────

export function getLibraryDocuments(
  token: string,
  params?: { subject?: string; type?: string; search?: string; page?: number; limit?: number }
): Promise<ApiResponse<LibraryDocument[]>> {
  return authedGet('/library', token, params as Record<string, string | number | undefined>);
}

export function getMyDocuments(
  token: string,
  params?: { search?: string; page?: number; limit?: number }
): Promise<ApiResponse<LibraryDocument[]>> {
  return authedGet(
    '/library/my-documents',
    token,
    params as Record<string, string | number | undefined>
  );
}

export function getLibraryDocument(
  id: string,
  token: string
): Promise<ApiResponse<LibraryDocument>> {
  return authedGet<ApiResponse<LibraryDocument>>(`/library/${id}`, token);
}

export function getSignedDownloadUrl(
  id: string,
  token: string
): Promise<ApiResponse<SignedUrlData>> {
  return authedGet<ApiResponse<SignedUrlData>>(`/library/${id}/access`, token);
}

export function toggleBookmark(id: string, token: string): Promise<ApiResponse<BookmarkData>> {
  return authedPost<ApiResponse<BookmarkData>>(`/library/${id}/bookmark`, token);
}

export function deleteDocument(id: string, token: string): Promise<ApiResponse> {
  return authedDelete<ApiResponse>(`/library/${id}`, token);
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export function getNotes(
  token: string,
  params?: { subject?: string; folder?: string; search?: string; page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Note>>> {
  return authedGet('/notes', token, params as Record<string, string | number | undefined>);
}

export function getNoteTemplates(token: string): Promise<ApiResponse<NoteTemplate[]>> {
  return authedGet<ApiResponse<NoteTemplate[]>>('/notes/templates', token);
}

export function getNote(id: string, token: string): Promise<ApiResponse<Note>> {
  return authedGet<ApiResponse<Note>>(`/notes/${id}`, token);
}

export function createNote(data: CreateNoteRequest, token: string): Promise<ApiResponse<Note>> {
  return authedPost<ApiResponse<Note>>('/notes', token, data);
}

export function updateNote(
  id: string,
  data: Partial<CreateNoteRequest>,
  token: string
): Promise<ApiResponse<Note>> {
  return authedPut<ApiResponse<Note>>(`/notes/${id}`, token, data);
}

export function deleteNote(id: string, token: string): Promise<ApiResponse> {
  return authedDelete<ApiResponse>(`/notes/${id}`, token);
}

export function analyzeNote(id: string, token: string): Promise<ApiResponse<NoteAnalysis>> {
  return authedPost<ApiResponse<NoteAnalysis>>(`/notes/${id}/analyze`, token);
}

export function summarizeNote(
  id: string,
  token: string
): Promise<ApiResponse<{ summary: string }>> {
  return authedPost<ApiResponse<{ summary: string }>>(`/notes/${id}/summarize`, token);
}

// ─── Case Explainer ───────────────────────────────────────────────────────────

export function explainCase(
  data: ExplainCaseRequest,
  token: string
): Promise<ApiResponse<CaseExplanation>> {
  return authedPost<ApiResponse<CaseExplanation>>('/ai/explain-case', token, data);
}

export function getCaseExplainerHistory(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<CaseHistoryItem>>> {
  return authedGet(
    '/ai/case-explainer/history',
    token,
    params as Record<string, number | undefined>
  );
}

export function getCaseExplanation(
  id: string,
  token: string
): Promise<ApiResponse<CaseExplanation>> {
  return authedGet<ApiResponse<CaseExplanation>>(`/ai/case-explainer/${id}`, token);
}

export function saveCaseToNotes(id: string, token: string): Promise<ApiResponse<Note>> {
  return authedPost<ApiResponse<Note>>(`/ai/case-explainer/${id}/save-to-notes`, token);
}

// ─── Research ─────────────────────────────────────────────────────────────────

export function searchResearch(
  data: SearchResearchRequest,
  token: string
): Promise<ApiResponse<SearchResearchResponse>> {
  return authedPost<ApiResponse<SearchResearchResponse>>('/research/search', token, data);
}

export function getResearchSessions(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<ResearchSession>>> {
  return authedGet('/research/sessions', token, params as Record<string, number | undefined>);
}

export function getResearchSession(
  id: string,
  token: string
): Promise<ApiResponse<ResearchSession>> {
  return authedGet<ApiResponse<ResearchSession>>(`/research/sessions/${id}`, token);
}

export function deleteResearchSession(id: string, token: string): Promise<ApiResponse> {
  return authedDelete<ApiResponse>(`/research/sessions/${id}`, token);
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────

export function sendAiChat(
  data: AiChatRequest,
  token: string
): Promise<ApiResponse<AiChatResponse>> {
  return authedPost<ApiResponse<AiChatResponse>>('/ai/chat', token, data);
}

/** Stream AI chat via SSE. Yields `chunk` strings until `done: true`. */
export async function* streamAiChat(
  data: AiChatRequest,
  token: string,
  signal?: AbortSignal
): AsyncGenerator<{ chunk?: string; done?: boolean; sessionId?: string; error?: string }> {
  const url = `${BASE_URL}/ai/chat/stream`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      cache: 'no-store',
      signal,
    });
  } catch (err) {
    if (signal?.aborted) {
      yield { error: 'Request cancelled' };
      return;
    }
    yield { error: getFetchErrorMessage(err) };
    return;
  }

  if (!response.ok || !response.body) {
    if (response.status === 401) {
      forceLogoutToLogin();
    }
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.text();
      if (body) {
        try {
          const parsed = JSON.parse(body) as { message?: string; error?: string };
          detail = parsed.message || parsed.error || body.slice(0, 200);
        } catch {
          detail = body.slice(0, 200);
        }
      }
    } catch {
      /* ignore */
    }
    yield { error: detail };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6)) as {
            chunk?: string;
            done?: boolean;
            sessionId?: string;
            error?: string;
          };
        } catch {
          /* skip malformed line */
        }
      }
    }
  }
}

export function getAiConversations(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<AiConversation[] | PaginatedResponse<AiConversation>>> {
  return authedGet('/ai/conversations', token, params as Record<string, number | undefined>);
}

export function getAiConversation(
  sessionId: string,
  token: string
): Promise<ApiResponse<AiConversationDetail>> {
  return authedGet<ApiResponse<AiConversationDetail>>(`/ai/conversations/${sessionId}`, token);
}

export function deleteAiConversation(sessionId: string, token: string): Promise<ApiResponse> {
  return authedDelete<ApiResponse>(`/ai/conversations/${sessionId}`, token);
}

// ─── AI Socratic ──────────────────────────────────────────────────────────────

export function startSocraticSession(
  data: SocraticStartRequest,
  token: string
): Promise<ApiResponse<SocraticStartResponse>> {
  return authedPost<ApiResponse<SocraticStartResponse>>('/ai/socratic/start', token, data);
}

export function respondSocratic(
  data: SocraticRespondRequest,
  token: string
): Promise<ApiResponse<{ aiResponse: string; hintsUsed: number }>> {
  return authedPost<ApiResponse<{ aiResponse: string; hintsUsed: number }>>(
    '/ai/socratic/respond',
    token,
    data
  );
}

export function endSocraticSession(
  sessionId: string,
  token: string
): Promise<ApiResponse<{ summary: string; score: number }>> {
  return authedPost<ApiResponse<{ summary: string; score: number }>>('/ai/socratic/end', token, {
    sessionId,
  });
}

// ─── Questions (full CRUD + stats) ───────────────────────────────────────────

export function getQuestions(
  token: string,
  params?: { subject?: string; difficulty?: string; type?: string; page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Question>>> {
  return authedGet('/questions', token, params as Record<string, string | number | undefined>);
}

export function getQuestion(id: string, token: string): Promise<ApiResponse<Question>> {
  return authedGet<ApiResponse<Question>>(`/questions/${id}`, token);
}

export function getQuestionStats(token: string): Promise<ApiResponse<QuestionStats>> {
  return authedGet<ApiResponse<QuestionStats>>('/questions/stats', token);
}

export function getMyAttempts(
  token: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<QuestionAttempt>>> {
  return authedGet('/questions/my-attempts', token, params as Record<string, number | undefined>);
}

export function getQuestionAttempts(
  id: string,
  token: string
): Promise<ApiResponse<QuestionAttempt[]>> {
  return authedGet<ApiResponse<QuestionAttempt[]>>(`/questions/${id}/attempts`, token);
}

/** Display URL when the user has an avatar; returns `undefined` on 404 (no avatar yet) without throwing. */
export async function fetchAvatarDisplayUrl(token: string): Promise<string | undefined> {
  const res = await fetch(`${BASE_URL}/user/avatar-url`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (res.status === 404 || res.status === 204) {
    return undefined;
  }

  if (res.status === 401) {
    forceLogoutToLogin();
    return undefined;
  }

  if (!res.ok) {
    return undefined;
  }

  try {
    const json = (await res.json()) as ApiResponse<AvatarUrlData> & AvatarUrlData;
    const nested = json.data?.avatarUrl;
    const flat = json.avatarUrl;
    return typeof nested === 'string' && nested
      ? nested
      : typeof flat === 'string' && flat
        ? flat
        : undefined;
  } catch {
    return undefined;
  }
}

// ─── Auth: logout ─────────────────────────────────────────────────────────────

export function logout(token: string): Promise<ApiResponse> {
  return authedPost<ApiResponse>('/auth/logout', token);
}

// ─── Dashboard: reasoning score & achievements ────────────────────────────────

export function getReasoningScore(token: string): Promise<ApiResponse<ReasoningScoreData>> {
  return authedGet<ApiResponse<ReasoningScoreData>>('/dashboard/reasoning-score', token);
}

export function getAchievements(token: string): Promise<ApiResponse<AchievementsData>> {
  return authedGet<ApiResponse<AchievementsData>>('/dashboard/achievements', token);
}

// ─── Library: bookmarks ───────────────────────────────────────────────────────

export function getBookmarks(
  token: string,
  params?: { search?: string; page?: number; limit?: number }
): Promise<ApiResponse<LibraryDocument[]>> {
  return authedGet(
    '/library/bookmarks',
    token,
    params as Record<string, string | number | undefined>
  );
}

// ─── Research: memo & save-to-notes ──────────────────────────────────────────

export function generateResearchMemo(
  id: string,
  token: string
): Promise<ApiResponse<{ memo: string }>> {
  return authedPost<ApiResponse<{ memo: string }>>(`/research/sessions/${id}/memo`, token);
}

export function saveResearchToNotes(
  id: string,
  resultIndex: number,
  token: string
): Promise<ApiResponse<{ note: Note }>> {
  return authedPost<ApiResponse<{ note: Note }>>(`/research/sessions/${id}/save-to-notes`, token, {
    resultIndex,
  });
}

// ─── Notes: expand ───────────────────────────────────────────────────────────

export function expandNote(id: string, token: string): Promise<ApiResponse<{ expanded: string }>> {
  return authedPost<ApiResponse<{ expanded: string }>>(`/notes/${id}/expand`, token);
}
