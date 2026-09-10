/**
 * IndexedDB 오프라인 캐시 및 변경 파일 디프 스토리지 서비스
 */

const DB_NAME = 'jules_workspace_db' as const;
const DB_VERSION = 1 as const;

/**
 * 캐시된 파일 Diff 항목 인터페이스
 */
export interface CachedFileDiff {
  /** 세션 식별자 */
  sessionId: string;
  /** 파일 상대 경로 */
  filepath: string;
  /** 파일 상태 ('added' | 'modified' | 'deleted') */
  status: 'added' | 'modified' | 'deleted';
  /** 추가 라인 수 */
  additions: number;
  /** 삭제 라인 수 */
  deletions: number;
  /** Git 패치 디프 텍스트 */
  patch: string;
  /** 데이터 조회 일시 (ISO 8601) */
  fetchedAt: string;
}

/**
 * 오프라인 환경에 대기 중인 액션 데이터 구조
 */
export interface OfflineAction {
  /** 오프라인 작업 자동 증가 ID */
  id?: number;
  /** 세션 ID */
  sessionId: string;
  /** 오프라인 액션 타입 */
  type: 'APPROVE_PLAN' | 'SEND_MESSAGE' | 'CREATE_SESSION';
  /** 페이로드 데이터 */
  payload: any;
  /** 생성 일시 (ISO 8601) */
  createdAt: string;
}

let dbInstance: IDBDatabase | null = null;

/**
 * IndexedDB 사용 불가 혹은 제한 환경 시 활용하는 In-Memory 백업 저장소
 */
const inMemoryCache = {
  sessions: new Map<string, any>(),
  fileDiffs: new Map<string, CachedFileDiff>(),
  offlineQueue: [] as OfflineAction[],
};

/**
 * IndexedDB 데이터베이스 연결 및 오브젝트 스토어를 초기화함
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB 지원되지 않음'));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB 열기 실패 (인메모리 폴백 전환):', request.error);
        reject(request.error || new Error('IndexedDB 열기 실패'));
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('file_diffs')) {
          const fileDiffStore = db.createObjectStore('file_diffs', { keyPath: ['sessionId', 'filepath'] });
          fileDiffStore.createIndex('sessionId', 'sessionId', { unique: false });
        }

        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        }
      };
    } catch (err) {
      console.warn('IndexedDB 접근 시 예외 발생:', err);
      reject(err);
    }
  });
}

/**
 * 세션 캐시 목록을 IndexedDB 및 인메모리 저장소에 저장함
 */
export async function saveSessionsToDB(sessions: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    for (const session of sessions) {
      store.put(session);
      inMemoryCache.sessions.set(session.id, session);
    }
  } catch (err) {
    console.warn('IndexedDB 세션 저장 실패, 인메모리 저장소 대체:', err);
    for (const session of sessions) {
      inMemoryCache.sessions.set(session.id, session);
    }
  }
}

/**
 * IndexedDB에 저장된 전체 세션 목록을 반환함
 */
export async function getSessionsFromDB(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('sessions', 'readonly');
        const store = tx.objectStore('sessions');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve(Array.from(inMemoryCache.sessions.values()));
      } catch (err) {
        console.warn('IndexedDB 세션 트랜잭션 실패:', err);
        resolve(Array.from(inMemoryCache.sessions.values()));
      }
    });
  } catch (err) {
    console.warn('IndexedDB 세션 불러오기 실패, 인메모리 반환:', err);
    return Array.from(inMemoryCache.sessions.values());
  }
}

/**
 * 특정 세션 및 파일의 캐시된 Diff 데이터를 IndexedDB에 저장함
 */
export async function saveFileDiffToDB(diff: CachedFileDiff): Promise<void> {
  const key = `${diff.sessionId}:${diff.filepath}`;
  inMemoryCache.fileDiffs.set(key, diff);
  try {
    const db = await openDB();
    const tx = db.transaction('file_diffs', 'readwrite');
    const store = tx.objectStore('file_diffs');
    store.put(diff);
  } catch (err) {
    console.warn('IndexedDB 파일 Diff 저장 실패:', err);
  }
}

/**
 * 특정 세션 및 파일 경로에 일치하는 파일 Diff를 조회함
 */
export async function getFileDiffFromDB(sessionId: string, filepath: string): Promise<CachedFileDiff | null> {
  const key = `${sessionId}:${filepath}`;
  const memoryFound = inMemoryCache.fileDiffs.get(key);
  if (memoryFound) return memoryFound;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('file_diffs', 'readonly');
        const store = tx.objectStore('file_diffs');
        const request = store.get([sessionId, filepath]);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      } catch (err) {
        console.warn('IndexedDB 파일 Diff 트랜잭션 에러:', err);
        resolve(null);
      }
    });
  } catch (err) {
    console.warn('IndexedDB 파일 Diff 조회 실패:', err);
    return null;
  }
}

/**
 * 특정 세션에 속한 모든 캐시된 파일 Diff 목록을 반환함
 */
export async function getSessionFileDiffsFromDB(sessionId: string): Promise<CachedFileDiff[]> {
  const memoryDiffs = Array.from(inMemoryCache.fileDiffs.values()).filter((d) => d.sessionId === sessionId);

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('file_diffs', 'readonly');
        const store = tx.objectStore('file_diffs');
        const index = store.index('sessionId');
        const request = index.getAll(sessionId);
        request.onsuccess = () => resolve(request.result && request.result.length > 0 ? request.result : memoryDiffs);
        request.onerror = () => resolve(memoryDiffs);
      } catch (err) {
        console.warn('IndexedDB 세션 전체 Diff 트랜잭션 에러:', err);
        resolve(memoryDiffs);
      }
    });
  } catch (err) {
    console.warn('IndexedDB 세션 전체 Diff 조회 실패:', err);
    return memoryDiffs;
  }
}

/**
 * 오프라인 상태 시 발생한 작업을 큐에 추가함
 */
export async function enqueueOfflineAction(action: Omit<OfflineAction, 'id'>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    store.add(action);
  } catch (err) {
    console.warn('IndexedDB 오프라인 액션 저장 실패:', err);
  }
}
