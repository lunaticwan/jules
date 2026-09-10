import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  fetchJulesSessions,
  fetchJulesSessionDetail,
  createJulesSession,
  approveJulesPlan,
  sendJulesMessage,
  triggerQuickAiAction,
  JulesSession,
} from '../services/julesApi';

/**
 * Jules API React Query 키 상수 집합
 */
export const JULES_QUERY_KEYS = {
  /** 전체 세션 목록 캐시 키 */
  sessions: ['julesSessions'] as const,
  /** 특정 세션 상세 캐시 키 팩토리 */
  sessionDetail: (id: string) => ['julesSession', id] as const,
};

/**
 * Jules 전체 세션 목록을 조회하는 React Query 커스텀 훅
 */
export function useJulesSessionsQuery(): UseQueryResult<JulesSession[], Error> {
  return useQuery<JulesSession[]>({
    queryKey: JULES_QUERY_KEYS.sessions,
    queryFn: fetchJulesSessions,
    staleTime: 1000 * 30,
  });
}

/**
 * 단일 Jules 세션의 상세 정보를 조회하는 React Query 커스텀 훅
 */
export function useJulesSessionDetailQuery(
  sessionId: string | null | undefined
): UseQueryResult<JulesSession | null, Error> {
  return useQuery<JulesSession | null>({
    queryKey: JULES_QUERY_KEYS.sessionDetail(sessionId || ''),
    queryFn: () => (sessionId ? fetchJulesSessionDetail(sessionId) : Promise.resolve(null)),
    enabled: !!sessionId,
  });
}

/**
 * 신규 Jules 태스크 세션을 생성하는 React Query Mutation 커스텀 훅
 */
export function useCreateJulesSessionMutation(): UseMutationResult<
  JulesSession,
  Error,
  { repository: string; baseBranch: string; prompt: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { repository: string; baseBranch: string; prompt: string }) =>
      createJulesSession(params),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: JULES_QUERY_KEYS.sessions });
      queryClient.setQueryData<JulesSession[]>(JULES_QUERY_KEYS.sessions, (old) =>
        old ? [newSession, ...old] : [newSession]
      );
    },
  });
}

/**
 * 세션의 검토 대기 플랜을 승인하는 React Query Mutation 커스텀 훅
 */
export function useApproveJulesPlanMutation(): UseMutationResult<JulesSession, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => approveJulesPlan(sessionId),
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: JULES_QUERY_KEYS.sessions });
      queryClient.invalidateQueries({
        queryKey: JULES_QUERY_KEYS.sessionDetail(updatedSession.id),
      });
    },
  });
}

/**
 * 세션 메시지/피드백을 전송하는 React Query Mutation 커스텀 훅
 */
export function useSendJulesMessageMutation(): UseMutationResult<
  JulesSession,
  Error,
  { sessionId: string; message: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      sendJulesMessage(sessionId, message),
    onSuccess: (updatedSession) => {
      queryClient.invalidateQueries({ queryKey: JULES_QUERY_KEYS.sessions });
      queryClient.invalidateQueries({
        queryKey: JULES_QUERY_KEYS.sessionDetail(updatedSession.id),
      });
    },
  });
}

/**
 * 1-Click AI 스캔/최적화 세션을 자동 발주하는 React Query Mutation 커스텀 훅
 */
export function useQuickAiActionMutation(): UseMutationResult<
  JulesSession,
  Error,
  { repo: string; actionType: 'lint' | 'security' | 'perf' | 'test' }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repo, actionType }: { repo: string; actionType: 'lint' | 'security' | 'perf' | 'test' }) =>
      triggerQuickAiAction(repo, actionType),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: JULES_QUERY_KEYS.sessions });
      queryClient.setQueryData<JulesSession[]>(JULES_QUERY_KEYS.sessions, (old) =>
        old ? [newSession, ...old] : [newSession]
      );
    },
  });
}
