import React, { useState, useCallback, useMemo } from 'react';
import { parsePatch } from 'diff';

type ParsedDiff = ReturnType<typeof parsePatch>[number];
import { ChevronRight, ChevronDown, FilePlus, FileMinus, FileCode, Loader2 } from 'lucide-react';
import { getFileDiffFromDB, saveFileDiffToDB, CachedFileDiff } from '../services/db';

export interface FileItem {
  filepath: string;
  status: 'added' | 'modified' | 'deleted';
  additions?: number;
  deletions?: number;
}

interface ChangedFilesViewProps {
  sessionId: string;
  files?: FileItem[];
}

const DEFAULT_FILES: FileItem[] = [
  { filepath: 'src/components/Navigation.tsx', status: 'modified', additions: 12, deletions: 4 },
  { filepath: 'src/styles/theme.css', status: 'modified', additions: 28, deletions: 15 },
  { filepath: 'src/hooks/useMobileDetect.ts', status: 'added', additions: 45, deletions: 0 },
  { filepath: 'src/utils/deprecatedHelper.ts', status: 'deleted', additions: 0, deletions: 32 },
];

/**
 * 개별 파일 디프 항목 컴포넌트 (React.memo 적용으로 불필요한 전체 리렌더링 방지)
 */
const FileDiffItem = React.memo<{
  file: FileItem;
  isOpen: boolean;
  isLoading: boolean;
  diffData?: CachedFileDiff;
  onToggle: (filepath: string) => void;
}>(({ file, isOpen, isLoading, diffData, onToggle }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <FilePlus className="h-4 w-4 text-emerald-500 shrink-0" />;
      case 'deleted':
        return <FileMinus className="h-4 w-4 text-rose-500 shrink-0" />;
      default:
        return <FileCode className="h-4 w-4 text-amber-500 shrink-0" />;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden transition-all">
      <button
        onClick={() => onToggle(file.filepath)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          {getStatusIcon(file.status)}
          <span className="text-xs font-medium font-mono text-slate-800 dark:text-slate-200 truncate">
            {file.filepath}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          {file.additions !== undefined && (
            <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
          )}
          {file.deletions !== undefined && (
            <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              IndexedDB / 지연 로딩 처리 중...
            </div>
          ) : diffData ? (
            <ParsedDiffView patch={diffData.patch} />
          ) : null}
        </div>
      )}
    </div>
  );
});

FileDiffItem.displayName = 'FileDiffItem';

/**
 * diff 패키지의 parsePatch 기반 헝크/라인 단위 고도화 디프 뷰어
 */
