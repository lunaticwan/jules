# JulesPWA

Google Jules REST API & GitHub REST API 기반의 모바일/데스크톱 반응형 PWA 대시보드 및 작업 관리 플랫폼.

---

## 1. 프로젝트 개요 (Overview)

JulesPWA는 **Google Jules REST API** 및 **GitHub REST API**와 연동하여 AI 작업 세션 모니터링, 플랜 승인, 코드 디프 검토, 1-Click AI 스캔 발주 등의 작업을 수행할 수 있는 대시보드 웹 앱임.
반응형 PWA(Progressive Web App)로 설계되어 데스크톱 및 모바일(갤럭시 폴드 시리즈 포함) 환경에 최적화된 사용자 경험을 제공함.

---

## 2. 주요 기능 (Key Features)

- **반응형 Split / Single Column View**:
  - 화면 너비(`md` 미디어 쿼리)에 따라 PC/대화면 모드에서는 좌측 세션 목록 + 우측 상세 뷰(Split View)를 제공하며, 모바일 화면에서는 단일 컬럼 전환.
- **Google Jules 세션 실시간 모니터링 & 작업 관리**:
  - Jules 작업 세션 상태 (`IN_PROGRESS`, `AWAITING_APPROVAL`, `COMPLETED`, `FAILED`) 모니터링.
  - 타임라인 기반 메시지 및 렌더링 (`react-markdown` + `remark-gfm`).
  - 검토 대기 플랜 승인 (`Approve Plan`) 및 세션별 피드백 메시지 전송.
- **1-Click AI Quick Action**:
  - Lint/타입 검사, 보안 패키지 점검, 성능 번들 최적화, 테스트 코드 자동 생성 작업을 1-Click으로 자동 세션 생성 및 발주.
- **변경 파일 Diff 뷰어 (Changed Files View)**:
  - Git 패치 디프(`diff` 패키지의 `parsePatch`) 기반 Hunk 및 라인별 변경사항 시각화.
  - 파일 추가/수정/삭제 상태 표기 및 라인 수 집계.
- **URL Query Parameter 기반 동적 라우팅**:
  - `session` 및 `repo` 파라미터를 브라우저 URL과 양방향 동기화하여 히스토리(Back/Forward) 스택을 완벽 지원.
- **오프라인 지원 및 안전한 로컬 폴백 메커니즘**:
  - IndexedDB (`src/services/db.ts`)를 활용한 캐싱 및 오프라인 액션 큐 관리.
  - API 키 미입력, CORS 제약, 네트워크 단절 시 LocalStorage/인메모리 모의(Mock) 세션 데이터로 자동 폴백하여 상시 정상 작동 보장.
- **전역 키보드 단축키 & 테마 지원**:
  - `/` (검색), `N` (새 작업), `R` (새로고침), `Shift+?` (단축키 안내) 지원.
  - 다크/라이트 테마 설정 (`ThemeProvider`) 및 로컬스토리지 저장.

---

## 3. 기술 스택 (Tech Stack)

| 구분 | 주요 기술 / 라이브러리 |
|---|---|
| **Core Framework** | React 18, Vite 5, TypeScript 5 |
| **Styling** | Tailwind CSS v3, PostCSS, Autoprefixer, Lucide React |
| **State & Data Fetching** | TanStack React Query v5, Axios, Octokit SDK v5 |
| **Validation & Data Parsing** | Zod v4, `diff` (parsePatch) |
| **Offline & Storage** | IndexedDB (`jules_workspace_db`), LocalStorage |
| **UI & Markdown** | React Markdown, Remark GFM, Lucide Icons |
| **Testing** | Vitest, jsdom |
| **PWA & Deployment** | vite-plugin-pwa, GitHub Actions, GitHub Pages |

---

## 4. 디렉토리 구조 및 LLM 파악 가이드 (Codebase Architecture for LLMs)

LLM 및 개발자가 프로젝트 파악 시 참조해야 할 핵심 파일 구조 및 역할은 다음과 같음:

