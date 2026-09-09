import React, { useState } from 'react';
import { Settings, Plus, RefreshCw, Terminal, Clock, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Tabs } from './ui/Tabs';
import { SessionCard } from './SessionCard';
import { JulesSession } from '../services/julesApi';
import { getGitHubToken } from '../services/githubApi';

export interface DashboardViewProps {
  sessions: JulesSession[];
  selectedRepo: string;
  selectedSessionId?: string;
  onRepoSelect: (repo: string) => void;
  onSelectSession: (session: JulesSession) => void;
  onApprovePlan: (sessionId: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenNewTask: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  isCompactView?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sessions,
  selectedRepo,
  selectedSessionId,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'COMPLETED'>('ALL');

  const githubToken = getGitHubToken();

  // 필터링된 세션 목록
  const filteredSessions = sessions.filter((s) => {
    const matchesRepo = selectedRepo === 'ALL' || s.repository === selectedRepo;
    const matchesStatus = statusFilter === 'ALL' || s.state === statusFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.repository.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRepo && matchesStatus && matchesQuery;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3 backdrop-blur-md safe-pt">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-100 leading-none">Jules & GitHub</h1>
              {githubToken ? (
                <span className="inline-flex items-center rounded-full bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400 border border-emerald-800/60">
                  GitHub 연동됨
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 border border-slate-700">
                  로컬/Mock 모드
                </span>
              )}
            </div>
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
        <button
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`rounded-xl border p-3 text-center transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-blue-500 bg-blue-900/40 ring-1 ring-blue-500'
              : 'border-blue-900/50 bg-blue-950/20 hover:bg-blue-950/30'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-400">
            <Clock className="h-3 w-3" />
            진행 중
          </div>
          <p className="mt-1 text-xl font-bold text-slate-100">{inProgressCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'AWAITING_APPROVAL' ? 'ALL' : 'AWAITING_APPROVAL')}
          className={`rounded-xl border p-3 text-center transition-all ${
            statusFilter === 'AWAITING_APPROVAL'
              ? 'border-amber-500 bg-amber-900/40 ring-1 ring-amber-500'
              : 'border-amber-900/50 bg-amber-950/20 hover:bg-amber-950/30'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-amber-400">
            <AlertCircle className="h-3 w-3" />
            승인 대기
          </div>
          <p className="mt-1 text-xl font-bold text-slate-100">{awaitingApprovalCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`rounded-xl border p-3 text-center transition-all ${
            statusFilter === 'COMPLETED'
              ? 'border-emerald-500 bg-emerald-900/40 ring-1 ring-emerald-500'
              : 'border-emerald-900/50 bg-emerald-950/20 hover:bg-emerald-950/30'
          }`}
        >
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            완료됨
          </div>
          <p className="mt-1 text-xl font-bold text-slate-100">{completedCount}</p>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="태스크, 레포지토리, 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-slate-800/80 border border-slate-700/80 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
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
            <p className="text-sm font-medium">검색 조건에 맞는 작업 세션이 없습니다.</p>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="mt-2 text-xs text-blue-400 hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              isSelected={session.id === selectedSessionId}
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
