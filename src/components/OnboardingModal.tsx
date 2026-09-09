import React, { useState, useEffect } from 'react';
import { Key, GitBranch, Save, Trash2, X, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getJulesApiKey, setJulesApiKey, clearJulesApiKey } from '../services/julesApi';
import { getGitHubToken, setGitHubToken, clearGitHubToken } from '../services/githubApi';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
  isInitialOnboarding?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  isInitialOnboarding = false,
}) => {
  const [julesKey, setJulesKeyInput] = useState('');
  const [githubToken, setGithubTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setJulesKeyInput(getJulesApiKey());
      setGithubTokenInput(getGitHubToken());
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!julesKey.trim() && isInitialOnboarding) {
      setErrorMsg('Google Jules API 키는 필수 입력 사항입니다.');
      return;
    }

    setJulesApiKey(julesKey);
    setGitHubToken(githubToken);

    if (onSaveSuccess) onSaveSuccess();
    onClose();
  };

  const handleClearAll = () => {
    clearJulesApiKey();
    clearGitHubToken();
    setJulesKeyInput('');
    setGithubTokenInput('');
    if (onSaveSuccess) onSaveSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-100">
              {isInitialOnboarding ? '시작하기 - API 키 설정' : '설정 및 API 크리덴셜'}
            </h2>
          </div>
          {!isInitialOnboarding && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="rounded-lg bg-rose-950/80 p-3 text-xs text-rose-300 border border-rose-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Key className="h-3.5 w-3.5 text-amber-400" />
              Google Jules API Key <span className="text-rose-400">*</span>
            </label>
            <Input
              type="password"
              placeholder="API 키 입력 (미입력 시 Mock 데이터 활성화)"
              value={julesKey}
              onChange={(e) => setJulesKeyInput(e.target.value)}
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="h-3 w-3 text-blue-400 shrink-0" />
              API 키가 없더라도 체험용 샘플 세션 데이터로 테스트 가능함.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <GitBranch className="h-3.5 w-3.5 text-slate-200" />
              GitHub Personal Access Token <span className="text-slate-500">(선택)</span>
            </label>
            <Input
              type="password"
              placeholder="ghp_..."
              value={githubToken}
              onChange={(e) => setGithubTokenInput(e.target.value)}
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="h-3 w-3 text-blue-400 shrink-0" />
              GitHub PAT 입력 시 라이브 PR 상태 및 CI/CD 빌드 배지를 조회함.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            {!isInitialOnboarding && (
              <Button type="button" variant="danger" size="sm" onClick={handleClearAll}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                초기화
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              {!isInitialOnboarding && (
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  취소
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm">
                <Save className="mr-1.5 h-3.5 w-3.5" />
                저장 및 시작
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
