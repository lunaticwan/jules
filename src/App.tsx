import React, { useState, useEffect } from 'react';
import { JulesSession, getJulesApiKey } from './services/julesApi';
import { useJulesSessionsQuery, useApproveJulesPlanMutation } from './hooks/useJulesQueries';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './components/DashboardView';
import { TaskDetailView } from './components/TaskDetailView';
import { NewTaskSheet } from './components/NewTaskSheet';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const { data: sessions = [], isLoading, refetch } = useJulesSessionsQuery();
  const approvePlanMutation = useApproveJulesPlanMutation();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>('ALL');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState<boolean>(false);
  const [isInitialOnboarding, setIsInitialOnboarding] = useState<boolean>(false);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId || s.name === selectedSessionId) || null;

  // URL Query 파라미터 기반 라우트 상태 읽기 및 동기화 (safe decode)
  const syncRouteFromUrl = (sessionList: JulesSession[]) => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const repoParam = params.get('repo');

      if (repoParam) {
        setSelectedRepo(decodeURIComponent(repoParam));
      }

      if (sessionParam) {
        const decodedSession = decodeURIComponent(sessionParam);
        const found = sessionList.find((s) => s.id === decodedSession || s.name === decodedSession);
        if (found) {
          setSelectedSessionId(found.id);
        }
      }
    } catch (err) {
      console.warn('URL 파라미터 디코딩 예외 방어:', err);
    }
  };

  // URL 파라미터 업데이트 함수 (pushState 활용)
  const updateUrlParams = (sessionId: string | null, repoId: string) => {
    const url = new URL(window.location.href);
    if (sessionId) {
      url.searchParams.set('session', sessionId);
    } else {
      url.searchParams.delete('session');
    }

    if (repoId && repoId !== 'ALL') {
      url.searchParams.set('repo', repoId);
    } else {
      url.searchParams.delete('repo');
    }

    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    const key = getJulesApiKey();
    if (!key) {
      setIsInitialOnboarding(true);
      setIsSettingsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      syncRouteFromUrl(sessions);
    }
  }, [sessions]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      const repoParam = params.get('repo');

      setSelectedRepo(repoParam || 'ALL');
      setSelectedSessionId(sessionParam || null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectSession = (session: JulesSession | null) => {
    const nextId = session ? session.id : null;
    setSelectedSessionId(nextId);
    updateUrlParams(nextId, selectedRepo);
  };

  const handleRepoSelect = (repo: string) => {
    setSelectedRepo(repo);
    updateUrlParams(selectedSessionId, repo);
  };

  const handleApprovePlan = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await approvePlanMutation.mutateAsync(sessionId);
    } catch (err) {
      console.error('플랜 승인 실패:', err);
    }
  };

  const handleSessionCreated = (newSession: JulesSession) => {
    handleSelectSession(newSession);
  };

  const handleUpdateSession = (_updated: JulesSession) => {
    // React Query Query Invalidation에 의해 자동으로 최신화됨
  };

  const existingRepos = Array.from(new Set(sessions.map((s) => s.repository)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden">
      {/* PC 윈도우 및 갤럭시 폴드5 펴짐/대화면 (md 이상) Split View 레이아웃 */}
      <div className="hidden md:flex h-screen overflow-hidden">
        {/* Left Side: Dashboard / Session List */}
        <div className="w-80 lg:w-96 border-r border-slate-800 flex flex-col h-full bg-slate-900 shrink-0">
          <DashboardView
            sessions={sessions}
            selectedRepo={selectedRepo}
            selectedSessionId={selectedSessionId || undefined}
            onRepoSelect={handleRepoSelect}
            onSelectSession={handleSelectSession}
            onApprovePlan={handleApprovePlan}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
            onRefresh={() => refetch()}
            onSessionCreated={handleSessionCreated}
            isLoading={isLoading}
            isCompactView
          />
        </div>

        {/* Right Side: Task Detail View or Empty Selection Placeholder */}
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
          {selectedSession ? (
            <ErrorBoundary onReset={() => handleSelectSession(null)}>
              <TaskDetailView
                session={selectedSession}
                onBack={() => handleSelectSession(null)}
                onUpdateSession={handleUpdateSession}
                isSplitView
              />
            </ErrorBoundary>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-300">선택된 태스크가 없습니다</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                좌측 세션 목록에서 작업 항목을 선택하거나, 하단 버튼으로 새로운 Jules 태스크를 생성하십시오.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 (갤럭시 폴드5 접힘 포함, md 미만) Single Column View */}
      <div className="block md:hidden min-h-screen bg-slate-900 max-w-md mx-auto shadow-2xl">
        {selectedSession ? (
          <ErrorBoundary onReset={() => handleSelectSession(null)}>
            <TaskDetailView
              session={selectedSession}
              onBack={() => handleSelectSession(null)}
              onUpdateSession={handleUpdateSession}
            />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary>
            <DashboardView
              sessions={sessions}
              selectedRepo={selectedRepo}
              selectedSessionId={undefined}
              onRepoSelect={handleRepoSelect}
              onSelectSession={handleSelectSession}
              onApprovePlan={handleApprovePlan}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
              onRefresh={() => refetch()}
              onSessionCreated={handleSessionCreated}
              isLoading={isLoading}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Onboarding / Settings Modal */}
      <OnboardingModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setIsInitialOnboarding(false);
        }}
        onSaveSuccess={() => {
          refetch();
        }}
        isInitialOnboarding={isInitialOnboarding}
      />

      {/* Quick New Task Bottom Sheet */}
      <NewTaskSheet
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onSessionCreated={handleSessionCreated}
        existingRepos={existingRepos}
      />
    </div>
  );
}
