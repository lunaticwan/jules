# Changelog

JulesPWA 프로젝트의 주요 변경 이력 및 버전별 업데이트 내역임.

---

## [Unreleased]

---

## [0.1.0] - 2026-09-11

### 추가 (Added)
- **모바일/데스크톱 반응형 대시보드 레이아웃**:
  - `md` 미디어 쿼리 기반 대화면 Split View (세션 목록 + 상세 뷰) 및 모바일 Single Column View 구현.
- **Google Jules REST API (`v1alpha`) 연동**:
  - 세션 목록/상세 조회, 세션 생성, 플랜 승인(`approveJulesPlan`), 추가 피드백 메시지 전송 기능 구현.
  - Zod 스키마 (`JulesSessionSchema`, `JulesMessageSchema`, `JulesPlanStepSchema`) 및 안전 런타임 파서 (`safeParseJulesSession`) 작성.
- **1-Click AI Quick Action**:
  - Lint/타입 검사, 보안 취약점 점검, 성능 최적화, 테스트 코드 생성 자동 발주 기능 탑재.
- **Git 패치 변경 파일 디프 뷰어 (Changed Files View)**:
  - `diff` 패키지의 `parsePatch` 기반 Hunk/라인 단위 변경사항 시각화 및 라인 집계.
- **GitHub REST API v3 및 Octokit SDK (v5) 연동**:
  - 인증 계정 검증, 저장소 목록, PR 상태, GitHub Pages 배포 헬스 및 Check Runs CI/CD 상태 조회.
- **오프라인 지원 및 캐시 시스템**:
  - IndexedDB (`jules_workspace_db`) 및 LocalStorage 기반 인메모리 백업 캐시 구조 작성.
- **URL Query Parameter 기반 동적 라우팅**:
  - `session` 및 `repo` URL 파라미터 양방향 동기화 및 브라우저 히스토리(`popstate`) 연동.
- **전역 단축키 & 테마 모듈**:
  - `/`, `N`, `R`, `Shift+?` 단축키 및 `ThemeProvider` 기반 다크/라이트 테마 전환.

### 문서화 (Documentation)
- **`README.md` 전체 재작성**:
  - 프로젝트 개요, 주요 기능, 기술 스택, LLM 파악용 디렉토리 가이드, 스크립트 및 CI/CD 배포 절차 현행화.
- **`JULES_API.md` 현행화**:
  - Google Jules REST API 명세, Zod 데이터 스키마, 상태/메시지 정의 및 로컬 폴백 구조 수록.
- **`GITHUB_API.md` 현행화**:
  - Octokit SDK 엔드포인트 명세, `GitHubPRDetails` / `RepoDeploymentHealth` 인터페이스 및 에러 처리 규격 반영.
- **`CHANGELOG.md` 신규 작성**:
  - 프로젝트 변경 이력 관리 체계 수립.
