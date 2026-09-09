import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Send, CheckCircle2, Bot, User, Check, GitPullRequest, FileText, MessageSquare, GitBranch, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ScrollArea } from './ui/ScrollArea';
import { ChangedFilesView } from './ChangedFilesView';
import { JulesSession, approveJulesPlan, sendJulesMessage } from '../services/julesApi';
import { getRepoLinks } from '../services/githubApi';

export interface TaskDetailViewProps {
  session: JulesSession;
  onBack: () => void;
  onUpdateSession: (updated: JulesSession) => void;
  isSplitView?: boolean;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  session,
  onBack,
  onUpdateSession,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'files'>('timeline');
  const [inputMsg, setInputMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESC 키 눌렀을 때 세션 상세 닫기/뒤로가기
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400">
        <p className="text-sm">선택된 세션 정보를 찾을 수 없습니다.</p>
        <button onClick={onBack} className="mt-3 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const isAwaitingApproval = session.state === 'AWAITING_APPROVAL';
  const repoLinks = getRepoLinks(session.repository || 'owner/repo');
  const messages = Array.isArray(session.messages) ? session.messages : [];
  const planSteps = Array.isArray(session.plan) ? session.plan : [];

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const updated = await approveJulesPlan(session.id);
      onUpdateSession(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const updated = await sendJulesMessage(session.id, inputMsg.trim());
      onUpdateSession(updated);
      setInputMsg('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-3 py-2 backdrop-blur-md safe-pt shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="목록으로 돌아가기 (ESC)"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>닫기</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/90 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/70 text-[11px] shrink-0 break-all">
                {session.repository}
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                ({session.baseBranch || 'main'})
              </span>
              <div className="inline-flex items-center gap-1 text-slate-400">
                <a
                  href={repoLinks.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  title="GitHub 바로가기"
                >
                  <GitBranch className="h-3 w-3" />
                </a>
                <a
                  href={repoLinks.pagesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                  title="배포 페이지 바로가기"
                >
                  <Globe className="h-3 w-3" />
                </a>
              </div>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mt-0.5">
              {session.title || session.prompt || 'Untitled Session'}
            </h2>
          </div>
        </div>

        {session.prUrl && (
          <a
            href={session.prUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300 shrink-0 ml-2"
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            PR #{session.prNumber}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </header>

      {/* Detail Tab Navigation (타임라인 / 독립 분리된 변경 파일 보기) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 shrink-0 gap-1.5">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'timeline'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          타임라인 & 플랜
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'files'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          변경 파일 보기 (온디맨드)
        </button>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {activeTab === 'timeline' ? (
          <>
            {/* Task Plan Steps */}
            {planSteps.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-3.5 space-y-2 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  실행 플랜 단계
                </h3>
                <div className="space-y-2 pt-1">
                  {planSteps.map((step) => (
                    <div
                      key={step.index}
                      className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-800"
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : step.status === 'in_progress' ? (
                        <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0 mx-1" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0 mx-1" />
                      )}
                      <span className={step.status === 'completed' ? 'line-through text-slate-400' : ''}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Messages */}
            <div className="space-y-3 pt-2">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  타임라인 메시지가 없습니다.
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id || `msg-${Math.random()}`}
                      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isUser ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                        }`}
                      >
                        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                      </div>

                      <div
                        className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : msg.type === 'thought'
                            ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 rounded-tl-none italic'
                            : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.type === 'thought' && (
                          <div className="mb-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider not-italic">
                            Thought Process
                          </div>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* 독립 분리된 온디맨드 변경 파일 컴포넌트 */
          <ChangedFilesView sessionId={session.id} />
        )}
      </ScrollArea>

      {/* Fixed Bottom Action Bar */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 backdrop-blur-md safe-pb shrink-0 space-y-2">
        {isAwaitingApproval && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-xl mb-2">
            <span className="text-xs text-amber-800 dark:text-amber-300 flex-1 font-medium">
              Jules가 생성한 플랜이 검토 승인을 대기 중입니다.
            </span>
            <Button
              size="sm"
              variant="primary"
              disabled={isSubmitting}
              onClick={handleApprove}
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              승인하기
            </Button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder={isAwaitingApproval ? '피드백 / 수정 요청사항 입력...' : '메시지 입력...'}
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            disabled={isSubmitting}
          />
          <Button type="submit" size="md" variant="primary" disabled={isSubmitting || !inputMsg.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
};
