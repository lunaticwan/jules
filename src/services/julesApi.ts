// Google Jules REST API 서비스

export interface JulesMessage {
  id: string;
  sender: 'user' | 'jules' | 'system';
  content: string;
  timestamp: string;
  type?: 'text' | 'thought' | 'plan' | 'step';
}

export interface JulesPlanStep {
  index: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface JulesSession {
  id: string;
  name: string; // e.g. sessions/12345
  repository: string; // e.g. owner/repo
  baseBranch: string;
  prompt: string;
  state: 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  title?: string;
  prUrl?: string;
  prNumber?: number;
  plan?: JulesPlanStep[];
  messages: JulesMessage[];
}

const STORAGE_KEYS = {
  JULES_KEY: 'jules_api_key',
  MOCK_SESSIONS: 'jules_mock_sessions',
};

// 기본 샘플 데이터 (초기 데모용)
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
      { index: 3, title: 'iOS Safari 실기기 뷰포트 검증', status: 'in_progress' }
    ],
    messages: [
      {
        id: 'm1',
        sender: 'user',
        content: '다크 모드 가시성 개선 및 safe-area 패딩 버그 수정 요청',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'text'
      },
      {
        id: 'm2',
        sender: 'jules',
        content: '요청 사항을 분석하고 작업 계획을 수립했습니다. 하단 영역 safe-area 패딩 스타일을 적용합니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        type: 'thought'
      },
      {
        id: 'm3',
        sender: 'jules',
        content: '제안된 수정 플랜의 승인을 기다리는 중입니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: 'plan'
      }
    ]
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
      { index: 2, title: '만료 토큰 케이스 테스트 작성', status: 'in_progress' }
    ],
    messages: [
      {
        id: 'm10',
        sender: 'user',
        content: '사용자 인증 토큰 재발급 API 엔드포인트 단위 테스트 추가',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        type: 'text'
      },
      {
        id: 'm11',
        sender: 'jules',
        content: '테스트 코드를 작성 중입니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'thought'
      }
    ]
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
      { index: 2, title: '아이콘 및 Manifest 작성', status: 'completed' }
    ],
    messages: [
      {
        id: 'm20',
        sender: 'user',
        content: 'Vite PWA 매니페스트 및 서비스 워커 연동 설정',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        type: 'text'
      },
      {
        id: 'm21',
        sender: 'jules',
        content: '모든 PR 작업이 완료되고 머지되었습니다.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        type: 'text'
      }
    ]
  }
];

export function getJulesApiKey(): string {
  return localStorage.getItem(STORAGE_KEYS.JULES_KEY) || '';
}

export function setJulesApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.JULES_KEY, key.trim());
}

export function clearJulesApiKey(): void {
  localStorage.removeItem(STORAGE_KEYS.JULES_KEY);
}

export function getStoredSessions(): JulesSession[] {
  const data = localStorage.getItem(STORAGE_KEYS.MOCK_SESSIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.MOCK_SESSIONS, JSON.stringify(INITIAL_MOCK_SESSIONS));
    return INITIAL_MOCK_SESSIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MOCK_SESSIONS;
  }
}

export function saveStoredSessions(sessions: JulesSession[]): void {
  localStorage.setItem(STORAGE_KEYS.MOCK_SESSIONS, JSON.stringify(sessions));
}

/**
 * Jules 세션 목록 가져오기 (실제 API 시도 후 실패 또는 연동 불가 시 로컬 데이터 반환)
 */
export async function fetchJulesSessions(): Promise<JulesSession[]> {
  const apiKey = getJulesApiKey();
  if (!apiKey) {
    return getStoredSessions();
  }

  try {
    const response = await fetch(`https://jules.googleapis.com/v1alpha/sessions?key=${apiKey}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Jules API 오류: ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data.sessions)) {
      return data.sessions;
    }
  } catch (err) {
    console.warn('Jules API 호출 실패, 로컬 저장소 데이터 반환:', err);
  }

  return getStoredSessions();
}

/**
 * 특정 Jules 세션 상세 정보 가져오기
 */
export async function fetchJulesSessionDetail(sessionId: string): Promise<JulesSession | null> {
  const sessions = getStoredSessions();
  const found = sessions.find((s) => s.id === sessionId || s.name === sessionId);
  if (found) return found;

  const apiKey = getJulesApiKey();
  if (apiKey) {
    try {
      const response = await fetch(`https://jules.googleapis.com/v1alpha/${sessionId}?key=${apiKey}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Jules 세션 상세 조회 실패:', err);
    }
  }

  return null;
}

/**
 * 신규 Jules 세션 생성
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
      { index: 2, title: '코드 수정 사항 생성', status: 'in_progress' }
    ],
    messages: [
      {
        id: `m-${Date.now()}`,
        sender: 'user',
        content: params.prompt,
        timestamp: new Date().toISOString(),
        type: 'text'
      },
      {
        id: `m-${Date.now() + 1}`,
        sender: 'jules',
        content: '작업 요청을 접수했습니다. 코드베이스를 분석 중입니다.',
        timestamp: new Date().toISOString(),
        type: 'thought'
      }
    ]
  };

  if (apiKey) {
    try {
      const response = await fetch(`https://jules.googleapis.com/v1alpha/sessions?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: params.repository,
          baseBranch: params.baseBranch,
          prompt: params.prompt
        })
      });
      if (response.ok) {
        const remoteData = await response.json();
        const combined = { ...newSession, ...remoteData };
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
 * 세션 플랜 승인
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
      type: 'text'
    });
    sessions[idx].messages.push({
      id: `m-${Date.now() + 1}`,
      sender: 'jules',
      content: '플랜 승인을 확인했습니다. 변경 사항 적용 작업을 시작합니다.',
      timestamp: new Date().toISOString(),
      type: 'thought'
    });
    saveStoredSessions(sessions);
    return sessions[idx];
  }
  throw new Error('세션을 찾을 수 없음');
}

/**
 * 메시지 전송 / 수정 요청
 */
/**
 * 스마트 1-Click AI 액션 제안 생성 및 세션 자동 발주
 */
export async function triggerQuickAiAction(repo: string, actionType: 'lint' | 'security' | 'perf' | 'test'): Promise<JulesSession> {
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
      type: 'text'
    });
    sessions[idx].messages.push({
      id: `m-${Date.now() + 1}`,
      sender: 'jules',
      content: `피드백을 반영하겠습니다: "${message}"`,
      timestamp: new Date().toISOString(),
      type: 'thought'
    });
    saveStoredSessions(sessions);
    return sessions[idx];
  }
  throw new Error('세션을 찾을 수 없음');
}
