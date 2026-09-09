import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Send, CheckCircle2, Bot, User, Check, GitPullRequest, FileText, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ScrollArea } from './ui/ScrollArea';
import { ChangedFilesView } from './ChangedFilesView';
import { JulesSession, approveJulesPlan, sendJulesMessage } from '../services/julesApi';

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
  isSplitView = false,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'files'>('timeline');
  const [inputMsg, setInputMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAwaitingApproval = session.state === 'AWAITING_APPROVAL';

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
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 py-3 backdrop-blur-md safe-pt shrink-0">
        <div className="flex items-center gap-3">
          {!isSplitView && (
            <button
              onClick={onBack}
              className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
              {session.title || session.prompt}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {session.repository} ({session.baseBranch})
            </p>
          </div>
        </div>

        {session.prUrl && (
          <a
            href={session.prUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-lg bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-800 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300"
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            PR #{session.prNumber}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </header>

      {/* Detail Tab Navigation (타임라인 / 독립 분리된 변경 파일 보기) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-1.5 shrink-0 gap-2">
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
            {session.plan && session.plan.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 p-3.5 space-y-2 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  실행 플랜 단계
                </h3>
                <div className="space-y-2 pt-1">
                  {session.plan.map((step) => (
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
              {session.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
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
              })}
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
