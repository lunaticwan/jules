import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { createJulesSession, JulesSession } from '../services/julesApi';

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

export const NewTaskSheet: React.FC<NewTaskSheetProps> = ({
  isOpen,
  onClose,
  onSessionCreated,
  existingRepos,
}) => {
  const [repository, setRepository] = useState(existingRepos[0] || 'acme/mobile-pwa');
  const [baseBranch, setBaseBranch] = useState('main');
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repository.trim() || !prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newSession = await createJulesSession({
        repository: repository.trim(),
        baseBranch: baseBranch.trim() || 'main',
        prompt: prompt.trim(),
      });
      onSessionCreated(newSession);
      setPrompt('');
      onClose();
    } catch (err) {
      console.error('태스크 생성 실패:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (template: string) => {
    setPrompt(template);
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="새 Jules 태스크 요청">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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
                    {r}
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
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
              <Sparkles className="h-3 w-3" /> 빠른 프롬프트 템플릿
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {PRESET_TEMPLATES.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.template)}
                className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px] resize-none"
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