```
src/
├── services/                 # API 클라이언트, 데이터 스토리지, 도메인 비즈니스 로직
│   ├── apiClient.ts          # Axios 인스턴스 (julesClient, githubClient) 및 인터셉터
│   ├── julesApi.ts           # Jules REST API 호출, Zod 스키마, 안전 파서, 로컬 폴백
│   ├── githubApi.ts          # Octokit SDK 기반 GitHub REST API (PAT 검증, PR, Pages, Checks)
│   └── db.ts                 # IndexedDB 오프라인 캐시 및 파일 디프 스토리지 서비스
├── hooks/                    # TanStack React Query 커스텀 훅
│   ├── useJulesQueries.ts    # Jules 세션 목록, 상세, 세션 생성, 플랜 승인, 메시지 전송 뮤테이션
│   └── useGitHubQueries.ts   # GitHub 저장소, PR 상세, Pages 배포 헬스 쿼리
├── components/               # React UI 컴포넌트
│   ├── DashboardView.tsx     # 세션 목록, 레포 필터링, 상단 헤더, 컨트롤 액션 바
│   ├── TaskDetailView.tsx    # 세션 상세, 플랜 진행 상황, 메시지 타임라인, 풀 세션 복사
│   ├── ChangedFilesView.tsx  # Git 패치 기반 변경 파일 디프 뷰어
│   ├── NewTaskSheet.tsx      # 신규 Jules 태스크 생성 바텀 시트
│   ├── OnboardingModal.tsx   # Jules API 키 및 GitHub PAT 인증 설정 모달
│   ├── KeyboardShortcutsModal.tsx # 전역 키보드 단축키 안내 모달
│   └── ui/                   # 재사용 가능한 원자적 UI 컴포넌트 (Badge, Button, Card 등)
├── context/
│   └── ThemeContext.tsx      # 다크/라이트 테마 전역 상태 관리자
├── App.tsx                   # 메인 반응형 레이아웃 (Split View / Single Column) 및 URL 라우팅 Sync
└── main.tsx                  # 애플리케이션 엔트리 포인트 (QueryClientProvider, ThemeProvider)
```

### LLM 코드 확장 및 유지보수 지침
1. **타입 안전성 및 데이터 파싱**:
   - Jules API 응답 수신 시 반드시 `safeParseJulesSession` (`src/services/julesApi.ts`)을 경유하여 검증 및 기본값 보정을 수행할 것.
2. **네트워크 에러 방어**:
   - API 통신 시 예외 발생 시 애플리케이션 전체가 멈추지 않도록 `getStoredSessions()` 또는 IndexedDB 캐시 데이터를 로드하는 로컬 폴백을 유지할 것.
3. **폰트 크기 및 스타일링 규칙**:
   - arbitrary px 스타일(`text-[10px]` 등) 대신 Tailwind 표준 폰트 유틸리티(`text-xs` 등)를 사용할 것.
4. **인증 정보 저장**:
   - Jules API Key는 `jules_api_key`, GitHub PAT는 `github_pat` 키로 LocalStorage에 저장 관리됨.

---

## 5. 프로젝트 문서 안내 (Project Documentation)

자세한 API 명세 및 변경 이력은 다음 전용 가이드 문서를 참조함:

- **Google Jules REST API 명세**: [`JULES_API.md`](./JULES_API.md)
  - Base URL: `https://jules.googleapis.com/v1alpha`
  - API Key Auth (`?key=<JULES_API_KEY>`)
  - 세션 목록/상세, 세션 생성, 플랜 승인, 메시지 송신 API
- **GitHub REST API 명세**: [`GITHUB_API.md`](./GITHUB_API.md)
  - Base URL: `https://api.github.com`
  - Bearer / Token Auth (Octokit SDK v5)
  - 사용자 정보, 저장소 목록, PR 상태, GitHub Pages 배포 헬스, Check Runs 조회 API
- **프로젝트 변경 이력**: [`CHANGELOG.md`](./CHANGELOG.md)
  - 버전별 주요 기능 구현, 버그 수정 및 개선 사항 관리

---

## 6. 개발 및 실행 가이드 (Development & Scripts)

### 패키지 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### TypeScript 타입 체크
```bash
npm run typecheck
```

### 단위 테스트 실행 (Vitest)
```bash
npm test
```

### 프로덕션 빌드
```bash
npm run build
```
- `npm run typecheck` 실행 후 Vite 빌드를 진행함.
- GitHub Pages SPA 라우팅 호환성을 위해 `dist/index.html`을 `dist/404.html`로 복사함.

---

## 7. CI/CD 및 배포 (Deployment)

- GitHub Actions Workflow (`.github/workflows/deploy.yml`)를 통해 `main` 브랜치 푸시 시 자동 실행됨.
- `npm run typecheck` 및 `npm test` 통과 후 `./dist` 디렉토리를 GitHub Pages로 자동 배포함.
