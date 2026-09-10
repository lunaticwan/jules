import { julesClient } from './apiClient';

/**
 * Jules 대화 타임라인 내 단일 메시지 인터페이스
 */
export interface JulesMessage {
  /** 메시지 고유 식별자 */
  id: string;
  /** 메시지 발신자 유형 ('user' | 'jules' | 'system') */
  sender: 'user' | 'jules' | 'system';
  /** 메시지본문 텍스트 */
  content: string;
  /** ISO 8601 생성 일시 */
  timestamp: string;
  /** 메시지 표시 분류 타입 */
  type?: 'text' | 'thought' | 'plan' | 'step';
}

/**
 * Jules 작업 세션 실행 플랜의 단계 항목
 */
export interface JulesPlanStep {
  /** 플랜 단계 순서 인덱스 */
  index: number;
  /** 플랜 단계 요약 제목 */
  title: string;
  /** 상세 동작 설명 */
  description?: string;
  /** 실행 상태 ('pending' | 'in_progress' | 'completed' | 'failed') */
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Jules REST API 통합 작업 세션 데이터 인터페이스
 */
export interface JulesSession {
  /** 세션 단축 ID (예: 'sess-101') */
  id: string;
  /** 세션 리소스 Full Path (예: 'sessions/12345') */
  name: string;
  /** GitHub 저장소 식별자 (예: 'owner/repo') */
  repository: string;
  /** 기준 브랜치 (기본값: 'main') */
  baseBranch: string;
  /** 사용자 원본 프롬프트 지시사항 */
  prompt: string;
  /** 세션 현재 상태 */
  state: 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  /** 생성 일시 (ISO 8601) */
  createdAt: string;
  /** 최근 업데이트 일시 (ISO 8601) */
  updatedAt: string;
  /** 요약 타이틀 */
  title?: string;
  /** 생성된 GitHub PR URL */
  prUrl?: string;
  /** 생성된 GitHub PR 번호 */
  prNumber?: number;
  /** 실행 플랜 단계 목록 */
  plan?: JulesPlanStep[];
  /** 대화 타임라인 메시지 목록 */
  messages: JulesMessage[];
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
    console.warn('LocalStorage 접근 실패 (Jules API Key):', err);
    return '';
  }
}

/**
 * LocalStorage에 Jules API 키를 저장함
 */
export function setJulesApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.JULES_KEY, key.trim());
  } catch (err) {
    console.warn('LocalStorage 저장 실패 (Jules API Key):', err);
  }
}

/**
 * LocalStorage에 저장된 Jules API 키를 삭제함
 */
export function clearJulesApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.JULES_KEY);
  } catch (err) {
    console.warn('LocalStorage 삭제 실패 (Jules API Key):', err);
  }
}

/**
 * Jules REST API Key 엔드포인트 연결 검증 수행
 */
export async function verifyJulesKey(keyInput?: string): Promise<{ success: boolean; message: string }> {
  const apiKey = keyInput !== undefined ? keyInput.trim() : getJulesApiKey();
  if (!apiKey) {
    return { success: false, message: 'Jules API 키가 입력되지 않았음 (Mock 모드 동작)' };
  }

  try {
    const res = await julesClient.get('/sessions', {
      params: { key: apiKey },
    });
    if (res.status === 200) {
      return { success: true, message: 'Jules API 연결 검증 성공' };
    }
    return { success: false, message: `Jules API 응답 상태 이상 (${res.status})` };
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      return { success: false, message: '유효하지 않거나 권한이 없는 Jules API 키임' };
    }
    return { success: false, message: `Jules API 검증 실패: ${err?.message || '네트워크 오류'}` };
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
    console.warn('LocalStorage 세션 파싱 실패, 인메모리 반환:', err);
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
  // inMemoryCache 참상태 유지
  if (inMemorySessionsCache) {
    // cached
  }

  return list.map((s, index) => ({
    ...s,
    id: s.id || `sess-${index + 101}`,
    name: s.name || `sessions/${s.id || `sess-${index + 101}`}`,
    repository: (!s.repository || s.repository === 'unknown/repository') ? 'acme/mobile-pwa' : s.repository,
    baseBranch: s.baseBranch || 'main',
    prompt: s.prompt || s.title || 'No prompt provided',
    state: s.state || 'IN_PROGRESS',
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || new Date().toISOString(),
    title: s.title || s.prompt || 'Untitled Session',
    plan: Array.isArray(s.plan) ? s.plan : [],
    messages: Array.isArray(s.messages) && s.messages.length > 0
      ? s.messages
      : [
          {
            id: `msg-fallback-1`,
            sender: 'user',
            content: s.prompt || '작업 요청',
            timestamp: s.createdAt || new Date().toISOString(),
            type: 'text',
          },
          {
            id: `msg-fallback-2`,
            sender: 'jules',
            content: '작업 세션이 진행 중입니다.',
            timestamp: s.updatedAt || new Date().toISOString(),
            type: 'thought',
          },
        ],
  }));
}

/**
 * 세션 목록을 로컬 캐시 및 LocalStorage에 업데이트함
 */
