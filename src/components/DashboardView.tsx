import React from 'react';
import { Settings, Plus, RefreshCw, Terminal, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Tabs } from './ui/Tabs';
import { SessionCard } from './SessionCard';
import { JulesSession } from '../services/julesApi';

export interface DashboardViewProps {
  sessions: JulesSession[];
  selectedRepo: string;
  onRepoSelect: (repo: string) => void;
  onSelectSession: (session: JulesSession) => void;
  onApprovePlan: (sessionId: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenNewTask: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  selectedRepo,
  onRepoSelect,
  onSelectSession,
  onApprovePlan,
  onOpenSettings,
  onOpenNewTask,
  onRefresh,
  isLoading,
}) => {
  // 요약 카운트 계산
  const inProgressCount = sessions.filter((s) => s.state === 'IN_PROGRESS').length;
  const awaitingApprovalCount = sessions.filter((s) => s.state === 'AWAITING_APPROVAL').length;
  const completedCount = sessions.filter((s) => s.state === 'COMPLETED').length;

  // 레포지토리 리스트 추출
  const repos = Array.from(new Set(sessions.map((s) => s.repository)));
  const repoTabs = [
    { id: 'ALL', label: '전체', count: sessions.length },
    ...repos.map((r) => ({
      id: r,
      label: r,
      count: sessions.filter((s) => s.repository === r).length,
    })),
  ];

  // 필터링된 세션 목록
  const filteredSessions =
    selectedRepo === 'ALL'
      ? sessions
      : sessions.filter((s) => s.repository === selectedRepo);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md safe-pt">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-none">Jules & GitHub</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Mobile Task Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 active:rotate-180 transition-transform"
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            title="설정"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Stats Summary */}
      <div className="p-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-400">
            <Clock className="h-3 w-3" />
            진행 중
          </div>
          <p className="mt-1 text-xl font-bold text-slate-100">{inProgressCount}</p>
        </div>

        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-amber-400">
            <AlertCircle className="h-3 w-3" />
            승인 대기
          </div>
          <p className="mt-1 text-xl font-bold text-slate-100">{awaitingApprovalCount}</p>
        </div>

        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            완료됨
          </div>
          <p className="mt-1 text-xl font-bold text-slate-100">{completedCount}</p>
        </div>
      </div>

      {/* Repository Filter Tabs */}
      <div className="px-4 pb-2">
        <Tabs items={repoTabs} activeId={selectedRepo} onChange={onRepoSelect} />
      </div>

      {/* Session Card List */}
      <div className="px-4 pt-2 space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-8 text-center text-slate-400">
            등록된 작업 세션이 없습니다.
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={onSelectSession}
              onApprovePlan={onApprovePlan}
            />
          ))
        )}
      </div>

      {/* Floating Action Button (+) */}
      <button
        onClick={onOpenNewTask}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 active:scale-95 transition-all"
        title="새 태스크 작성"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
};
