import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchJulesSessions,
  fetchJulesSessionDetail,
  createJulesSession,
  approveJulesPlan,
  sendJulesMessage,
  triggerQuickAiAction,
  JulesSession,
} from '../services/julesApi';

export const JULES_QUERY_KEYS = {
  sessions: ['julesSessions'] as const,
  sessionDetail: (id: string) => ['julesSession', id] as const,
};

/**
 * Jules 세션 목록 Query Hook
 */
export function useJulesSessionsQuery() {
  return useQuery<JulesSession[]>({
    queryKey: JULES_QUERY_KEYS.sessions,
    queryFn: fetchJulesSessions,
    staleTime: 1000 * 30, // 30초 간 신선한 상태 유지
  });
}

/**
 * 특정 Jules 세션 상세 Query Hook
 */
export function useJulesSessionDetailQuery(sessionId: string | null | undefined) {
  return useQuery<JulesSession | null>({
    queryKey: JULES_QUERY_KEYS.sessionDetail(sessionId || ''),
    queryFn: () => (sessionId ? fetchJulesSessionDetail(sessionId) : Promise.resolve(null)),
    enabled: !!sessionId,
  });
}

/**
 * 신규 Jules 세션 생성 Mutation Hook
 */
export function useCreateJulesSessionMutation() {
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
 * 플랜 승인 Mutation Hook
 */
export function useApproveJulesPlanMutation() {
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
 * 세션 메시지 전송 Mutation Hook
 */
export function useSendJulesMessageMutation() {
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
 * 1-Click AI 스마트 작업 제안 Mutation Hook
 */
export function useQuickAiActionMutation() {
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
