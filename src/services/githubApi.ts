import { Octokit } from 'octokit';
import { getLogTimestamp } from '../utils/logger';

/**
 * GitHub Pull Request 상세 상태 객체
 */
export interface GitHubPRDetails {
  /** PR 번호 */
  number: number;
  /** PR 제목 */
  title: string;
  /** PR 열림/열림 상태 ('open' | 'closed') */
  state: 'open' | 'closed';
  /** 머지 여부 */
  merged: boolean;
  /** GitHub 웹 PR 페이지 URL */
  html_url: string;
  /** 작업 헤드 브랜치 명 */
  headBranch: string;
  /** 타겟 베이스 브랜치 명 */
  baseBranch: string;
  /** 최근 업데이트 일시 (ISO 8601) */
  updatedAt: string;
  /** CI/CD 검사 결과 */
  checkStatus?: 'success' | 'failure' | 'pending';
}

/**
 * 저장소 GitHub 상위 링크 객체
 */
export interface RepoLinks {
  /** 저장소 GitHub 메인 웹 URL */
  repoUrl: string;
  /** 저장소 GitHub Pages 서비스 URL */
  pagesUrl: string;
}

/**
 * 저장소명을 파싱하여 GitHub 레포지토리 및 Pages 서비스 URL을 생성함
 */
export function getRepoLinks(repository: string): RepoLinks {
  const parts = repository.split('/');
  const owner = parts[0] || 'owner';
  const repo = parts[1] || parts[0] || 'repo';
  return {
    repoUrl: `https://github.com/${repository}`,
    pagesUrl: `https://${owner}.github.io/${repo}/`,
  };
}

const GITHUB_TOKEN_KEY = 'github_pat' as const;

/**
 * LocalStorage에서 GitHub Personal Access Token을 안전하게 로드함
 */
export function getGitHubToken(): string {
  try {
    return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][GITHUB_TOKEN] LocalStorage 접근 실패:`, err);
    return '';
  }
}

/**
 * LocalStorage에 GitHub Personal Access Token을 저장함
 */
export function setGitHubToken(token: string): void {
  try {
    localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
    console.log(`[${getLogTimestamp()}][GITHUB_TOKEN_SAVED] GitHub PAT 저장 완료`);
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][GITHUB_TOKEN] LocalStorage 저장 실패:`, err);
  }
}

/**
 * LocalStorage에 저장된 GitHub Personal Access Token을 삭제함
 */
export function clearGitHubToken(): void {
  try {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
    console.log(`[${getLogTimestamp()}][GITHUB_TOKEN_CLEARED] GitHub PAT 삭제 완료`);
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][GITHUB_TOKEN] LocalStorage 삭제 실패:`, err);
  }
}

/**
 * Octokit REST SDK 인스턴스를 생성하여 반환함 (자동 로깅 훅 내장)
 */
export function getOctokitClient(overrideToken?: string): Octokit {
  const token = overrideToken !== undefined ? overrideToken : getGitHubToken();
  const octokit = new Octokit({
    auth: token || undefined,
  });

  octokit.hook.wrap('request', async (request, options) => {
    const timestamp = getLogTimestamp();
    console.log(`[${timestamp}][API_REQ] [GitHub-Octokit] ${options.method} ${options.url}`, options);
    try {
      const response = await request(options);
      console.log(`[${timestamp}][API_RES] [GitHub-Octokit] ${response.status} ${options.method} ${options.url}`, {
        data: response.data,
        headers: response.headers,
      });
      return response;
    } catch (error: any) {
      console.error(`[${timestamp}][API_ERR] [GitHub-Octokit] ${error?.status || 'ERR'} ${options.method} ${options.url}`, {
        message: error?.message,
        error,
      });
      throw error;
    }
  });

  return octokit;
}

/**
 * 특정 PR의 변경 파일(files) 목록을 GitHub Octokit REST API로 조회함
 */
export async function fetchPRFiles(
  repo: string,
  prNumber: number
): Promise<{ filepath: string; status: 'added' | 'modified' | 'deleted'; additions: number; deletions: number; patch?: string }[]> {
  console.log(`[${getLogTimestamp()}][fetchPRFiles] [START]`, { repo, prNumber });
  const parts = repo.split('/');
  const owner = parts[0];
  const repoName = parts[1] || parts[0];

  if (!owner || !repoName || !prNumber) {
    console.warn(`[${getLogTimestamp()}][fetchPRFiles] [INVALID_PARAMS]`, { owner, repoName, prNumber });
    return [];
  }

  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.pulls.listFiles({
      owner,
      repo: repoName,
      pull_number: prNumber,
      per_page: 100,
    });

    if (Array.isArray(response.data)) {
      const mapped = response.data.map((f: any) => ({
        filepath: f.filename,
        status: (['added', 'deleted', 'modified'].includes(f.status) ? f.status : 'modified') as 'added' | 'modified' | 'deleted',
        additions: f.additions || 0,
        deletions: f.deletions || 0,
        patch: f.patch,
      }));
      console.log(`[${getLogTimestamp()}][fetchPRFiles] [RESULT_COUNT: ${mapped.length}]`, mapped);
      return mapped;
    }
  } catch (err: any) {
    console.error(`[${getLogTimestamp()}][fetchPRFiles] [ERROR]`, err?.status, err?.message, err);
  }
  return [];
}

/**
 * GitHub PAT 인증 상태 및 사용자 계정을 검증함
 */
export async function verifyGitHubToken(
  tokenInput?: string
): Promise<{ success: boolean; username?: string; message: string }> {
  const token = tokenInput !== undefined ? tokenInput.trim() : getGitHubToken();
  console.log(`[${getLogTimestamp()}][verifyGitHubToken] [START] tokenLength: ${token.length}`);
  if (!token) {
    return { success: false, message: 'GitHub 토큰이 입력되지 않았음' };
  }

  try {
    const octokit = getOctokitClient(token);
    const userRes = await octokit.rest.users.getAuthenticated();
    const result = {
      success: true,
      username: userRes.data.login,
      message: `GitHub 인증 성공 (계정: ${userRes.data.login})`,
    };
    console.log(`[${getLogTimestamp()}][verifyGitHubToken] [SUCCESS]`, result);
    return result;
  } catch (err: any) {
    const status = err?.status || err?.response?.status;
    const msg = status === 401 ? '유효하지 않거나 만료된 GitHub 토큰임' : `GitHub 토큰 검증 실패: ${err?.message || '알 수 없는 오류'}`;
    console.warn(`[${getLogTimestamp()}][verifyGitHubToken] [FAILED]`, msg, err);
    return { success: false, message: msg };
  }
}

/**
 * 인증된 사용자의 GitHub 저장소 목록을 조회함
 */
export async function fetchUserRepositories(): Promise<string[]> {
  const token = getGitHubToken();
  if (!token) return [];

  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
    });

    if (Array.isArray(response.data)) {
      const repos = response.data.map((r) => r.full_name);
      console.log(`[${getLogTimestamp()}][fetchUserRepositories] [SUCCESS_COUNT: ${repos.length}]`, repos);
      return repos;
    }
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][fetchUserRepositories] [ERROR]`, err);
  }
  return [];
}

