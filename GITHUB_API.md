# GitHub REST API Reference Guide

JulesPWA 애플리케이션에서 Octokit SDK (`octokit` v5+) 및 Axios 인스턴스(`githubClient`)를 통해 연동하는 **GitHub REST API v3 명세 및 데이터 인터페이스 가이드**임.

---

## 1. 기본 정보 (Base Information)

- **Base URL**: `https://api.github.com`
- **Default Accept Header**: `application/vnd.github.v3+json`
- **Authentication**: Personal Access Token (PAT)
  - Header: `Authorization: token <GITHUB_PAT>`
  - LocalStorage Key: `github_pat`
- **SDK**: `octokit` (v5+) (`getOctokitClient()` helper를 통해 인스턴스 생성)

---

## 2. 주요 데이터 모델 (TypeScript Interfaces)

```typescript
/** GitHub Pull Request 상세 상태 객체 */
export interface GitHubPRDetails {
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged: boolean;
  html_url: string;
  headBranch: string;
  baseBranch: string;
  updatedAt: string;
  checkStatus?: 'success' | 'failure' | 'pending';
}

/** 저장소 상위 웹 및 GitHub Pages 링크 객체 */
export interface RepoLinks {
  repoUrl: string;
  pagesUrl: string;
}

/** 저장소 배포 헬스 및 Pages 호스팅 상태 객체 */
export interface RepoDeploymentHealth {
  repo: string;
  pagesDeployed: boolean;
  deploymentUrl: string;
  lastDeployedAt?: string;
  checkStatus: 'success' | 'failure' | 'pending';
}
```

---

## 3. 주요 API 함수 및 엔드포인트 명세 (API Endpoints Specification)

### 3.1 토큰 인증 상태 검증 (`verifyGitHubToken`)
- **Method & Path**: `GET /user`
- **Octokit SDK**: `octokit.rest.users.getAuthenticated()`
- **목적**: 입력된 GitHub PAT의 유효성 검증 및 인증된 사용자 로그인 ID(`login`) 확인.
- **주요 응답 필드**: `login`, `id`, `avatar_url`, `type`

### 3.2 인증된 사용자 저장소 목록 조회 (`fetchUserRepositories`)
- **Method & Path**: `GET /user/repos`
- **Octokit SDK**: `octokit.rest.repos.listForAuthenticatedUser({ per_page: 100, sort: 'updated' })`
- **목적**: 사용자가 접근 권한을 가진 저장소 목록(`full_name`) 반환.

### 3.3 Pull Request 상세 정보 조회 (`fetchGitHubPR`)
- **Method & Path**: `GET /repos/{owner}/{repo}/pulls/{pull_number}`
- **Octokit SDK**: `octokit.rest.pulls.get({ owner, repo, pull_number })`
- **목적**: 지정된 PR의 열림/닫힘/머지 상태, 헤드/베이스 브랜치명 및 웹 URL 조회.
- **반환 모델**: `GitHubPRDetails`

### 3.4 GitHub Pages 배포 상태 조회 (`fetchRepoDeploymentStatus`)
- **Method & Path**: `GET /repos/{owner}/{repo}/pages`
- **Octokit SDK**: `octokit.rest.repos.getPages({ owner, repo })`
- **목적**: 저장소의 GitHub Pages 구축 상태 및 호스팅 URL(`html_url`), 배포 일시 확인.
- **반환 모델**: `RepoDeploymentHealth`

### 3.5 Ref 단위 Check Runs 목록 조회 (`fetchCheckRuns`)
- **Method & Path**: `GET /repos/{owner}/{repo}/commits/{ref}/check-runs`
- **Octokit SDK**: `octokit.rest.checks.listForRef({ owner, repo, ref })`
- **목적**: 커밋/브랜치 Ref에 대한 GitHub Actions CI/CD 실행 성공/실패 상태 확인.
- **반환값**: `'success'` | `'failure'` | `'pending'`

---

## 4. 에러 핸들링 및 예외 처리 (Error Handling)

| 상태 코드 | 의미 | 클라이언트 처리 방식 |
|---|---|---|
| `200 OK` | 성공 | 데이터 구조화 및 React Query 캐시 반영 |
| `401 Unauthorized` | 유효하지 않거나 만료된 PAT | 온보딩/설정 모달 토큰 재입력 안내 및 비활성화 |
| `403 Forbidden` | API Rate Limit 초과 / 권한 부족 | 사용자 경고 노출 및 안전 폴백 값 제공 |
| `404 Not Found` | 존재하지 않는 레포 또는 PR | 기본 링크(`getRepoLinks`) 호환 안전 처리 |
