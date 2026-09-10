# GitHub REST API Reference Guide

JulesPWA 애플리케이션에서 Octokit SDK 및 Axios 인스턴스를 통해 연동하는 **GitHub REST API v3 명세 및 연동 가이드**입니다.

---

## 1. 기본 정보 (Base Information)

- **Base URL**: `https://api.github.com`
- **Default Accept Header**: `application/vnd.github.v3+json`
- **Authentication Header**: `Authorization: token <GITHUB_PAT>` 또는 `Authorization: Bearer <GITHUB_PAT>`
- **SDK**: `@octokit/rest` / `octokit` (v5+)

---

## 2. 주요 엔드포인트 명세 (Key Endpoints Specification)

### 2.1 인증된 사용자 계정 확인 (Authenticated User)
- **Method & Path**: `GET /user`
- **Octokit SDK**: `octokit.rest.users.getAuthenticated()`
- **목적**: GitHub Personal Access Token (PAT) 실시간 연결 검증 및 사용자 ID/Login 조회.
- **주요 응답 필드**:
  ```json
  {
    "login": "octocat",
    "id": 1,
    "avatar_url": "https://github.com/images/error/octocat_happy.gif",
    "type": "User"
  }
  ```

### 2.2 사용자 저장소 목록 조회 (List Repositories for Authenticated User)
- **Method & Path**: `GET /user/repos`
- **Octokit SDK**: `octokit.rest.repos.listForAuthenticatedUser({ per_page: 100, sort: 'updated' })`
- **쿼리 파라미터**: `sort=updated`, `per_page=100`, `visibility=all`
- **주요 응답 필드**:
  ```json
  [
    {
      "id": 1296269,
      "name": "mobile-pwa",
      "full_name": "acme/mobile-pwa",
      "private": false,
      "html_url": "https://github.com/acme/mobile-pwa",
      "default_branch": "main"
    }
  ]
  ```

### 2.3 Pull Request 상세 정보 조회 (Get a Pull Request)
- **Method & Path**: `GET /repos/{owner}/{repo}/pulls/{pull_number}`
- **Octokit SDK**: `octokit.rest.pulls.get({ owner, repo, pull_number })`
- **주요 응답 필드**:
  ```json
  {
    "number": 42,
    "state": "open",
    "title": "Fix safe area layout on mobile",
    "html_url": "https://github.com/acme/mobile-pwa/pull/42",
    "head": { "ref": "fix/safe-area" },
    "base": { "ref": "main" },
    "merged": false,
    "updated_at": "2026-09-10T07:00:00Z"
  }
  ```

### 2.4 GitHub Pages 배포 상태 조회 (Get GitHub Pages Site)
- **Method & Path**: `GET /repos/{owner}/{repo}/pages`
- **Octokit SDK**: `octokit.rest.repos.getPages({ owner, repo })`
- **주요 응답 필드**:
  ```json
  {
    "url": "https://api.github.com/repos/acme/mobile-pwa/pages",
    "status": "built",
    "html_url": "https://acme.github.io/mobile-pwa/",
    "updated_at": "2026-09-10T06:00:00Z"
  }
  ```

### 2.5 Ref 단위 Check Runs 목록 조회 (List Check Runs for a Git Reference)
- **Method & Path**: `GET /repos/{owner}/{repo}/commits/{ref}/check-runs`
- **Octokit SDK**: `octokit.rest.checks.listForRef({ owner, repo, ref })`
- **주요 응답 필드**:
  ```json
  {
    "total_count": 1,
    "check_runs": [
      {
        "id": 4,
        "name": "build-and-test",
        "status": "completed",
        "conclusion": "success"
      }
    ]
  }
  ```

---

## 3. 에러 핸들링 및 상태 코드 (Error Handling)

| 상태 코드 | 의미 | 처리 방식 |
|---|---|---|
| `200 OK` | 성공 | 정상 데이터 파싱 및 캐시 반영 |
| `401 Unauthorized` | 유효하지 않거나 만료된 토큰 | LocalStorage 토큰 갱신 안내 및 Mock 데이터 Fallback |
| `403 Forbidden` | API Rate Limit 초과 또는 권한 부족 | 사용자 경고 메시지 출력 및 로컬 모드 전환 |
| `404 Not Found` | 존재하지 않는 레포/PR | 기본 링크 형식으로 안전 유연 처리 |
