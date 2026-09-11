import { z } from 'zod';
import { julesClient } from './apiClient';
import { getLogTimestamp } from '../utils/logger';

/**
 * Zod 기반 Jules 메시지 객체 검증 스키마
 */
export const JulesMessageSchema = z.object({
  id: z.string().default(() => `msg-${Date.now()}`),
  sender: z.enum(['user', 'jules', 'system']).default('jules'),
  content: z.string().default(''),
  timestamp: z.string().default(() => new Date().toISOString()),
  type: z.enum(['text', 'thought', 'plan', 'step']).optional(),
});

/**
 * Zod 기반 Jules 실행 플랜 단계 스키마
 */
export const JulesPlanStepSchema = z.object({
  index: z.number().default(1),
  title: z.string().default(''),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
});

/**
 * Zod 기반 Jules 세션 객체 검증 스키마
 */
export const JulesSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  repository: z.string().default(''),
  baseBranch: z.string().default('main'),
  prompt: z.string().default(''),
  state: z.enum(['IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED']).default('IN_PROGRESS'),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
  title: z.string().optional(),
  prUrl: z.string().optional(),
  prNumber: z.number().optional(),
  plan: z.array(JulesPlanStepSchema).optional().default([]),
  messages: z.array(JulesMessageSchema).default([]),
});

/** Zod 파싱 기반 인퍼런스 타입 정의 */
export type JulesMessage = z.infer<typeof JulesMessageSchema>;
export type JulesPlanStep = z.infer<typeof JulesPlanStepSchema>;
export type JulesSession = z.infer<typeof JulesSessionSchema>;

/**
 * 단일 세션 데이터 검증 및 보정 파서
 */
