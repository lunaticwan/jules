import React from 'react';
import { ExternalLink, CheckCircle2, Clock, AlertCircle, GitPullRequest, GitBranch, Globe, ArrowRight } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { JulesSession } from '../services/julesApi';
import { getRepoLinks } from '../services/githubApi';

export interface SessionCardProps {
  session: JulesSession;
  isSelected?: boolean;
  onSelect: (session: JulesSession) => void;
  onApprovePlan: (sessionId: string, e: React.MouseEvent) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isSelected = false,
  onSelect,
  onApprovePlan,
}) => {
  const isAwaitingApproval = session.state === 'AWAITING_APPROVAL';
  const repoLinks = getRepoLinks(session.repository || 'owner/repo');

  const getStatusBadge = () => {
    switch (session.state) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" className="px-1.5 py-0.5 text-[10px] gap-1">
            <Clock className="h-3 w-3 animate-spin text-blue-400" />
            진행 중
          </Badge>
        );
      case 'AWAITING_APPROVAL':
        return (
          <Badge variant="warning" className="px-1.5 py-0.5 text-[10px] gap-1">
            <AlertCircle className="h-3 w-3 text-amber-400" />
            승인 대기
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" className="px-1.5 py-0.5 text-[10px] gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            완료됨
          </Badge>
        );
      default:
        return <Badge variant="default" className="px-1.5 py-0.5 text-[10px]">{session.state}</Badge>;
    }
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return '방금 전';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  return (
    <div
      onClick={() => onSelect(session)}
      className={`group relative flex items-center justify-between gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/50'
          : isAwaitingApproval
          ? 'bg-amber-950/15 border-amber-800/70 hover:border-amber-500/80'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850'
      }`}
    >
      {/* Left Column: Repository info & Session Title */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {/* full repository name with dark/light styling, break-all / no truncate restriction */}
          <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/90 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/70 text-[11px] shrink-0 break-all">
            {session.repository}
          </span>
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
            ({session.baseBranch || 'main'})
          </span>

          <div className="inline-flex items-center gap-1 text-slate-400 ml-0.5" onClick={(e) => e.stopPropagation()}>
            <a
              href={repoLinks.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-200 transition-colors p-0.5"
              title="GitHub 레포지토리"
            >
              <GitBranch className="h-3 w-3" />
            </a>
            <a
              href={repoLinks.pagesUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-500 hover:text-emerald-400 transition-colors p-0.5"
              title="배포 페이지"
            >
              <Globe className="h-3 w-3" />
            </a>
          </div>
        </div>

        <h3 className="text-[12px] font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
          {session.title || session.prompt}
        </h3>

        <div className="flex items-center gap-2.5 text-[10px] text-slate-500 dark:text-slate-400">
          <span>{getRelativeTime(session.updatedAt)}</span>
          {session.prNumber && (
            <a
              href={session.prUrl || repoLinks.repoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 hover:underline font-mono"
            >
              <GitPullRequest className="h-3 w-3" />
              PR #{session.prNumber}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Right Column: Status & Direct Action Button */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        <div>{getStatusBadge()}</div>

        {isAwaitingApproval ? (
          <Button
            size="sm"
            variant="primary"
            className="text-[10px] py-0.5 px-2 h-6"
            onClick={(e) => onApprovePlan(session.id, e)}
          >
            승인
          </Button>
        ) : (
          <div className="text-slate-400 dark:text-slate-500 group-hover:text-slate-200 p-0.5">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};
