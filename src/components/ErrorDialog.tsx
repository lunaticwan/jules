import React from 'react';
import { AlertTriangle, X, RefreshCw, Key } from 'lucide-react';
import { Button } from './ui/Button';

export interface ErrorDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  details?: string;
  onClose: () => void;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}

/**
 * API 및 시스템 네트워크 장애 알림 다이얼로그
 */
export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  isOpen,
  title = 'API 통신 또는 요청 처리 오류 발생',
  message,
  details,
  onClose,
  onRetry,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-rose-900/60 bg-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950 text-rose-500 border border-rose-800/80 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 leading-tight">{title}</h2>
              <p className="text-xs text-rose-400 font-mono mt-0.5">API / Network Connection Error</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl bg-rose-950/40 border border-rose-900/50 p-3 text-xs text-rose-200 leading-relaxed font-medium">
            {message}
          </div>

          {details && (
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs font-mono text-slate-400 overflow-x-auto max-h-32">
              <pre className="whitespace-pre-wrap break-all">{details}</pre>
            </div>
          )}

          <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 text-xs text-slate-300 space-y-1 leading-relaxed">
            <p className="font-bold text-blue-400">조치 가이드:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>Google Jules API 키 및 GitHub 토큰의 유효성을 설정에서 재확인하십시오.</li>
              <li>네트워크 상태나 CORS 차단 여부를 확인하거나, 키를 삭제하여 로컬 모드로 전환하십시오.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          {onOpenSettings && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              <Key className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              API 키 설정
            </Button>
          )}

          {onRetry && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onRetry();
              }}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              재시도
            </Button>
          )}

          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
};