export function safeParseJulesSession(data: unknown, fallbackId = 'sess-unknown'): JulesSession {
  console.log(`[${getLogTimestamp()}][safeParseJulesSession] [INPUT_RAW_DATA]`, data);
  const rawObj = typeof data === 'object' && data !== null ? (data as Record<string, any>) : {};
  const id = String(rawObj.id || rawObj.name?.split('/')?.pop() || fallbackId);
  const prompt = String(rawObj.prompt || rawObj.title || rawObj.userPrompt || '작업 요청 내용');

  // PR URL / PR Number 파싱 (pullRequest 또는 prUrl 또는 outputs)
  const prUrl =
    rawObj.prUrl ||
    rawObj.pullRequestUrl ||
    rawObj.pullRequest?.htmlUrl ||
    rawObj.outputs?.pullRequestUrl ||
    rawObj.sourceContext?.source?.github?.url ||
    rawObj.sourceContext?.source?.github?.htmlUrl;
  const prNumber =
    rawObj.prNumber ||
    rawObj.pullRequestNumber ||
    rawObj.pullRequest?.number ||
    rawObj.outputs?.pullRequestNumber;

  // Jules API 응답 구조 및 일반 세션 데이터의 repository 필드 순차 검사
  let repo = String(
    rawObj.sourceContext?.source?.github?.repository ||
      rawObj.repository ||
      rawObj.repo ||
      rawObj.githubRepository ||
      ''
  );

  // repository 필드가 누락되었거나 'unknown/repository'인 경우 URL 후보군에서 owner/repo 정규식 추론
  if (!repo || repo === 'unknown/repository' || !repo.includes('/')) {
    const candidateUrls = [
      prUrl,
      rawObj.outputs?.pullRequestUrl,
      rawObj.outputs?.url,
      rawObj.pullRequest?.htmlUrl,
      rawObj.sourceContext?.source?.github?.url,
      rawObj.sourceContext?.source?.github?.htmlUrl,
    ];

    for (const urlCandidate of candidateUrls) {
      if (typeof urlCandidate === 'string' && urlCandidate.length > 0) {
        const match = urlCandidate.match(/github\.com\/([^\/\s]+)\/([^\/\s#\?]+)/);
        if (match && match[1] && match[2]) {
          const owner = match[1];
          let repoName = match[2].replace(/\.git$/, '');
          if (['pull', 'issues', 'tree', 'blob', 'releases'].includes(repoName)) {
            continue;
          }
          repo = `${owner}/${repoName}`;
          break;
        }
      }
    }
  }

  // 여전히 아무 정보도 없는 경우에만 폴백 적용
  if (!repo || repo === 'unknown/repository') {
    repo = 'owner/repository';
  }

  // Jules API activities / outputs / messages 필드 통합 파싱
  let parsedMessages: JulesMessage[] = [];
  if (Array.isArray(rawObj.messages) && rawObj.messages.length > 0) {
    parsedMessages = rawObj.messages.map((m: any, i: number) => ({
      id: String(m.id || `msg-${i}`),
      sender: (['user', 'jules', 'system'].includes(m.sender) ? m.sender : 'jules') as JulesMessage['sender'],
      content: String(m.content || m.text || ''),
      timestamp: String(m.timestamp || m.createTime || new Date().toISOString()),
      type: m.type,
    }));
  } else if (Array.isArray(rawObj.activities) && rawObj.activities.length > 0) {
    parsedMessages = rawObj.activities.map((act: any, i: number) => ({
      id: String(act.id || `act-${i}`),
      sender: act.actor === 'USER' ? 'user' : 'jules',
      content: String(act.message || act.description || act.summary || ''),
      timestamp: String(act.createTime || new Date().toISOString()),
      type: act.type || 'text',
    }));
  }

  if (parsedMessages.length === 0) {
    parsedMessages = [
      {
        id: `msg-${id}-1`,
        sender: 'user',
        content: prompt,
        timestamp: String(rawObj.createdAt || rawObj.createTime || new Date().toISOString()),
        type: 'text',
      },
    ];
  }

  const parsedSession: JulesSession = {
    id,
    name: String(rawObj.name || `sessions/${id}`),
    repository: repo,
    baseBranch: String(rawObj.baseBranch || rawObj.sourceContext?.source?.github?.baseBranch || 'main'),
    prompt,
    state: (['IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED'].includes(rawObj.state)
      ? rawObj.state
      : 'IN_PROGRESS') as JulesSession['state'],
    createdAt: String(rawObj.createdAt || rawObj.createTime || new Date().toISOString()),
    updatedAt: String(rawObj.updatedAt || rawObj.updateTime || new Date().toISOString()),
    title: String(rawObj.title || prompt || 'Untitled Session'),
    prUrl: prUrl ? String(prUrl) : undefined,
    prNumber: prNumber ? Number(prNumber) : undefined,
    plan: Array.isArray(rawObj.plan)
      ? rawObj.plan.map((p: any, i: number) => ({
          index: p.index || i + 1,
          title: p.title || '플랜 단계',
          description: p.description,
          status: p.status || 'pending',
        }))
      : [],
    messages: parsedMessages,
  };

  console.log(`[${getLogTimestamp()}][safeParseJulesSession] [PARSED_RESULT]`, parsedSession);
  return parsedSession;
}

const STORAGE_KEYS = {
  JULES_KEY: 'jules_api_key',
  MOCK_SESSIONS: 'jules_mock_sessions',
} as const;

/**
 * 기본 모의 세션 시드 데이터 (초기 데모 및 백업용)
 */
const INITIAL_MOCK_SESSIONS: JulesSession[] = [
  {
    id: 'sess-101',
    name: 'sessions/sess-101',
    repository: 'acme/mobile-pwa',
    baseBranch: 'main',
    prompt: '다크 모드 가시성 개선 및 safe-area 패딩 버그 수정 요청',
    state: 'AWAITING_APPROVAL',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    title: '모바일 하단 레이아웃 Safe Area 여백 조정',
    prUrl: 'https://github.com/acme/mobile-pwa/pull/42',
    prNumber: 42,
    plan: [
      { index: 1, title: 'index.css 내 safe-area CSS 클래스 작성', status: 'completed' },
      { index: 2, title: '하단 액션 바 컴포넌트 여백 수정', status: 'completed' },
      { index: 3, title: 'iOS Safari 실기기 뷰포트 검증', status: 'in_progress' },
    ],
    messages: [
      {
        id: 'm1',
        sender: 'user',
        content: '다크 모드 가시성 개선 및 safe-area 패딩 버그 수정 요청',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'text',
      },
      {
        id: 'm2',
        sender: 'jules',
        content: '요청 사항을 분석하고 작업 계획을 수립했습니다. 하단 영역 safe-area 패딩 스타일을 적용합니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        type: 'thought',
      },
      {
        id: 'm3',
        sender: 'jules',
        content: '제안된 수정 플랜의 승인을 기다리는 중입니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: 'plan',
      },
    ],
  },
  {
    id: 'sess-102',
    name: 'sessions/sess-102',
    repository: 'acme/backend-service',
    baseBranch: 'develop',
    prompt: '사용자 인증 토큰 재발급 API 엔드포인트 단위 테스트 추가',
    state: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    title: '인증 토큰 리프레시 테스트 구현',
    prUrl: 'https://github.com/acme/backend-service/pull/108',
    prNumber: 108,
    plan: [
      { index: 1, title: 'auth_test.go 파일 내 Mock 저장소 추가', status: 'completed' },
      { index: 2, title: '만료 토큰 케이스 테스트 작성', status: 'in_progress' },
    ],
    messages: [
      {
        id: 'm10',
        sender: 'user',
        content: '사용자 인증 토큰 재발급 API 엔드포인트 단위 테스트 추가',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        type: 'text',
      },
      {
        id: 'm11',
        sender: 'jules',
        content: '테스트 코드를 작성 중입니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'thought',
      },
    ],
  },
  {
    id: 'sess-103',
    name: 'sessions/sess-103',
    repository: 'acme/mobile-pwa',
    baseBranch: 'main',
    prompt: 'Vite PWA 매니페스트 및 서비스 워커 연동 설정',
    state: 'COMPLETED',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    title: 'PWA 환경 설정 완료',
    prUrl: 'https://github.com/acme/mobile-pwa/pull/39',
    prNumber: 39,
    plan: [
      { index: 1, title: 'vite-plugin-pwa 패키지 설정', status: 'completed' },
      { index: 2, title: '아이콘 및 Manifest 작성', status: 'completed' },
    ],
    messages: [
      {
        id: 'm20',
        sender: 'user',
        content: 'Vite PWA 매니페스트 및 서비스 워커 연동 설정',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        type: 'text',
      },
      {
        id: 'm21',
        sender: 'jules',
        content: '모든 PR 작업이 완료되고 머지되었습니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        type: 'text',
      },
    ],
  },
];

/**
 * LocalStorage에 저장된 Jules API 키를 안전하게 조회함
 */
export function getJulesApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.JULES_KEY) || '';
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][JULES_KEY] LocalStorage 접근 실패:`, err);
    return '';
  }
}

/**
 * LocalStorage에 Jules API 키를 저장함
 */
export function setJulesApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.JULES_KEY, key.trim());
    console.log(`[${getLogTimestamp()}][JULES_KEY_SAVED] Jules API Key 저장 완료`);
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][JULES_KEY] LocalStorage 저장 실패:`, err);
  }
}

