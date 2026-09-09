import React, { useState } from 'react';
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

// 기본 샘플 변경 파일 목록 (API 연동 또는 세션 mock 데이터용)
const DEFAULT_FILES: FileItem[] = [
  { filepath: 'src/components/Navigation.tsx', status: 'modified', additions: 12, deletions: 4 },
  { filepath: 'src/styles/theme.css', status: 'modified', additions: 28, deletions: 15 },
  { filepath: 'src/hooks/useMobileDetect.ts', status: 'added', additions: 45, deletions: 0 },
  { filepath: 'src/utils/deprecatedHelper.ts', status: 'deleted', additions: 0, deletions: 32 },
];

/**
 * 온디맨드 로딩 및 접힘(Collapsed) 기반의 변경 파일 디프 컴포넌트
 */
export const ChangedFilesView: React.FC<ChangedFilesViewProps> = ({ sessionId, files = DEFAULT_FILES }) => {
  const [openFiles, setOpenFiles] = useState<Record<string, boolean>>({});
  const [diffDataMap, setDiffDataMap] = useState<Record<string, CachedFileDiff>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const toggleFile = async (filepath: string) => {
    const isNextOpen = !openFiles[filepath];
    setOpenFiles((prev) => ({ ...prev, [filepath]: isNextOpen }));

    // 개별 파일이 펼쳐질 때만 온디맨드(On-Demand) 디프 로딩 및 캐싱
    if (isNextOpen && !diffDataMap[filepath]) {
      setLoadingMap((prev) => ({ ...prev, [filepath]: true }));

      // 1. IndexedDB 캐시 조회
      const cached = await getFileDiffFromDB(sessionId, filepath);
      if (cached) {
        setDiffDataMap((prev) => ({ ...prev, [filepath]: cached }));
        setLoadingMap((prev) => ({ ...prev, [filepath]: false }));
        return;
      }

      // 2. 캐시 미스 시 지연 시뮬레이션 및 데이터 생성 (실제 API/Mock 처리)
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

        // IndexedDB 캐시에 저장
        await saveFileDiffToDB(mockDiff);

        setDiffDataMap((prev) => ({ ...prev, [filepath]: mockDiff }));
        setLoadingMap((prev) => ({ ...prev, [filepath]: false }));
      }, 300);
    }
  };

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
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          변경 파일 목록 ({files.length}개)
        </h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          * 클릭하여 온디맨드로 변경사항 확인
        </span>
      </div>

      <div className="space-y-2">
        {files.map((file) => {
          const isOpen = !!openFiles[file.filepath];
          const isLoading = !!loadingMap[file.filepath];
          const diffData = diffDataMap[file.filepath];

          return (
            <div
              key={file.filepath}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden transition-all"
            >
              {/* 파일 헤더 - 항상 노출 (접힘 상태 기본) */}
              <button
                onClick={() => toggleFile(file.filepath)}
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

                <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                  {file.additions !== undefined && (
                    <span className="text-emerald-600 dark:text-emerald-400">+{file.additions}</span>
                  )}
                  {file.deletions !== undefined && (
                    <span className="text-rose-600 dark:text-rose-400">-{file.deletions}</span>
                  )}
                </div>
              </button>

              {/* 펼쳐졌을 때만 온디맨드 로딩 / 디프 뷰어 표시 */}
              {isOpen && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6 text-slate-400 gap-2 text-xs">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      IndexedDB / 지연 로딩 처리 중...
                    </div>
                  ) : diffData ? (
                    <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre p-2 rounded bg-slate-900 text-slate-200 dark:bg-slate-900/90 border border-slate-800">
                      {diffData.patch.split('\n').map((line, idx) => {
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
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
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