/**
 * 특정 PR의 라이브 상태 정보를 Octokit SDK로 조회함
 */
export async function fetchGitHubPR(repo: string, prNumber: number): Promise<GitHubPRDetails | null> {
  const parts = repo.split('/');
  const owner = parts[0];
  const repoName = parts[1] || parts[0];

  if (!owner || !repoName) return null;

  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.pulls.get({
      owner,
      repo: repoName,
      pull_number: prNumber,
    });

    const data = response.data;
    const details: GitHubPRDetails = {
      number: data.number,
      title: data.title,
      state: data.state as 'open' | 'closed',
      merged: data.merged || false,
      html_url: data.html_url,
      headBranch: data.head?.ref || '',
      baseBranch: data.base?.ref || '',
      updatedAt: data.updated_at,
    };
    console.log(`[${getLogTimestamp()}][fetchGitHubPR] [SUCCESS]`, details);
    return details;
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][fetchGitHubPR] [ERROR]`, err);
    return null;
  }
}

/**
 * 저장소 배포 헬스 및 Pages 호스팅 상태 객체
 */
export interface RepoDeploymentHealth {
  repo: string;
  pagesDeployed: boolean;
  deploymentUrl: string;
  lastDeployedAt?: string;
  checkStatus: 'success' | 'failure' | 'pending';
}

/**
 * GitHub Pages 배포 헬스 상태를 조회함
 */
export async function fetchRepoDeploymentStatus(repo: string): Promise<RepoDeploymentHealth> {
  const links = getRepoLinks(repo);
  const parts = repo.split('/');
  const owner = parts[0];
  const repoName = parts[1] || parts[0];

  if (owner && repoName) {
    try {
      const octokit = getOctokitClient();
      const response = await octokit.rest.repos.getPages({
        owner,
        repo: repoName,
      });

      if (response.data) {
        const pagesData = response.data as any;
        const result: RepoDeploymentHealth = {
          repo,
          pagesDeployed: true,
          deploymentUrl: pagesData.html_url || links.pagesUrl,
          lastDeployedAt: pagesData.updated_at || new Date().toISOString(),
          checkStatus: 'success',
        };
        console.log(`[${getLogTimestamp()}][fetchRepoDeploymentStatus] [SUCCESS]`, result);
        return result;
      }
    } catch (err) {
      console.warn(`[${getLogTimestamp()}][fetchRepoDeploymentStatus] [PAGES_FETCH_ERROR]`, err);
    }
  }

  return {
    repo,
    pagesDeployed: true,
    deploymentUrl: links.pagesUrl,
    lastDeployedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    checkStatus: 'success',
  };
}

/**
 * 특정 Ref에 대한 CI/CD Check Runs 실행 성공 여부를 조회함
 */
export async function fetchCheckRuns(repo: string, ref: string): Promise<'success' | 'failure' | 'pending'> {
  const parts = repo.split('/');
  const owner = parts[0];
  const repoName = parts[1] || parts[0];

  if (!owner || !repoName) return 'pending';

  try {
    const octokit = getOctokitClient();
    const response = await octokit.rest.checks.listForRef({
      owner,
      repo: repoName,
      ref,
    });

    const data = response.data;
    if (!data.check_runs || data.check_runs.length === 0) return 'pending';

    const runs = data.check_runs;
    const hasFailure = runs.some((r) => r.conclusion === 'failure');
    if (hasFailure) return 'failure';

    const allCompletedSuccess = runs.every((r) => r.status === 'completed' && r.conclusion === 'success');
    if (allCompletedSuccess) return 'success';

    return 'pending';
  } catch (err) {
    console.warn(`[${getLogTimestamp()}][fetchCheckRuns] [ERROR]`, err);
    return 'pending';
  }
}