/**
 * LocalStorage에 저장된 Jules API 키를 삭제함
 */
export function clearJulesApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.JULES_KEY);
    console.log(`[${getLogTimestamp()}][JULES_KEY_CLEARED] Jules API Key 삭제 완료`);
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][JULES_KEY] LocalStorage 삭제 실패:`, err);
  }
}

/**
 * Jules REST API Key 엔드포인트 연결 검증 수행
 */
export async function verifyJulesKey(keyInput?: string): Promise<{ success: boolean; message: string }> {
  const apiKey = keyInput !== undefined ? keyInput.trim() : getJulesApiKey();
  console.log(`[${getLogTimestamp()}][verifyJulesKey] [START] keyLength: ${apiKey.length}`);
  if (!apiKey) {
    return { success: false, message: 'Jules API 키가 입력되지 않았음 (로컬/Mock 모드로 정상 동작)' };
  }

  try {
    const res = await julesClient.get('/sessions', {
      params: { key: apiKey },
    });
    if (res.status === 200) {
      console.log(`[${getLogTimestamp()}][verifyJulesKey] [SUCCESS] status: ${res.status}`);
      return { success: true, message: 'Jules API 연결 검증 성공' };
    }
    console.warn(`[${getLogTimestamp()}][verifyJulesKey] [UNEXPECTED_STATUS] status: ${res.status}`);
    return { success: false, message: `Jules API 응답 상태 이상 (${res.status})` };
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = status === 401 || status === 403
      ? '유효하지 않거나 권한이 없는 Jules API 키임 (로컬 폴백 적용)'
      : `Jules API 검증 실패: ${err?.message || 'CORS/네트워크 오류 (로컬 폴백 활성화)'}`;
    console.warn(`[${getLogTimestamp()}][verifyJulesKey] [FAILED]`, msg, err);
    return { success: false, message: msg };
  }
}

let inMemorySessionsCache: JulesSession[] | null = null;

/**
 * 로컬 캐시/LocalStorage에 저장된 세션 목록을 반환함
 */
export function getStoredSessions(): JulesSession[] {
  let list: JulesSession[] = [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MOCK_SESSIONS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][getStoredSessions] LocalStorage 파싱 실패, 인메모리 반환:`, err);
  }

  if (list.length === 0) {
    list = INITIAL_MOCK_SESSIONS;
    inMemorySessionsCache = INITIAL_MOCK_SESSIONS;
    try {
      localStorage.setItem(STORAGE_KEYS.MOCK_SESSIONS, JSON.stringify(INITIAL_MOCK_SESSIONS));
    } catch {}
  } else {
    inMemorySessionsCache = list;
  }

  console.log(`[${getLogTimestamp()}][getStoredSessions] [COUNT: ${list.length}] cacheExists: ${!!inMemorySessionsCache}`);
  return list.map((s, index) => safeParseJulesSession(s, `sess-${index + 101}`));
}

