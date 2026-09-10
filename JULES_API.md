# Google Jules REST API Reference Guide

JulesPWA 애플리케이션에서 Google Jules 서비스와 연동하기 위해 사용하는 **Google Jules REST API (`v1alpha`) 명세 및 데이터 규격 가이드**입니다.

---

## 1. 기본 정보 (Base Information)

- **Base URL**: `https://jules.googleapis.com/v1alpha`
- **Authentication Method**: URL Query Parameter `?key=<JULES_API_KEY>`
- **Content-Type**: `application/json`

---

## 2. 주요 엔드포인트 명세 (API Endpoints Specification)

### 2.1 세션 목록 조회 (List Sessions)
- **Method & Path**: `GET /sessions`
- **Query Parameters**:
  - `key` (string, 필수): Google Jules API 키
- **주요 응답 데이터 구조**:
  ```json
  {
    "sessions": [
      {
        "id": "sess-101",
        "name": "sessions/sess-101",
        "repository": "acme/mobile-pwa",
        "baseBranch": "main",
        "prompt": "다크 모드 가시성 개선 및 safe-area 패딩 버그 수정 요청",
        "state": "AWAITING_APPROVAL",
        "createdAt": "2026-09-10T06:30:00.000Z",
        "updatedAt": "2026-09-10T06:55:00.000Z",
        "title": "모바일 하단 레이아웃 Safe Area 여백 조정",
        "prUrl": "https://github.com/acme/mobile-pwa/pull/42",
        "prNumber": 42,
        "plan": [
          { "index": 1, "title": "index.css safe-area CSS 수립", "status": "completed" },
          { "index": 2, "title": "하단 액션 바 컴포넌트 여백 조정", "status": "completed" }
        ],
        "messages": [
          {
            "id": "m1",
            "sender": "user",
            "content": "다크 모드 가시성 개선 및 safe-area 패딩 버그 수정 요청",
            "timestamp": "2026-09-10T06:30:00.000Z",
            "type": "text"
          },
          {
            "id": "m2",
            "sender": "jules",
            "content": "요청 사항을 분석하고 작업 계획을 수립했습니다.",
            "timestamp": "2026-09-10T06:35:00.000Z",
            "type": "thought"
          }
        ]
      }
    ]
  }
  ```

### 2.2 세션 상세 조회 (Get Session Detail)
- **Method & Path**: `GET /{sessionId}` 또는 `GET /sessions/{sessionId}`
- **Query Parameters**: `key=<JULES_API_KEY>`
- **설명**: 지정된 세션 ID의 실행 상태, 생성된 PR 정보, 실행 플랜 및 메시지 타임라인을 조회함.

### 2.3 신규 작업 세션 생성 (Create Session)
- **Method & Path**: `POST /sessions`
- **Query Parameters**: `key=<JULES_API_KEY>`
- **Request Body**:
  ```json
  {
    "repository": "owner/repo",
    "baseBranch": "main",
    "prompt": "새 기능 구현 또는 버그 수정 지시사항"
  }
  ```
- **Response**: 생성된 `JulesSession` 데이터 객체 반환.

---

## 3. 데이터 모델 및 타입 정의 (TypeScript Data Types)

```typescript
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
  name: string;
  repository: string;
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
```

---

## 4. 오프라인 & 로컬 폴백 (Local Fallback Mechanism)

- GitHub Pages 등 클라이언트 환경에서 CORS 보안 정책이나 API 키 미입력, 네트워크 단절 등으로 인해 Jules API 호출 실패 발생 시:
  1. `getStoredSessions()` 함수가 자동으로 작동하여 LocalStorage / 인메모리 저장소의 모의(Mock) 세션 데이터를 로드함.
  2. 세션에 `repository` 정보가 누락되었을 경우 기본값(`acme/mobile-pwa`) 및 템플릿 타임라인 메시지를 안전하게 생성함.
