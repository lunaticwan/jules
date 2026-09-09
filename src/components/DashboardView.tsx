import React, { useState, useEffect } from 'react';
import { Settings, Plus, RefreshCw, Terminal, Clock, AlertCircle, CheckCircle2, Search, Moon, Sun, Filter, GitBranch, Globe } from 'lucide-react';
import { SessionCard } from './SessionCard';
import { JulesSession } from '../services/julesApi';
import { getGitHubToken, fetchUserRepositories, getRepoLinks } from '../services/githubApi';
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
  isLoading,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'COMPLETED'>('ALL');
  const [userRepos, setUserRepos] = useState<string[]>([]);

  const githubToken = getGitHubToken();

  useEffect(() => {
    if (githubToken) {
      fetchUserRepositories().then((repos) => {
        if (repos && repos.length > 0) {
          setUserRepos(repos);
        }
      });
    }
  }, [githubToken]);

  // 세션 목록 내 레포지토리와 GitHub API에서 받아온 레포지토리 합집합
  const allRepos = Array.from(
    new Set([
      ...sessions.map((s) => s.repository).filter(Boolean),
      ...userRepos,
    ])
  );

  // 요약 카운트
  const inProgressCount = sessions.filter((s) => s.state === 'IN_PROGRESS').length;
  const awaitingApprovalCount = sessions.filter((s) => s.state === 'AWAITING_APPROVAL').length;
  const completedCount = sessions.filter((s) => s.state === 'COMPLETED').length;

  // 필터링된 세션 목록
  const filteredSessions = sessions.filter((s) => {
    const matchesRepo = selectedRepo === 'ALL' || s.repository === selectedRepo;
    const matchesStatus = statusFilter === 'ALL' || s.state === statusFilter;
    const matchesQuery =
      searchQuery.trim() === '' ||
      (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.prompt && s.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.repository && s.repository.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRepo && matchesStatus && matchesQuery;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3.5 py-2.5 backdrop-blur-md safe-pt">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm shrink-0">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">JulesPWA</h1>
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Workspace Management</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title={theme === 'dark' ? '라이트 모드로 변경' : '다크 모드로 변경'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
          </button>
          <button
            onClick={onRefresh}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 active:rotate-180 transition-transform"
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            title="설정"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 업무용 단일 통합 툴바 (Repository Dropdown & Search & Status Filter) */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        {/* Repo Select & Search */}
        <div className="flex gap-2 items-center">
          {/* Repository Dropdown Select */}
          <div className="relative shrink-0 max-w-[160px] sm:max-w-[200px]">
            <select
              value={selectedRepo}
              onChange={(e) => onRepoSelect(e.target.value)}
              className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
            >
              <option value="ALL">전체 레포지토리 ({sessions.length})</option>
              {allRepos.map((repo) => {
                const count = sessions.filter((s) => s.repository === repo).length;
                return (
                  <option key={repo} value={repo}>
                    {repo} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
            <Filter className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="태스크/레포 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Selected Repo Quick Links */}
        {selectedRepo !== 'ALL' && (
          <div className="flex items-center justify-between text-xs bg-blue-50/50 dark:bg-blue-950/30 px-2.5 py-1.5 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
            <span className="font-semibold text-blue-700 dark:text-blue-300 font-mono text-[11px] truncate">
              {selectedRepo}
            </span>
            <div className="flex items-center gap-2 text-[11px] shrink-0">
              <a
                href={getRepoLinks(selectedRepo).repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-500"
              >
                <GitBranch className="h-3 w-3" />
                GitHub
              </a>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <a
                href={getRepoLinks(selectedRepo).pagesUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <Globe className="h-3 w-3" />
                페이지
              </a>
            </div>
          </div>
        )}

        {/* Status Filter Indicator Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 ({sessions.length})
          </button>

          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40'
            }`}
          >
            <Clock className="h-3 w-3" />
            진행 중 ({inProgressCount})
          </button>

          <button
            onClick={() => setStatusFilter('AWAITING_APPROVAL')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
              statusFilter === 'AWAITING_APPROVAL'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40'
            }`}
          >
            <AlertCircle className="h-3 w-3" />
            승인 대기 ({awaitingApprovalCount})
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            완료됨 ({completedCount})
          </button>
        </div>
      </div>

      {/* Session List Grid */}
      <div className="p-3 space-y-2">
        {filteredSessions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-xs font-medium">검색 조건에 맞는 작업 세션이 없습니다.</p>
            {(searchQuery || statusFilter !== 'ALL' || selectedRepo !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  onRepoSelect('ALL');
                }}
                className="mt-2 text-xs text-blue-500 hover:underline font-semibold"
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

      {/* Quick Add Floating Button */}
      <button
        onClick={onOpenNewTask}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 active:scale-95 transition-all"
        title="새 태스크 작성"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};
