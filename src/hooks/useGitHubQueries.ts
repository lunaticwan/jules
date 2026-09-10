import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  fetchUserRepositories,
  fetchGitHubPR,
  fetchRepoDeploymentStatus,
  GitHubPRDetails,
  RepoDeploymentHealth,
  getGitHubToken,
} from '../services/githubApi';

/**
 * GitHub API React Query 캐시 키 집합
 */
export const GITHUB_QUERY_KEYS = {
  /** 인증된 사용자 레포지토리 목록 키 */
  userRepos: ['userRepos'] as const,
  /** 특정 PR 상세 정보 키 팩토리 */
  prDetail: (repo: string, prNumber: number) => ['githubPR', repo, prNumber] as const,
  /** 저장소 배포 헬스 상태 키 팩토리 */
  deploymentHealth: (repos: string[]) => ['repoDeploymentHealth', ...repos] as const,
};

/**
 * 사용자 GitHub 저장소 목록을 조회하는 React Query 커스텀 훅
 */
export function useUserRepositoriesQuery(): UseQueryResult<string[], Error> {
  const token = getGitHubToken();
  return useQuery<string[]>({
    queryKey: GITHUB_QUERY_KEYS.userRepos,
    queryFn: fetchUserRepositories,
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 특정 저장소 PR 상세 상태를 조회하는 React Query 커스텀 훅
 */
export function useGitHubPRQuery(
  repo: string,
  prNumber: number | undefined
): UseQueryResult<GitHubPRDetails | null, Error> {
  return useQuery<GitHubPRDetails | null>({
    queryKey: GITHUB_QUERY_KEYS.prDetail(repo, prNumber || 0),
    queryFn: () => (prNumber ? fetchGitHubPR(repo, prNumber) : Promise.resolve(null)),
    enabled: !!repo && !!prNumber,
  });
}

/**
 * 지정된 저장소 목록의 배포 헬스 상태를 종합 조회하는 React Query 커스텀 훅
 */
export function useRepoDeploymentStatusQuery(repos: string[]): UseQueryResult<RepoDeploymentHealth[], Error> {
  return useQuery<RepoDeploymentHealth[]>({
    queryKey: GITHUB_QUERY_KEYS.deploymentHealth(repos),
    queryFn: () => Promise.all(repos.map((r) => fetchRepoDeploymentStatus(r))),
    enabled: repos.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
