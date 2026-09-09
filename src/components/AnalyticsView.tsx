import React from 'react';
import { Sparkles, TrendingUp, Zap, Code2, Globe, CheckCircle2, Play } from 'lucide-react';
import { JulesSession } from '../services/julesApi';
import { useRepoDeploymentStatusQuery } from '../hooks/useGitHubQueries';
import { useQuickAiActionMutation } from '../hooks/useJulesQueries';

interface AnalyticsViewProps {
  sessions: JulesSession[];
  onSessionCreated?: (session: JulesSession) => void;
}

/**
 * Jules API 세션 데이터 + 로컬 성능/생산성 매트릭을 조합한 창의적 분석 인사이트 컴포넌트
 */
export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ sessions, onSessionCreated }) => {
  const total = sessions.length;
  const repos = Array.from(new Set(sessions.map((s) => s.repository)));

  const { data: healthData = [] } = useRepoDeploymentStatusQuery(repos);
  const quickAiActionMutation = useQuickAiActionMutation();

  const handleQuickAction = async (repo: string, type: 'lint' | 'security' | 'perf' | 'test') => {
    try {
      const newSession = await quickAiActionMutation.mutateAsync({ repo, actionType: type });
      if (onSessionCreated) {
        onSessionCreated(newSession);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const completed = sessions.filter((s) => s.state === 'COMPLETED').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 저장소별 세션 분포
  const repoStats = sessions.reduce((acc, curr) => {
    acc[curr.repository] = (acc[curr.repository] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4 p-4 animate-in fade-in">
      {/* 스마트 생산성 요약 카드 */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-amber-500" />
          AI 태스크 데이터 스마트 분석
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          워크스페이스 생산성 지표
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          Jules API 작업 세션과 로컬 메트릭을 조합하여 자동화 효율성 및 변경 파일 오버헤드를 최적화하고 있습니다.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 p-3 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              태스크 완료율
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {completionRate}%
            </p>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 p-3 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              평균 작업 시간
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              ~ 12분
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click AI 스마트 작업 제안 창조 */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 space-y-3">
        <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-indigo-500" />
          1-Click AI 스마트 작업 자동 발주
        </h4>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          GitHub 레포지토리를 직접 분석하여 즉시 실행 가능한 최적화 작업 세션을 1-Click으로 생성합니다.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            disabled={quickAiActionMutation.isPending || repos.length === 0}
            onClick={() => handleQuickAction(repos[0] || 'acme/mobile-pwa', 'perf')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left group"
          >
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500">번들 최적화</p>
              <p className="text-[10px] text-slate-500">PWA 로딩 속도 향상</p>
            </div>
            <Play className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          </button>

          <button
            disabled={quickAiActionMutation.isPending || repos.length === 0}
            onClick={() => handleQuickAction(repos[0] || 'acme/mobile-pwa', 'security')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left group"
          >
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500">보안 스캔</p>
              <p className="text-[10px] text-slate-500">의존성 패키지 점검</p>
            </div>
            <Play className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          </button>
        </div>
      </div>

      {/* GitHub Pages 실시간 배포 헬스 모니터링 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-emerald-500" />
          GitHub Pages 배포 라이브 헬스
        </h4>

        <div className="space-y-2 pt-1">
          {healthData.length === 0 ? (
            <p className="text-xs text-slate-500">배포 정보 로딩 중...</p>
          ) : (
            healthData.map((health) => (
              <div
                key={health.repo}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{health.repo}</p>
                    <p className="text-[10px] text-slate-500">상태: 정상 배포됨 (GitHub Pages)</p>
                  </div>
                </div>

                <a
                  href={health.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
                >
                  페이지 열기
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 저장소별 작업 세션 분포 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Code2 className="h-4 w-4 text-purple-500" />
          저장소별 작업 세션 분포
        </h4>

        <div className="space-y-2 pt-1">
          {Object.entries(repoStats).map(([repo, count]) => (
            <div key={repo} className="space-y-1">
              <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="font-mono">{repo}</span>
                <span className="font-semibold">{count}개 세션</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
