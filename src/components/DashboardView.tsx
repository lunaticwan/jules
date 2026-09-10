import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Settings, Plus, RefreshCw, Terminal, Clock, AlertCircle, CheckCircle2, Search, Moon, Sun, Filter, GitBranch, Globe, ArrowUpDown, Command } from 'lucide-react';
import { SessionCard } from './SessionCard';
import { JulesSession } from '../services/julesApi';
import { getGitHubToken, getRepoLinks } from '../services/githubApi';
import { useUserRepositoriesQuery } from '../hooks/useGitHubQueries';
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
  onOpenShortcuts?: () => void;
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
  onOpenShortcuts,
  isLoading,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'AWAITING_APPROVAL' | 'COMPLETED'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'REPO'>('NEWEST');

  const searchInputRef = useRef<HTMLInputElement>(null);

  const githubToken = getGitHubToken();
  const { data: userRepos = [] } = useUserRepositoriesQuery();

  // 글로벌 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input/Textarea 입력 중이면 단축키 비활성화
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onOpenNewTask();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onRefresh();
      } else if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        if (onOpenShortcuts) onOpenShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenNewTask, onRefresh, onOpenShortcuts]);

  // 세션 목록 내 레포지토리와 GitHub API 레포지토리 합집합
  const allRepos = useMemo(() => {
    return Array.from(
      new Set([
        ...sessions.map((s) => s.repository).filter(Boolean),
        ...userRepos,
      ])
    );
  }, [sessions, userRepos]);

  // 요약 카운트 메모이제이션
  const { inProgressCount, awaitingApprovalCount, completedCount } = useMemo(() => {
    return {
      inProgressCount: sessions.filter((s) => s.state === 'IN_PROGRESS').length,
      awaitingApprovalCount: sessions.filter((s) => s.state === 'AWAITING_APPROVAL').length,
      completedCount: sessions.filter((s) => s.state === 'COMPLETED').length,
    };
  }, [sessions]);

  // 필터링 및 정렬된 세션 목록 메모이제이션
  const sortedAndFilteredSessions = useMemo(() => {
    const filtered = sessions.filter((s) => {
      const matchesRepo = selectedRepo === 'ALL' || s.repository === selectedRepo;
      const matchesStatus = statusFilter === 'ALL' || s.state === statusFilter;
      const matchesQuery =
        searchQuery.trim() === '' ||
        (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.prompt && s.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.repository && s.repository.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesRepo && matchesStatus && matchesQuery;
    });

    return filtered.sort((a, b) => {
      if (sortOrder === 'OLDEST') {
        return new Date(a.updatedAt || a.createdAt || 0).getTime() - new Date(b.updatedAt || b.createdAt || 0).getTime();
      }
      if (sortOrder === 'REPO') {
        return (a.repository || '').localeCompare(b.repository || '');
      }
      // NEWEST (기본값)
      return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
    });
  }, [sessions, selectedRepo, statusFilter, searchQuery, sortOrder]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('ALL');
    onRepoSelect('ALL');
  }, [onRepoSelect]);

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
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="키보드 단축키 (Shift + ?)"
            >
              <Command className="h-4 w-4 text-blue-500" />
            </button>
          )}
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
            title="새로고침 (R)"
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

      {/* 업무용 단일 통합 툴바 */}
      <div className="p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-1.5">
        {/* Repo Select & Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-1.5 items-stretch sm:items-center">
          {/* Repository Dropdown Select */}
          <div className="relative shrink-0 w-full sm:w-auto min-w-[160px]">
            <select
              value={selectedRepo}
              onChange={(e) => onRepoSelect(e.target.value)}
              className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-md pl-2 pr-6 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">전체 저장소 ({sessions.length})</option>
              {allRepos.map((repo) => {
                const count = sessions.filter((s) => s.repository === repo).length;
                return (
                  <option key={repo} value={repo}>
                    {repo} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
            <Filter className="absolute right-2 top-1.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input with Hotkey trigger */}
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="태스크/레포 검색 (단축키 '/') ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 pl-7 pr-7 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            ) : (
              <kbd className="absolute right-2 top-1 text-[10px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1 rounded pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Sort Select */}
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-md pl-2 pr-6 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="NEWEST">최신 업데이트순</option>
              <option value="OLDEST">오래된순</option>
              <option value="REPO">저장소 이름순</option>
            </select>
            <ArrowUpDown className="absolute right-2 top-1.5 h-3 w-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Selected Repo Quick Links */}
        {selectedRepo !== 'ALL' && (
          <div className="flex items-center justify-between text-xs bg-blue-50/60 dark:bg-blue-950/40 px-2 py-1 rounded-md border border-blue-200/80 dark:border-blue-900/50">
            <span className="font-bold text-blue-700 dark:text-blue-300 font-mono text-[11px] break-all">
              {selectedRepo}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] shrink-0 ml-2">
              <a
                href={getRepoLinks(selectedRepo).repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-slate-600 dark:text-slate-300 hover:text-blue-500 font-medium"
              >
                <GitBranch className="h-3 w-3" />
                GitHub
              </a>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <a
                href={getRepoLinks(selectedRepo).pagesUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <Globe className="h-3 w-3" />
                페이지
              </a>
            </div>
          </div>
        )}

        {/* Status Filter Indicator Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pt-0.5 no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 font-bold'
                : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-200'
            }`}
          >
            전체 ({sessions.length})
          </button>

          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/40'
            }`}
          >
            <Clock className="h-3 w-3" />
            진행 ({inProgressCount})
          </button>

          <button
            onClick={() => setStatusFilter('AWAITING_APPROVAL')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ${
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
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            완료 ({completedCount})
          </button>
        </div>
      </div>

      {/* Dense Spreadsheet Table View */}
      <div className="p-1 overflow-x-auto">
        {sortedAndFilteredSessions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 text-center text-slate-500 dark:text-slate-400">
            <p className="text-xs font-medium">검색 조건에 맞는 작업 세션이 없습니다.</p>
            {(searchQuery || statusFilter !== 'ALL' || selectedRepo !== 'ALL') && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-xs text-blue-500 hover:underline font-semibold"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse bg-white dark:bg-slate-900/80 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-[10px] font-mono text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="py-1 px-1.5 font-bold">저장소 (Repo)</th>
                <th className="py-1 px-1 font-bold">브랜치</th>
                <th className="py-1 px-1.5 font-bold">태스크 요약</th>
                <th className="py-1 px-1 font-bold text-center">상태</th>
                <th className="py-1 px-1 font-bold text-center">PR</th>
                <th className="py-1 px-1 font-bold text-right">업데이트</th>
                <th className="py-1 px-1 font-bold text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isSelected={session.id === selectedSessionId}
                  onSelect={onSelectSession}
                  onApprovePlan={onApprovePlan}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Add Floating Button */}
      <button
        onClick={onOpenNewTask}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 active:scale-95 transition-all"
        title="새 태스크 작성 (N)"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};