const ParsedDiffView: React.FC<{ patch: string }> = React.memo(({ patch }) => {
  const parsed = useMemo<ParsedDiff[]>(() => {
    try {
      return parsePatch(patch);
    } catch {
      return [];
    }
  }, [patch]);

  if (!parsed || parsed.length === 0 || !parsed[0]?.hunks?.length) {
    // 폴백 기본 줄 단위 파싱
    return (
      <pre className="text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre p-2 rounded bg-slate-900 text-slate-200 dark:bg-slate-900/90 border border-slate-800">
        {patch.split('\n').map((line, idx) => {
          let lineStyle = 'text-slate-300';
          if (line.startsWith('+')) lineStyle = 'text-emerald-400 bg-emerald-950/30';
          if (line.startsWith('-')) lineStyle = 'text-rose-400 bg-rose-950/30';
          if (line.startsWith('@@')) lineStyle = 'text-blue-400 font-bold';
          return (
            <div key={idx} className={`${lineStyle} px-1 rounded`}>
              {line}
            </div>
          );
        })}
      </pre>
    );
  }

  return (
    <div className="text-xs font-mono overflow-x-auto rounded bg-slate-900 text-slate-200 border border-slate-800 p-1 space-y-2">
      {parsed[0].hunks.map((hunk, hunkIdx) => {
        let oldLineNum = hunk.oldStart;
        let newLineNum = hunk.newStart;

        return (
          <div key={hunkIdx} className="space-y-0.5">
            <div className="bg-slate-800/80 text-blue-400 font-bold px-2 py-0.5 rounded text-[11px]">
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>
            {hunk.lines.map((line, lineIdx) => {
              const isAdd = line.startsWith('+');
              const isDel = line.startsWith('-');

              let displayOld = '';
              let displayNew = '';

              if (isAdd) {
                displayNew = String(newLineNum++);
              } else if (isDel) {
                displayOld = String(oldLineNum++);
              } else {
                displayOld = String(oldLineNum++);
                displayNew = String(newLineNum++);
              }

              let lineBg = 'hover:bg-slate-800/40 text-slate-300';
              if (isAdd) lineBg = 'bg-emerald-950/40 text-emerald-300';
              if (isDel) lineBg = 'bg-rose-950/40 text-rose-300';

              return (
                <div key={lineIdx} className={`flex items-start px-1 py-0.5 rounded select-none ${lineBg}`}>
                  <span className="w-8 shrink-0 text-right pr-1 text-slate-600 select-none text-[10px]">
                    {displayOld}
                  </span>
                  <span className="w-8 shrink-0 text-right pr-2 text-slate-600 select-none text-[10px]">
                    {displayNew}
                  </span>
                  <span className="flex-1 whitespace-pre break-all select-text font-mono">
                    {line}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

ParsedDiffView.displayName = 'ParsedDiffView';

export const ChangedFilesView: React.FC<ChangedFilesViewProps> = ({ sessionId, files = DEFAULT_FILES }) => {
  const [openFiles, setOpenFiles] = useState<Record<string, boolean>>({});
  const [diffDataMap, setDiffDataMap] = useState<Record<string, CachedFileDiff>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const toggleFile = useCallback(async (filepath: string) => {
    setOpenFiles((prev) => {
      const isNextOpen = !prev[filepath];
      if (isNextOpen && !diffDataMap[filepath]) {
        setLoadingMap((lPrev) => ({ ...lPrev, [filepath]: true }));

        getFileDiffFromDB(sessionId, filepath).then((cached) => {
          if (cached) {
            setDiffDataMap((dPrev) => ({ ...dPrev, [filepath]: cached }));
            setLoadingMap((lPrev) => ({ ...lPrev, [filepath]: false }));
          } else {
            setTimeout(async () => {
              const fileInfo = files.find((f) => f.filepath === filepath);
              const mockDiff: CachedFileDiff = {
                sessionId,
                filepath,
                status: fileInfo?.status || 'modified',
                additions: fileInfo?.additions || 10,
                deletions: fileInfo?.deletions || 2,
                fetchedAt: new Date().toISOString(),
                patch: generateMockPatch(filepath, fileInfo?.status || 'modified'),
              };

              await saveFileDiffToDB(mockDiff);

              setDiffDataMap((dPrev) => ({ ...dPrev, [filepath]: mockDiff }));
              setLoadingMap((lPrev) => ({ ...lPrev, [filepath]: false }));
            }, 300);
          }
        });
      }
      return { ...prev, [filepath]: isNextOpen };
    });
  }, [sessionId, files, diffDataMap]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          변경 파일 목록 ({files.length}개)
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          * 클릭하여 온디맨드로 변경사항 확인
        </span>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <FileDiffItem
            key={file.filepath}
            file={file}
            isOpen={!!openFiles[file.filepath]}
            isLoading={!!loadingMap[file.filepath]}
            diffData={diffDataMap[file.filepath]}
            onToggle={toggleFile}
          />
        ))}
      </div>
    </div>
  );
};

function generateMockPatch(filepath: string, status: string): string {
  if (status === 'added') {
    return `@@ -0,0 +1,8 @@\n+ // Newly created file: ${filepath}\n+ export const initModule = () => {\n+   console.log('Initialized ${filepath}');\n+   return true;\n+ };`;
  }
  if (status === 'deleted') {
    return `@@ -1,6 +0,0 @@\n- // Deprecated file: ${filepath}\n- export function removeMe() {\n-   return null;\n- }`;
  }
  return `@@ -12,6 +12,8 @@\n  export function updateComponent() {\n-   const oldState = false;\n+   const newState = true;\n+   // Optimized for performance & lazy loading\n    return newState;\n  }`;
}
