import React, { useEffect } from 'react';
import { Command, X } from 'lucide-react';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: '/', description: '태스크 및 저장소 검색 입력창 포커스' },
  { key: 'N', description: '새 Jules 태스크 작성 창 열기' },
  { key: 'R', description: '세션 목록 및 연동 데이터 새로고침' },
  { key: 'Shift + ?', description: '키보드 단축키 안내 창 열기 / 닫기' },
  { key: 'Esc', description: '모달 / 상세 화면 닫기 및 목록으로 이동' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Command className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-100">키보드 단축키 안내</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg bg-slate-800/60 p-2 text-xs border border-slate-700/60"
            >
              <span className="text-slate-300 font-medium">{item.description}</span>
              <kbd className="rounded bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-blue-400 border border-slate-700 shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
