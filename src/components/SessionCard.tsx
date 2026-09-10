import React from 'react';
import { ExternalLink, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { JulesSession } from '../services/julesApi';

export interface SessionCardProps {
  session: JulesSession;
  isSelected?: boolean;
  onSelect: (session: JulesSession) => void;
  onApprovePlan: (sessionId: string, e: React.MouseEvent) => void;
}

export const SessionCard: React.FC<SessionCardProps> = React.memo(({
  session,
  isSelected = false,
  onSelect,
  onApprovePlan,
}) => {
  const isAwaitingApproval = session.state === 'AWAITING_APPROVAL';

  const getStatusBadge = () => {
    switch (session.state) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="info" className="px-1 py-0 text-[9px] gap-0.5">
            <Clock className="h-2.5 w-2.5 animate-spin text-blue-400" />
            진행
          </Badge>
        );
      case 'AWAITING_APPROVAL':
        return (
          <Badge variant="warning" className="px-1 py-0 text-[9px] gap-0.5">
            <AlertCircle className="h-2.5 w-2.5 text-amber-400" />
            승인대기
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="success" className="px-1 py-0 text-[9px] gap-0.5">
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
            완료
          </Badge>
        );
      default:
        return <Badge variant="default" className="px-1 py-0 text-[9px]">{session.state}</Badge>;
    }
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return '방금';
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <tr
      onClick={() => onSelect(session)}
      className={`border-b border-slate-200 dark:border-slate-800/60 transition-colors cursor-pointer text-[11px] font-mono hover:bg-blue-50/60 dark:hover:bg-slate-800/60 ${
        isSelected ? 'bg-blue-100/80 dark:bg-blue-950/70 font-semibold' : ''
      }`}
    >
      <td className="py-1.5 px-1.5 font-bold text-blue-700 dark:text-blue-300 break-all leading-tight">
        {session.repository}
      </td>
      <td className="py-1.5 px-1 text-slate-500 dark:text-slate-400 shrink-0 text-[10px]">
        {session.baseBranch || 'main'}
      </td>
      <td className="py-1.5 px-1.5 text-slate-900 dark:text-slate-100 font-sans font-medium line-clamp-1 leading-snug">
        {session.title || session.prompt}
      </td>
      <td className="py-1.5 px-1 text-center whitespace-nowrap">
        {getStatusBadge()}
      </td>
      <td className="py-1.5 px-1 text-center whitespace-nowrap">
        {session.prNumber ? (
          <a
            href={session.prUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 text-purple-600 dark:text-purple-400 font-semibold hover:underline"
          >
            #{session.prNumber}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : (
          <span className="text-slate-400 dark:text-slate-600">-</span>
        )}
      </td>
      <td className="py-1.5 px-1 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap text-[10px]">
        {getRelativeTime(session.updatedAt)}
      </td>
      <td className="py-1.5 px-1 text-center whitespace-nowrap">
        {isAwaitingApproval ? (
          <Button
            size="sm"
            variant="primary"
            className="text-[9px] py-0 px-1.5 h-5 leading-none"
            onClick={(e) => onApprovePlan(session.id, e)}
          >
            승인
          </Button>
        ) : (
          <ArrowRight className="h-3 w-3 text-slate-400 inline-block" />
        )}
      </td>
    </tr>
  );
});

SessionCard.displayName = 'SessionCard';
