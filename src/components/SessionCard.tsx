import React from 'react';
import { ExternalLink, CheckCircle2, Clock, AlertCircle, GitPullRequest, GitBranch, Globe } from 'lucide-react';
import { Card } from './ui/Card';
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
  const repoLinks = getRepoLinks(session.repository);

  const getStatusBadge = () => {
    switch (session.state) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="info">
            <Clock className="h-3 w-3 animate-spin" />
            진행 중
          </Badge>
        );
      case 'AWAITING_APPROVAL':
        return (
          <Badge variant="warning">
            <AlertCircle className="h-3 w-3" />
            승인 대기
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            완료됨
          </Badge>
        );
      default:
        return <Badge variant="default">{session.state}</Badge>;
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  return (
    <Card
      highlighted={isAwaitingApproval}
      onClick={() => onSelect(session)}
      className={`cursor-pointer active:scale-[0.99] transition-all space-y-3 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-950/20' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/80 inline-flex items-center gap-1">
              {session.repository}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">({session.baseBranch})</span>

            {/* 바로가기 링크 버튼군 */}
            <div className="inline-flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
              <a
                href={repoLinks.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="GitHub 레포지토리 바로가기"
              >
                <GitBranch className="h-3.5 w-3.5" />
              </a>
              <a
                href={repoLinks.pagesUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                title="배포 웹사이트 바로가기"
              >
                <Globe className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-slate-100 line-clamp-2">
            {session.title || session.prompt}
          </h3>
        </div>
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2 bg-slate-900/50 p-2 rounded border border-slate-800">
        {session.prompt}
      </p>

      {session.prNumber && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-slate-300">
            <GitPullRequest className="h-3.5 w-3.5 text-purple-400" />
            <span>PR #{session.prNumber}</span>
          </div>
          {session.prUrl && (
            <a
              href={session.prUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
            >
              GitHub에서 보기
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500">
          업데이트: {getRelativeTime(session.updatedAt)}
        </span>

        {isAwaitingApproval ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(session);
              }}
            >
              리뷰
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={(e) => onApprovePlan(session.id, e)}
            >
              플랜 승인
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(session);
            }}
          >
            상세보기 →
          </Button>
        )}
      </div>
    </Card>
  );
};
