import React, { useState } from 'react';
import { Settings, Plus, RefreshCw, Terminal, Clock, AlertCircle, CheckCircle2, Search, Moon, Sun, BarChart2, Layers, GitBranch, Globe } from 'lucide-react';
import { Tabs } from './ui/Tabs';
import { SessionCard } from './SessionCard';
import { AnalyticsView } from './AnalyticsView';
import { JulesSession } from '../services/julesApi';
import { getGitHubToken, getRepoLinks } from '../services/githubApi';
import { useTheme } from '../context/ThemeContext';

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
  onSessionCreated?: (session: JulesSession) => void;
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
  onSessionCreated,
  isLoading,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mainViewMode, setMainViewMode] = useState<'sessions' | 'analytics'>('sessions');

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
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 pb-24 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-3 backdrop-blur-md safe-pt">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">JulesPWA</h1>
              {githubToken ? (
                <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60">
                  GitHub 연동됨
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  로컬/Mock 모드
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Workspace & Task Management</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title={theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>
          <button
            onClick={onRefresh}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 active:rotate-180 transition-transform"
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            title="설정"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 대시보드 뷰 모드 전환 (세션 목록 / AI 스마트 데이터 분석) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2 gap-2">
        <button
          onClick={() => setMainViewMode('sessions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mainViewMode === 'sessions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          태스크 세션
        </button>

        <button
          onClick={() => setMainViewMode('analytics')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            mainViewMode === 'analytics'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          스마트 인사이트
        </button>
      </div>

      {mainViewMode === 'analytics' ? (
        <AnalyticsView sessions={sessions} onSessionCreated={onSessionCreated} />
      ) : (
        <>
          {/* Main Stats Summary */}
          <div className="p-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
              className={`rounded-xl border p-3 text-center transition-all ${
                statusFilter === 'IN_PROGRESS'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-500'
                  : 'border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" />
                진행 중
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{inProgressCount}</p>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'AWAITING_APPROVAL' ? 'ALL' : 'AWAITING_APPROVAL')}
              className={`rounded-xl border p-3 text-center transition-all ${
                statusFilter === 'AWAITING_APPROVAL'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/40 ring-1 ring-amber-500'
                  : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                승인 대기
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{awaitingApprovalCount}</p>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
              className={`rounded-xl border p-3 text-center transition-all ${
                statusFilter === 'COMPLETED'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 ring-1 ring-emerald-500'
                  : 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                완료됨
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{completedCount}</p>
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
                className="w-full rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Repository Filter Tabs & Selected Repo Quick Links */}
          <div className="px-4 pb-2 space-y-2">
            <Tabs items={repoTabs} activeId={selectedRepo} onChange={onRepoSelect} />
            {selectedRepo !== 'ALL' && (
              <div className="flex items-center justify-between text-xs bg-slate-100 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  선택 레포: {selectedRepo}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={getRepoLinks(selectedRepo).repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <GitBranch className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                  <span className="text-slate-400">|</span>
                  <a
                    href={getRepoLinks(selectedRepo).pagesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    페이지 바로가기
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Session Card List */}
          <div className="px-4 pt-2 space-y-3">
            {filteredSessions.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 p-8 text-center text-slate-500 dark:text-slate-400 shadow-sm">
                <p className="text-sm font-medium">검색 조건에 맞는 작업 세션이 없습니다.</p>
                {(searchQuery || statusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
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
        </>
      )}

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
