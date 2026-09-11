import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ExternalLink, CheckCircle2, Clock, AlertCircle, ArrowRight, GitPullRequest } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { JulesSession, formatRepoDisplayName } from '../services/julesApi';

/**
 * 대시보드 테이블 단일 세션 행(Row) 컴포넌트 프롭스
 */
export interface SessionCardProps {
  /** Jules 작업 세션 데이터 */
  session: JulesSession;
  /** 현재 선택된 행 여부 */
  isSelected?: boolean;
  /** 세션 선택 클릭 핸들러 */
  onSelect: (session: JulesSession) => void;
  /** 세션 플랜 1-Click 승인 이벤트 핸들러 */
  onApprovePlan: (sessionId: string, e: React.MouseEvent) => void;
}

/**
 * 고밀도 대시보드 스프레드시트 테이블의 개별 세션 데이터 행 컴포넌트
 */
export const SessionCard: React.FC<SessionCardProps> = React.memo(({
  session,
  isSelected = false,
  onSelect,
  onApprovePlan,
}) => {
  const isAwaitingApproval = session.state === 'AWAITING_APPROVAL';

  /**
   * 세션 상태별 시각적 배지 컴포넌트 생성
   */
  const getStatusBadge = () => {
    switch (session.state) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" className="px-1 py-0 text-xs gap-0.5">
            <Clock className="h-2.5 w-2.5 animate-spin text-blue-400" />
            진행
          </Badge>
        );
      case 'AWAITING_APPROVAL':
        return (
          <Badge variant="warning" className="px-1 py-0 text-xs gap-0.5">
            <AlertCircle className="h-2.5 w-2.5 text-amber-400" />
            승인대기
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" className="px-1 py-0 text-xs gap-0.5">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
            완료
          </Badge>
        );
      default:
        return <Badge variant="default" className="px-1 py-0 text-xs">{session.state}</Badge>;
    }
  };

  /**
   * date-fns 기반 ISO 일시 경과 상대 시간 변환
   */
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return '방금 전';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '방금 전';
      return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    } catch {
      return '방금 전';
    }
  };

  return (
    <>
      {/* 1st Row: Repository Name, Status, PR Badge, Updated Time, Actions */}
      <tr
        onClick={() => onSelect(session)}
        className={`transition-colors cursor-pointer text-xs font-mono hover:bg-blue-50/60 dark:hover:bg-slate-800/60 ${
          isSelected ? 'bg-blue-100/80 dark:bg-blue-950/70 font-semibold' : ''
        }`}
      >
        <td className="pt-2 pb-1 px-2 font-bold text-blue-700 dark:text-blue-300 break-all leading-tight align-middle">
          {formatRepoDisplayName(session.repository)}
        </td>
        <td className="pt-2 pb-1 px-1.5 text-center whitespace-nowrap align-middle">
          {getStatusBadge()}
        </td>
        <td className="pt-2 pb-1 px-1.5 text-center whitespace-nowrap align-middle">
          {session.prNumber ? (
            <a
              href={session.prUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 px-1.5 py-0.5 rounded text-xs font-bold hover:underline"
            >
              <GitPullRequest className="h-3 w-3" />
              PR #{session.prNumber}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          ) : (
            <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              미생성
            </span>
          )}
        </td>
        <td className="pt-2 pb-1 px-1.5 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs align-middle">
          {getRelativeTime(session.updatedAt)}
        </td>
        <td className="pt-2 pb-1 px-1.5 text-center whitespace-nowrap align-middle">
          {isAwaitingApproval ? (
            <Button
              size="sm"
              variant="primary"
              className="text-xs py-0 px-1.5 h-5 leading-none"
              onClick={(e) => onApprovePlan(session.id, e)}
            >
              승인
            </Button>
          ) : (
            <ArrowRight className="h-3 w-3 text-slate-400 inline-block" />
          )}
        </td>
      </tr>

      {/* 2nd Row: Full-width Task Summary */}
      <tr
        onClick={() => onSelect(session)}
        className={`border-b border-slate-200 dark:border-slate-800/80 transition-colors cursor-pointer text-xs hover:bg-blue-50/60 dark:hover:bg-slate-800/60 ${
          isSelected ? 'bg-blue-100/80 dark:bg-blue-950/70 font-semibold' : ''
        }`}
      >
        <td colSpan={5} className="pb-2 pt-0.5 px-2 text-slate-900 dark:text-slate-100 font-sans font-medium leading-relaxed whitespace-normal break-words">
          <div className="bg-slate-50/80 dark:bg-slate-950/50 p-1.5 rounded border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-800 dark:text-slate-200">
            {session.title || session.prompt}
          </div>
        </td>
      </tr>
    </>
  );
});

SessionCard.displayName = 'SessionCard';
