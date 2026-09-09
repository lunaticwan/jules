// GitHub REST API 서비스

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

const GITHUB_TOKEN_KEY = 'github_pat';

export function getGitHubToken(): string {
  return localStorage.getItem(GITHUB_TOKEN_KEY) || '';
}

export function setGitHubToken(token: string): void {
  localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
}

export function clearGitHubToken(): void {
  localStorage.removeItem(GITHUB_TOKEN_KEY);
}

/**
 * 특정 레포지토리의 Pull Request 상태 조회
 */
export async function fetchGitHubPR(repo: string, prNumber: number): Promise<GitHubPRDetails | null> {
  const token = getGitHubToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}`, { headers });
    if (!response.ok) return null;

    const data = await response.json();
    return {
      number: data.number,
      title: data.title,
      state: data.state,
      merged: data.merged || false,
      html_url: data.html_url,
      headBranch: data.head?.ref || '',
      baseBranch: data.base?.ref || '',
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.warn('GitHub PR fetch failed:', err);
    return null;
  }
}

/**
 * CI/CD Check Runs 상태 조회
 */
export async function fetchCheckRuns(repo: string, ref: string): Promise<'success' | 'failure' | 'pending'> {
  const token = getGitHubToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/commits/${ref}/check-runs`, { headers });
    if (!response.ok) return 'pending';

    const data = await response.json();
    if (!data.check_runs || data.check_runs.length === 0) return 'pending';

    const runs = data.check_runs;
    const hasFailure = runs.some((r: any) => r.conclusion === 'failure');
    if (hasFailure) return 'failure';

    const allCompletedSuccess = runs.every((r: any) => r.status === 'completed' && r.conclusion === 'success');
    if (allCompletedSuccess) return 'success';

    return 'pending';
  } catch {
    return 'pending';
  }
}
