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
    <div className="min-h-screen bg-slate-900 text-slate-100 max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
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
          onRepoSelect={setSelectedRepo}
          onSelectSession={setSelectedSession}
          onApprovePlan={handleApprovePlan}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
          onRefresh={loadSessions}
          isLoading={isLoading}
        />
      )}

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