/**
 * 세션 목록을 로컬 캐시 및 LocalStorage에 업데이트함
 */
export function saveStoredSessions(sessions: JulesSession[]): void {
  inMemorySessionsCache = sessions;
  console.log(`[${getLogTimestamp()}][saveStoredSessions] [SAVING_COUNT: ${sessions.length}]`, sessions);
  try {
    localStorage.setItem(STORAGE_KEYS.MOCK_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][saveStoredSessions] LocalStorage 저장 실패 (In-Memory 캐시 사용):`, err);
  }
}

/**
 * Jules 세션 목록을 API에서 조회하고 미연동 시 로컬 캐시 데이터를 반환함
 */
export async function fetchJulesSessions(): Promise<JulesSession[]> {
  const apiKey = getJulesApiKey();
  console.log(`[${getLogTimestamp()}][fetchJulesSessions] [START] apiKeyPresent: ${!!apiKey}`);
  if (!apiKey) {
    const stored = getStoredSessions();
    console.log(`[${getLogTimestamp()}][fetchJulesSessions] [NO_KEY_FALLBACK]`, stored);
    return stored;
  }

  try {
    console.log(`[${getLogTimestamp()}][fetchJulesSessions] [SEND_REQ] GET /sessions`);
    const response = await julesClient.get('/sessions');
    console.log(`[${getLogTimestamp()}][fetchJulesSessions] [HTTP_SUCCESS] status: ${response.status}`);
    const data = response.data;
    if (Array.isArray(data.sessions)) {
      const mapped = data.sessions.map((s: any, index: number) => safeParseJulesSession(s, `session-${index}`));
      console.log(`[${getLogTimestamp()}][fetchJulesSessions] [MAPPED_SESSIONS_COUNT: ${mapped.length}]`, mapped);
      saveStoredSessions(mapped);
      return mapped;
    }
  } catch (err: any) {
    console.error(`[${getLogTimestamp()}][fetchJulesSessions] [API_ERROR]`, err?.response?.status, err?.message, err?.response?.data || err);
  }

  const fallback = getStoredSessions();
  console.log(`[${getLogTimestamp()}][fetchJulesSessions] [FALLBACK_STORED_SESSIONS]`, fallback);
  return fallback;
}

/**
 * 특정 Jules 세션의 상세 정보를 조회함
 */
export async function fetchJulesSessionDetail(sessionId: string): Promise<JulesSession | null> {
  const apiKey = getJulesApiKey();
  console.log(`[${getLogTimestamp()}][fetchJulesSessionDetail] [START] sessionId: ${sessionId}, apiKeyPresent: ${!!apiKey}`);
  if (apiKey) {
    try {
      console.log(`[${getLogTimestamp()}][fetchJulesSessionDetail] [SEND_REQ] GET /${sessionId}`);
      const response = await julesClient.get(`/${sessionId}`);
      console.log(`[${getLogTimestamp()}][fetchJulesSessionDetail] [HTTP_SUCCESS] status: ${response.status}`);
      if (response.data) {
        return safeParseJulesSession(response.data, sessionId);
      }
    } catch (err: any) {
      console.error(`[${getLogTimestamp()}][fetchJulesSessionDetail] [API_ERROR]`, err?.response?.status, err?.message, err?.response?.data || err);
    }
  }

  const sessions = getStoredSessions();
  const found = sessions.find((s) => s.id === sessionId || s.name === sessionId);
  console.log(`[${getLogTimestamp()}][fetchJulesSessionDetail] [LOCAL_FOUND]`, found);
  return found || null;
}

/**
 * 신규 Jules 태스크 작업 세션을 생성함
 */
export async function createJulesSession(params: {
  repository: string;
  baseBranch: string;
  prompt: string;
}): Promise<JulesSession> {
  const apiKey = getJulesApiKey();
  console.log(`[${getLogTimestamp()}][createJulesSession] [START]`, params);
  const newId = `sess-${Date.now().toString().slice(-5)}`;
  const newSession: JulesSession = {
    id: newId,
    name: `sessions/${newId}`,
    repository: params.repository,
    baseBranch: params.baseBranch || 'main',
    prompt: params.prompt,
    state: 'IN_PROGRESS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: params.prompt.slice(0, 30) + (params.prompt.length > 30 ? '...' : ''),
    plan: [
      { index: 1, title: '요청 사항 분석 및 코드베이스 탐색', status: 'completed' },
      { index: 2, title: '코드 수정 사항 생성', status: 'in_progress' },
    ],
    messages: [
      {
        id: `m-${Date.now()}`,
        sender: 'user',
        content: params.prompt,
        timestamp: new Date().toISOString(),
        type: 'text',
      },
      {
        id: `m-${Date.now() + 1}`,
        sender: 'jules',
        content: '작업 요청을 접수했습니다. 코드베이스를 분석 중입니다.',
        timestamp: new Date().toISOString(),
        type: 'thought',
      },
    ],
  };

  if (apiKey) {
    try {
      console.log(`[${getLogTimestamp()}][createJulesSession] [SEND_REQ] POST /sessions`, params);
      const response = await julesClient.post('/sessions', {
        repository: params.repository,
        baseBranch: params.baseBranch,
        prompt: params.prompt,
      });
      if (response.data) {
        const combined = { ...newSession, ...response.data };
        const current = getStoredSessions();
        saveStoredSessions([combined, ...current]);
        console.log(`[${getLogTimestamp()}][createJulesSession] [API_SUCCESS]`, combined);
        return combined;
      }
    } catch (err) {
      console.warn(`[${getLogTimestamp()}][createJulesSession] Jules 생성 API 실패, 로컬 생성으로 진행:`, err);
    }
  }

  const current = getStoredSessions();
  const updated = [newSession, ...current];
  saveStoredSessions(updated);
  console.log(`[${getLogTimestamp()}][createJulesSession] [LOCAL_CREATED]`, newSession);
  return newSession;
}

/**
 * Jules 작업 세션의 검토 대기 플랜을 승인함
 */
export async function approveJulesPlan(sessionId: string): Promise<JulesSession> {
  console.log(`[${getLogTimestamp()}][approveJulesPlan] [START] sessionId: ${sessionId}`);
  const sessions = getStoredSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId || s.name === sessionId);
  if (idx !== -1) {
    sessions[idx].state = 'IN_PROGRESS';
    sessions[idx].updatedAt = new Date().toISOString();
    sessions[idx].messages.push({
      id: `m-${Date.now()}`,
      sender: 'user',
      content: '플랜을 승인합니다. 진행해주세요.',
      timestamp: new Date().toISOString(),
      type: 'text',
    });
    sessions[idx].messages.push({
      id: `m-${Date.now() + 1}`,
      sender: 'jules',
      content: '플랜 승인을 확인했습니다. 변경 사항 적용 작업을 시작합니다.',
      timestamp: new Date().toISOString(),
      type: 'thought',
    });
    saveStoredSessions(sessions);
    console.log(`[${getLogTimestamp()}][approveJulesPlan] [APPROVED_SUCCESS]`, sessions[idx]);
    return sessions[idx];
  }
  console.error(`[${getLogTimestamp()}][approveJulesPlan] [NOT_FOUND] sessionId: ${sessionId}`);
  throw new Error('세션을 찾을 수 없음');
}

/**
 * 1-Click AI 스캔 및 최적화 작업을 자동으로 발주함
 */
export async function triggerQuickAiAction(
  repo: string,
  actionType: 'lint' | 'security' | 'perf' | 'test'
): Promise<JulesSession> {
  console.log(`[${getLogTimestamp()}][triggerQuickAiAction] [START] repo: ${repo}, actionType: ${actionType}`);
  const promptMap = {
    lint: '전체 코드베이스 ESLint/TypeScript 타입 체크 규칙 정형화 및 경고 수정을 위한 리팩토링 진행',
    security: '의존성 패키지 취약점 점검 및 보안 강화 업데이트 적용',
    perf: '웹 성능 번들 사이즈 최적화 및 로딩 속도 개선 작업 수행',
    test: '주요 서비스 및 유틸리티 함수에 대한 단위 테스트 케이스 자동 생성',
  };

  return createJulesSession({
    repository: repo,
    baseBranch: 'main',
    prompt: promptMap[actionType],
  });
}

/**
 * 진행 중인 Jules 세션에 추가 피드백 메시지를 전송함
 */
export async function sendJulesMessage(sessionId: string, message: string): Promise<JulesSession> {
  console.log(`[${getLogTimestamp()}][sendJulesMessage] [START] sessionId: ${sessionId}, message: ${message}`);
  const sessions = getStoredSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId || s.name === sessionId);
  if (idx !== -1) {
    sessions[idx].updatedAt = new Date().toISOString();
    sessions[idx].messages.push({
      id: `m-${Date.now()}`,
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'text',
    });
    sessions[idx].messages.push({
      id: `m-${Date.now() + 1}`,
      sender: 'jules',
      content: `피드백을 반영하겠습니다: "${message}"`,
      timestamp: new Date().toISOString(),
      type: 'thought',
    });
    saveStoredSessions(sessions);
    console.log(`[${getLogTimestamp()}][sendJulesMessage] [SENT_SUCCESS]`, sessions[idx]);
    return sessions[idx];
  }
  console.error(`[${getLogTimestamp()}][sendJulesMessage] [NOT_FOUND] sessionId: ${sessionId}`);
  throw new Error('세션을 찾을 수 없음');
}
