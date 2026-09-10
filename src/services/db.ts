// IndexedDB 오프라인 캐시 및 파일 디프 스토리지 서비스

const DB_NAME = 'jules_workspace_db';
const DB_VERSION = 1;

export interface CachedFileDiff {
  sessionId: string;
  filepath: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  patch: string;
  fetchedAt: string;
}

export interface OfflineAction {
  id?: number;
  sessionId: string;
  type: 'APPROVE_PLAN' | 'SEND_MESSAGE' | 'CREATE_SESSION';
  payload: any;
  createdAt: string;
}

let dbInstance: IDBDatabase | null = null;

// IndexedDB 사용 불가 시 In-Memory Fallback Map
const inMemoryCache = {
  sessions: new Map<string, any>(),
  fileDiffs: new Map<string, CachedFileDiff>(),
  offlineQueue: [] as OfflineAction[],
};

/**
 * IndexedDB 초기화 및 데이터베이스 연결
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

        // 1. 세션 캐시 스토어
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }

        // 2. 변경 파일 Diff 캐시 스토어 (sessionId + filepath 복합 키)
        if (!db.objectStoreNames.contains('file_diffs')) {
          const fileDiffStore = db.createObjectStore('file_diffs', { keyPath: ['sessionId', 'filepath'] });
          fileDiffStore.createIndex('sessionId', 'sessionId', { unique: false });
        }

        // 3. 오프라인 작업 큐 스토어
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
 * 세션 캐시 저장 및 불러오기
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
 * 특정 세션의 파일 Diff 캐시 저장
 */
export async function saveFileDiffToDB(diff: CachedFileDiff): Promise<void> {
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
 * 특정 세션 및 파일의 캐시된 Diff 가져오기
 */
export async function getFileDiffFromDB(sessionId: string, filepath: string): Promise<CachedFileDiff | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('file_diffs', 'readonly');
      const store = tx.objectStore('file_diffs');
      const request = store.get([sessionId, filepath]);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('IndexedDB 파일 Diff 조회 실패:', err);
    return null;
  }
}

/**
 * 특정 세션의 캐시된 모든 파일 Diff 목록 가져오기
 */
export async function getSessionFileDiffsFromDB(sessionId: string): Promise<CachedFileDiff[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('file_diffs', 'readonly');
      const store = tx.objectStore('file_diffs');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('IndexedDB 세션 전체 Diff 조회 실패:', err);
    return [];
  }
}

/**
 * 오프라인 액션 큐 저장
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
