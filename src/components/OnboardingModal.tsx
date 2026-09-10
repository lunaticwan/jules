import React, { useState, useEffect } from 'react';
import { Key, GitBranch, Save, Trash2, X, Info, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getJulesApiKey, setJulesApiKey, clearJulesApiKey, verifyJulesKey } from '../services/julesApi';
import { getGitHubToken, setGitHubToken, clearGitHubToken, verifyGitHubToken } from '../services/githubApi';

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
  const [showJulesKey, setShowJulesKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyMsg, setVerifyMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setJulesKeyInput(getJulesApiKey());
      setGithubTokenInput(getGitHubToken());
      setErrorMsg('');
      setVerifyMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setJulesApiKey(julesKey);
    setGitHubToken(githubToken);

    if (onSaveSuccess) onSaveSuccess();
    onClose();
  };

  const handleTestConnection = async () => {
    setIsVerifying(true);
    setVerifyMsg('API 연결 및 크리덴셜 실시간 검증 중...');
    setErrorMsg('');

    try {
      const results: string[] = [];
      const errors: string[] = [];

      // Jules Key 검증
      if (julesKey.trim()) {
        const julesRes = await verifyJulesKey(julesKey);
        if (julesRes.success) {
          results.push(julesRes.message);
        } else {
          errors.push(julesRes.message);
        }
      } else {
        results.push('Jules API: Key 미입력 (로컬/Mock 모드로 동작)');
      }

      // GitHub Token 검증
      if (githubToken.trim()) {
        const ghRes = await verifyGitHubToken(githubToken);
        if (ghRes.success) {
          results.push(ghRes.message);
        } else {
          errors.push(ghRes.message);
        }
      } else {
        results.push('GitHub Token: 미입력');
      }

      if (errors.length > 0) {
        setErrorMsg(errors.join(' / '));
      }
      if (results.length > 0) {
        setVerifyMsg(results.join(' | '));
      }
    } catch (err: any) {
      setErrorMsg(`검증 중 오류 발생: ${err?.message || '알 수 없는 에러'}`);
    } finally {
      setIsVerifying(false);
    }
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

          {verifyMsg && (
            <div className="rounded-lg bg-emerald-950/80 p-2.5 text-xs text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {verifyMsg}
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-400" />
                Google Jules API Key
              </span>
              <button
                type="button"
                onClick={() => setShowJulesKey(!showJulesKey)}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
              >
                {showJulesKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showJulesKey ? '숨기기' : '보기'}
              </button>
            </label>
            <Input
              type={showJulesKey ? 'text' : 'password'}
              placeholder="API 키 입력 (미입력 시 Mock 데이터 활성화)"
              value={julesKey}
              onChange={(e) => setJulesKeyInput(e.target.value)}
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <Info className="h-3 w-3 text-blue-400 shrink-0" />
              API 키 미입력 시 제한 없이 로컬 체험 모드로 작동합니다.
            </p>
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-slate-200" />
                GitHub Personal Access Token <span className="text-slate-500">(선택)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowGithubToken(!showGithubToken)}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
              >
                {showGithubToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showGithubToken ? '숨기기' : '보기'}
              </button>
            </label>
            <Input
              type={showGithubToken ? 'text' : 'password'}
              placeholder="ghp_..."
              value={githubToken}
              onChange={(e) => setGithubTokenInput(e.target.value)}
            />
            <div className="mt-2 rounded-lg bg-slate-800/80 p-2.5 text-[11px] text-slate-300 border border-slate-700 space-y-1">
              <p className="flex items-center gap-1 font-semibold text-blue-400">
                <Info className="h-3.5 w-3.5 shrink-0" />
                토큰 갱신 및 보안 안내
              </p>
              <p className="text-slate-400 leading-relaxed">
                토큰은 브라우저 보안 저장소에 전달되며 언제든지 갱신, 검증 및 즉시 삭제가 가능함.
              </p>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isVerifying}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
            >
              {isVerifying ? '검증 수행 중...' : '연결 및 크리덴셜 상태 검증'}
            </button>
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
