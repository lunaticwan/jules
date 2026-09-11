import React, { useState } from 'react';
import { Sparkles, Send, Layers } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { JulesSession, formatRepoDisplayName } from '../services/julesApi';
import { useCreateJulesSessionMutation } from '../hooks/useJulesQueries';

export interface NewTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: (newSession: JulesSession) => void;
  existingRepos: string[];
}

const PRESET_TEMPLATES = [
  { label: 'Fix Bug 🐛', template: '버그 수정 요청: 모바일 뷰포트 영역에서 하단 레이아웃 패딩이 깨지는 문제 해결' },
  { label: 'Refactor Code ♻️', template: '코드 리팩토링: 상태 관리 로직을 커스텀 훅으로 분리하고 타입 정의 개선' },
  { label: 'Add Unit Tests 🧪', template: '단위 테스트 추가: API 연동 서비스 모듈에 대한 Jest/Vitest 테스트 케이스 구현' },
  { label: 'PWA Optimization 📱', template: 'PWA 최적화: 서비스 워커 오프라인 캐싱 전략 추가 및 아이콘 배지 설정' },
];

const LLM_STRUCTURED_TEMPLATES = [
  {
    label: 'LLM Agent 구조화 프롬프트 🤖',
    template: `[역할]: Expert Frontend & PWA Software Engineer
[목표]: React 및 TypeScript 기반 컴포넌트 렌더링 성능 최적화 및 예외 처리 강화
[제약조건]:
- 100% 한국어 주석 및 명사형 어미 사용 (~함, ~기, ~필수)
- 기존 API 및 인터페이스 하위 호환성 유지
[작업 범위]: src/components 및 src/hooks 내부 최적화`,
  },
  {
    label: 'TSDoc & 타입 안전성 📘',
    template: `[역할]: TypeScript Type Safety Auditor
[목표]: 모든 외부 연동 모듈 및 서비스 함수에 엄격한 TSDoc 주석 작성 및 any 타입 제거
[제약조건]: 존댓말 배제 및 개조식 단정형 작성
[작업 범위]: src/services/ 및 src/hooks/`,
  },
];

export const NewTaskSheet: React.FC<NewTaskSheetProps> = ({
  isOpen,
  onClose,
  onSessionCreated,
  existingRepos,
}) => {
  const [repository, setRepository] = useState(existingRepos[0] || 'acme/mobile-pwa');
  const [baseBranch, setBaseBranch] = useState('main');
  const [prompt, setPrompt] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const createSessionMutation = useCreateJulesSessionMutation();
  const isSubmitting = createSessionMutation.isPending;

  const repoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedRepo = repository.trim();
    const trimmedPrompt = prompt.trim();

    if (!trimmedRepo) {
      setValidationError('레포지토리 이름을 입력하십시오.');
      return;
    }

    if (!repoRegex.test(trimmedRepo)) {
      setValidationError('올바른 저장소 형식이 아닙니다 (예: owner/repository)');
      return;
    }

    if (!trimmedPrompt) {
      setValidationError('작업 프롬프트 내용을 입력하십시오.');
      return;
    }

    if (isSubmitting) return;

    try {
      const newSession = await createSessionMutation.mutateAsync({
        repository: trimmedRepo,
        baseBranch: baseBranch.trim() || 'main',
        prompt: trimmedPrompt,
      });
      onSessionCreated(newSession);
      setPrompt('');
      onClose();
    } catch (err: any) {
      setValidationError(`태스크 생성 실패: ${err?.message || '알 수 없는 오류 발생'}`);
    }
  };

  const handleApplyPreset = (template: string) => {
    setPrompt(template);
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="새 Jules 태스크 요청">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {validationError && (
          <div className="rounded-lg bg-rose-950/80 p-2.5 text-xs text-rose-300 border border-rose-800/80 flex items-center justify-between">
            <span>{validationError}</span>
            <button type="button" onClick={() => setValidationError(null)} className="text-xs font-bold hover:underline">
              ✕
            </button>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">
            저장소 (Repository)
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="owner/repo"
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              required
            />
            {existingRepos.length > 0 && (
              <select
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 text-xs text-slate-300 focus:outline-none"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
              >
                {existingRepos.map((r) => (
                  <option key={r} value={r}>
                    {formatRepoDisplayName(r)} ({r})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">
            기준 브랜치 (Base Branch)
          </label>
          <Input
            placeholder="main"
            value={baseBranch}
            onChange={(e) => setBaseBranch(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">
              작업 프롬프트 (Prompt)
            </label>
            <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
              <Sparkles className="h-3 w-3" /> 빠른 프롬프트 템플릿
            </span>
          </div>

          {/* 일반 프롬프트 템플릿 */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PRESET_TEMPLATES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.template)}
                className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* LLM 구조화 프롬프트 템플릿 (Agent 개발 친화) */}
          <div className="space-y-1 mb-2">
            <p className="text-xs font-bold text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
              <Layers className="h-3 w-3" /> LLM Agent 구조화 프롬프트
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LLM_STRUCTURED_TEMPLATES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset.template)}
                  className="rounded-lg bg-indigo-950/70 border border-indigo-800/80 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-900 hover:text-white transition-colors text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[120px] resize-none leading-relaxed"
            placeholder="Jules에게 지시할 구체적인 작업 내용을 작성하세요..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            disabled={isSubmitting || !repository.trim() || !prompt.trim()}
          >
            {isSubmitting ? (
              '태스크 생성 중...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Jules 작업 시작 요청
              </>
            )}
          </Button>
        </div>
      </form>
    </Sheet>
  );
};
