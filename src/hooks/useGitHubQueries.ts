import { useQuery } from '@tanstack/react-query';
import {
  fetchUserRepositories,
  fetchGitHubPR,
  fetchRepoDeploymentStatus,
  GitHubPRDetails,
  RepoDeploymentHealth,
  getGitHubToken,
} from '../services/githubApi';

export const GITHUB_QUERY_KEYS = {
  userRepos: ['userRepos'] as const,
  prDetail: (repo: string, prNumber: number) => ['githubPR', repo, prNumber] as const,
  deploymentHealth: (repos: string[]) => ['repoDeploymentHealth', ...repos] as const,
};

/**
 * 사용자 GitHub 저장소 목록 Query Hook
 */
export function useUserRepositoriesQuery() {
  const token = getGitHubToken();
  return useQuery<string[]>({
    queryKey: GITHUB_QUERY_KEYS.userRepos,
    queryFn: fetchUserRepositories,
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 특정 레포지토리 PR 상세 Query Hook
 */
export function useGitHubPRQuery(repo: string, prNumber: number | undefined) {
  return useQuery<GitHubPRDetails | null>({
    queryKey: GITHUB_QUERY_KEYS.prDetail(repo, prNumber || 0),
    queryFn: () => (prNumber ? fetchGitHubPR(repo, prNumber) : Promise.resolve(null)),
    enabled: !!repo && !!prNumber,
  });
}

/**
 * 레포지토리 목록 배포 헬스 상태 Query Hook
 */
export function useRepoDeploymentStatusQuery(repos: string[]) {
  return useQuery<RepoDeploymentHealth[]>({
    queryKey: GITHUB_QUERY_KEYS.deploymentHealth(repos),
    queryFn: () => Promise.all(repos.map((r) => fetchRepoDeploymentStatus(r))),
    enabled: repos.length > 0,
    staleTime: 1000 * 60 * 2, // 2분
  });
}
