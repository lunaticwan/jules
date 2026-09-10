# Google Jules REST API Reference Guide

JulesPWA 애플리케이션에서 Google Jules 서비스 및 로컬 세션 스토리지와 연동하기 위해 사용하는 **Google Jules REST API (`v1alpha`) 명세 및 데이터 규격 가이드**임.

---

## 1. 기본 정보 (Base Information)

- **Base URL**: `https://jules.googleapis.com/v1alpha`
- **Content-Type**: `application/json`
- **Authentication**: URL Query Parameter `?key=<JULES_API_KEY>`
  - `src/services/apiClient.ts`의 `julesClient` Axios 요청 인터셉터를 통해 LocalStorage (`jules_api_key`)에 저장된 키가 자동으로 주입됨.

---

## 2. 데이터 모델 및 Zod 검증 스키마 (TypeScript & Zod Schemas)

JulesPWA는 API 런타임 데이터의 불확실성을 방지하기 위해 Zod 스키마 및 안전 파서(`safeParseJulesSession`)를 사용함.

```typescript
import { z } from 'zod';

/** Jules 메시지 객체 스키마 */
export const JulesMessageSchema = z.object({
  id: z.string().default(() => `msg-${Date.now()}`),
  sender: z.enum(['user', 'jules', 'system']).default('jules'),
  content: z.string().default(''),
  timestamp: z.string().default(() => new Date().toISOString()),
  type: z.enum(['text', 'thought', 'plan', 'step']).optional(),
});

/** Jules 실행 플랜 단계 스키마 */
export const JulesPlanStepSchema = z.object({
  index: z.number().default(1),
  title: z.string().default(''),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
});

/** Jules 세션 객체 스키마 */
export const JulesSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  repository: z.string().transform((val) => (!val || val === 'unknown/repository' ? 'acme/mobile-pwa' : val)).default('acme/mobile-pwa'),
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

export type JulesMessage = z.infer<typeof JulesMessageSchema>;
export type JulesPlanStep = z.infer<typeof JulesPlanStepSchema>;
export type JulesSession = z.infer<typeof JulesSessionSchema>;
```

### 세션 상태 (Session State) Enum
- `IN_PROGRESS`: AI 작업 세션 진행 중.
- `AWAITING_APPROVAL`: 실행 플랜 검토 및 사용자 승인 대기 중.
- `COMPLETED`: 모든 작업 단계 완료 및 머지 완료.
- `FAILED`: 세션 실행 실패 또는 중단.

---

## 3. 주요 API 엔드포인트 및 클라이언트 함수 (API Functions)

### 3.1 세션 목록 조회 (`fetchJulesSessions`)
- **HTTP Method & Path**: `GET /sessions`
- **Query Parameter**: `key=<JULES_API_KEY>`
- **동작 방식**: API 호출 성공 시 세션 목록 반환 및 로컬 캐시에 저장. 실패 또는 키 부재 시 `getStoredSessions()`로 로컬 폴백.

### 3.2 세션 상세 조회 (`fetchJulesSessionDetail`)
- **HTTP Method & Path**: `GET /{sessionId}`
- **Query Parameter**: `key=<JULES_API_KEY>`
- **설명**: 특정 세션 ID의 플랜 단계, 메시지 타임라인, 상태 정보 조회.

### 3.3 신규 세션 생성 (`createJulesSession`)
- **HTTP Method & Path**: `POST /sessions`
- **Request Body**:
  ```json
  {
    "repository": "owner/repo",
    "baseBranch": "main",
    "prompt": "수정 지시사항 및 프롬프트"
  }
  ```
- **응답 및 폴백**: API 호출 성공 시 세션 데이터 반환 및 저장. 실패 시 로컬에서 규격에 맞는 세션을 즉시 생성 및 캐시 저장.

### 3.4 1-Click AI Quick Action 발주 (`triggerQuickAiAction`)
- **지원 액션**: `'lint'` | `'security'` | `'perf'` | `'test'`
- **설명**: 지정된 레포지토리에 대해 미리 정의된 AI 최적화 프롬프트를 사용하여 세션을 자동 발주함.

### 3.5 플랜 승인 (`approveJulesPlan`)
- **설명**: `AWAITING_APPROVAL` 상태의 세션을 `IN_PROGRESS` 상태로 변경하고 사용자 승인 메시지를 타임라인에 추가함.

### 3.6 추가 피드백 메시지 전송 (`sendJulesMessage`)
- **설명**: 진행 중인 세션에 사용자의 피드백 메시지를 추가하고 Jules의 응답 메시지를 생성함.

### 3.7 API 키 연결 검증 (`verifyJulesKey`)
- **HTTP Method & Path**: `GET /sessions?key=<API_KEY>`
- **설명**: 온보딩 모달에서 입력된 API 키의 연결성을 실시간으로 테스트함.

---

## 4. 로컬 폴백 및 오프라인 메커니즘 (Local Fallback & Offline Strategy)

1. **LocalStorage & In-Memory 캐시**:
   - LocalStorage 키: `jules_api_key`, `jules_mock_sessions`
   - API 키가 없거나 네트워크/CORS 에러 발생 시 초기 데모 데이터(`INITIAL_MOCK_SESSIONS`)를 제공하고 로컬 편집이 유지되도록 함.
2. **IndexedDB 서비스 (`src/services/db.ts`)**:
   - DB명: `jules_workspace_db` (오브젝트 스토어: `sessions`, `file_diffs`, `offline_queue`)
   - 오프라인 상태에서 발생한 수정 액션을 대기 큐에 저장함.
