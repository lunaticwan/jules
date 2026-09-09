import React, { useState, useEffect } from 'react';
import {
  fetchJulesSessions,
  approveJulesPlan,
  JulesSession,
  getJulesApiKey,
} from './services/julesApi';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './components/DashboardView';
import { TaskDetailView } from './components/TaskDetailView';
import { NewTaskSheet } from './components/NewTaskSheet';

export default function App() {
  const [sessions, setSessions] = useState<JulesSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<JulesSession | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>('ALL');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialOnboarding, setIsInitialOnboarding] = useState<boolean>(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const list = await fetchJulesSessions();
      setSessions(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const key = getJulesApiKey();
    if (!key) {
      setIsInitialOnboarding(true);
      setIsSettingsOpen(true);
    }
    loadSessions();
  }, []);

  const handleApprovePlan = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await approveJulesPlan(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedSession && selectedSession.id === updated.id) {
        setSelectedSession(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSessionCreated = (newSession: JulesSession) => {
    setSessions((prev) => [newSession, ...prev]);
    setSelectedSession(newSession);
  };

  const handleUpdateSession = (updated: JulesSession) => {
    setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelectedSession(updated);
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
            selectedSessionId={selectedSession ? (selectedSession as JulesSession).id : undefined}
            onRepoSelect={setSelectedRepo}
            onSelectSession={setSelectedSession}
            onApprovePlan={handleApprovePlan}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
            onRefresh={loadSessions}
            onSessionCreated={handleSessionCreated}
            isLoading={isLoading}
            isCompactView
          />
        </div>

        {/* Right Side: Task Detail View or Empty Selection Placeholder */}
        <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
          {selectedSession ? (
            <TaskDetailView
              session={selectedSession}
              onBack={() => setSelectedSession(null)}
              onUpdateSession={handleUpdateSession}
              isSplitView
            />
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
          <TaskDetailView
            session={selectedSession}
            onBack={() => setSelectedSession(null)}
            onUpdateSession={handleUpdateSession}
          />
        ) : (
          <DashboardView
            sessions={sessions}
            selectedRepo={selectedRepo}
            selectedSessionId={undefined}
            onRepoSelect={setSelectedRepo}
            onSelectSession={setSelectedSession}
            onApprovePlan={handleApprovePlan}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
            onRefresh={loadSessions}
            onSessionCreated={handleSessionCreated}
            isLoading={isLoading}
          />
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
          loadSessions();
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