export function saveStoredSessions(sessions: JulesSession[]): void {
  inMemorySessionsCache = sessions;
  try {
    localStorage.setItem(STORAGE_KEYS.MOCK_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.warn('LocalStorage 저장 실패 (In-Memory 캐시 사용):', err);
  }
}

/**
 * Jules 세션 목록을 API에서 조회하고 미연동 시 로컬 캐시 데이터를 반환함
 */
export async function fetchJulesSessions(): Promise<JulesSession[]> {
  const apiKey = getJulesApiKey();
  if (!apiKey) {
    return getStoredSessions();
  }

  try {
    const response = await julesClient.get('/sessions');
    const data = response.data;
    if (Array.isArray(data.sessions)) {
      const mapped = data.sessions.map((s: any, index: number) => ({
        id: s.id || s.name?.split('/')?.pop() || `session-${index}`,
        name: s.name || `sessions/session-${index}`,
        repository: s.repository || s.repo || s.targetRepository || 'acme/mobile-pwa',
        baseBranch: s.baseBranch || 'main',
        prompt: s.prompt || s.title || 'No prompt provided',
        state: s.state || 'IN_PROGRESS',
        createdAt: s.createdAt || s.createTime || new Date().toISOString(),
        updatedAt: s.updatedAt || s.updateTime || new Date().toISOString(),
        title: s.title || s.prompt || 'Untitled Session',
        prUrl: s.prUrl || s.pullRequestUrl || undefined,
        prNumber: s.prNumber || s.pullRequestNumber || undefined,
        plan: Array.isArray(s.plan) ? s.plan : [],
        messages: Array.isArray(s.messages) && s.messages.length > 0 ? s.messages : [
          {
            id: `msg-${index}-1`,
            sender: 'user',
            content: s.prompt || s.title || '작업 요청 내용',
            timestamp: s.createdAt || new Date().toISOString(),
            type: 'text',
          },
          {
            id: `msg-${index}-2`,
            sender: 'jules',
            content: '요청 사항을 분석하고 작업을 수행 중입니다.',
            timestamp: s.updatedAt || new Date().toISOString(),
            type: 'thought',
          },
        ],
      }));
      saveStoredSessions(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Jules API 호출 실패, 로컬 저장소 데이터 반환:', err);
  }

  return getStoredSessions();
}

/**
 * 특정 Jules 세션의 상세 정보를 조회함
 */
export async function fetchJulesSessionDetail(sessionId: string): Promise<JulesSession | null> {
  const apiKey = getJulesApiKey();
  if (apiKey) {
    try {
      const response = await julesClient.get(`/${sessionId}`);
      if (response.data) {
        const s = response.data;
        return {
          id: s.id || sessionId,
          name: s.name || `sessions/${sessionId}`,
          repository: s.repository || s.repo || 'acme/mobile-pwa',
          baseBranch: s.baseBranch || 'main',
          prompt: s.prompt || s.title || '',
          state: s.state || 'IN_PROGRESS',
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || new Date().toISOString(),
          title: s.title || s.prompt || 'Untitled Session',
          prUrl: s.prUrl || s.pullRequestUrl || undefined,
          prNumber: s.prNumber || s.pullRequestNumber || undefined,
          plan: Array.isArray(s.plan) ? s.plan : [],
          messages: Array.isArray(s.messages) && s.messages.length > 0 ? s.messages : [
            {
              id: `msg-detail-1`,
              sender: 'user',
              content: s.prompt || '작업 요청 사항',
              timestamp: s.createdAt || new Date().toISOString(),
              type: 'text',
            },
          ],
        };
      }
    } catch (err) {
      console.warn('Jules 세션 상세 API 조회 실패, 로컬 세션 조회로 이동:', err);
    }
  }

  const sessions = getStoredSessions();
  const found = sessions.find((s) => s.id === sessionId || s.name === sessionId);
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
      const response = await julesClient.post('/sessions', {
        repository: params.repository,
        baseBranch: params.baseBranch,
        prompt: params.prompt,
      });
      if (response.data) {
        const combined = { ...newSession, ...response.data };
        const current = getStoredSessions();
        saveStoredSessions([combined, ...current]);
        return combined;
      }
    } catch (err) {
      console.warn('Jules 생성 API 실패, 로컬 생성으로 진행:', err);
    }
  }

  const current = getStoredSessions();
  const updated = [newSession, ...current];
  saveStoredSessions(updated);
  return newSession;
}

/**
 * Jules 작업 세션의 검토 대기 플랜을 승인함
 */
export async function approveJulesPlan(sessionId: string): Promise<JulesSession> {
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
    return sessions[idx];
  }
  throw new Error('세션을 찾을 수 없음');
}

/**
 * 1-Click AI 스캔 및 최적화 작업을 자동으로 발주함
 */
export async function triggerQuickAiAction(
  repo: string,
  actionType: 'lint' | 'security' | 'perf' | 'test'
): Promise<JulesSession> {
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
    return sessions[idx];
  }
  throw new Error('세션을 찾을 수 없음');
}
