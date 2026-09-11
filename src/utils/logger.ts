import { QueryClient } from '@tanstack/react-query';

/**
 * 타임스탬프 기반 로그 접두사 생성
 */
export function getLogTimestamp(): string {
  return new Date().toISOString();
}

/**
 * DOM 요소 정보를 가독성 높은 객체 및 문자열로 요약 추출함
 */
export function summarizeElement(target: EventTarget | null): Record<string, any> {
  if (!(target instanceof HTMLElement)) {
    return { tag: String(target) };
  }

  const el = target;
  const tag = el.tagName.toUpperCase();
  const id = el.id ? `#${el.id}` : '';
  const classes = el.className && typeof el.className === 'string'
    ? `.${el.className.trim().split(/\s+/).join('.')}`
    : '';

  const text = (el.innerText || el.textContent || '').trim().slice(0, 60);
  const type = el.getAttribute('type') || undefined;
  const role = el.getAttribute('role') || undefined;
  const ariaLabel = el.getAttribute('aria-label') || undefined;
  const name = el.getAttribute('name') || undefined;
  const value = (el as HTMLInputElement).value;
  const maskedValue = type === 'password' ? '********' : value;

  return {
    selector: `${tag}${id}${classes}`,
    tag,
    id: el.id || undefined,
    className: el.className || undefined,
    text: text || undefined,
    type,
    role,
    ariaLabel,
    name,
    value: value !== undefined ? maskedValue : undefined,
  };
}

let isGlobalLoggerInitialized = false;

/**
 * 전역 UI 행동(클릭, 입력, 키보드, 라우팅, 예외) 수집 리스너를 초기화함
 */
export function initGlobalLogger(): void {
  if (isGlobalLoggerInitialized) return;
  isGlobalLoggerInitialized = true;

  console.log(`[${getLogTimestamp()}][LOGGER_INIT] 전역 로거 이벤트 수집 시작됨`);

  // 1. 클릭 이벤트 (Click)
  window.addEventListener(
    'click',
    (e: MouseEvent) => {
      const summary = summarizeElement(e.target);
      console.log(`[${getLogTimestamp()}][UI_CLICK]`, {
        ...summary,
        x: e.clientX,
        y: e.clientY,
        target: e.target,
      });
    },
    true
  );

  // 2. 입력 변경 이벤트 (Input/Change)
  window.addEventListener(
    'change',
    (e: Event) => {
      const summary = summarizeElement(e.target);
      console.log(`[${getLogTimestamp()}][UI_CHANGE]`, {
        ...summary,
        target: e.target,
      });
    },
    true
  );

  // 3. 폼 제출 이벤트 (Submit)
  window.addEventListener(
    'submit',
    (e: Event) => {
      const summary = summarizeElement(e.target);
      console.log(`[${getLogTimestamp()}][UI_SUBMIT]`, {
        ...summary,
        target: e.target,
      });
    },
    true
  );

  // 4. 키보드 눌림 이벤트 (Keydown)
  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      // 일반 단일 입력 키 or 주요 제어키(Enter, Escape, /, N, R, Shift+?) 로깅
      const summary = summarizeElement(e.target);
      console.log(`[${getLogTimestamp()}][UI_KEYDOWN]`, {
        key: e.key,
        code: e.code,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        activeElement: summary.selector,
      });
    },
    true
  );

  // 5. 브라우저 히스토리 및 라우팅 이벤트 (PopState / HashChange)
  window.addEventListener('popstate', () => {
    console.log(`[${getLogTimestamp()}][UI_NAV] [POPSTATE]`, {
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
    });
  });

  window.addEventListener('hashchange', () => {
    console.log(`[${getLogTimestamp()}][UI_NAV] [HASHCHANGE]`, {
      hash: window.location.hash,
      href: window.location.href,
    });
  });

  // history.pushState 내포 감시
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    originalPushState.apply(this, args);
    console.log(`[${getLogTimestamp()}][UI_NAV] [PUSHSTATE]`, {
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
    });
  };

  // 6. 전역 미처리 예외 감시 (Error & UnhandledRejection)
  window.addEventListener('error', (event: ErrorEvent) => {
    console.error(`[${getLogTimestamp()}][UNCAUGHT_ERROR]`, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    console.error(`[${getLogTimestamp()}][UNHANDLED_REJECTION]`, {
      reason: event.reason,
    });
  });
}

/**
 * React Query 캐시(QueryCache, MutationCache) 통신 및 상태 변화를 로깅함
 */
export function setupReactQueryLogger(queryClient: QueryClient): void {
  const queryCache = queryClient.getQueryCache();
  const mutationCache = queryClient.getMutationCache();

  queryCache.subscribe((event) => {
    if (!event || !event.query) return;
    const key = JSON.stringify(event.query.queryKey);
    const status = event.query.state.status;

    if (event.type === 'updated') {
      console.log(`[${getLogTimestamp()}][QUERY_UPDATED] Key: ${key} Status: ${status}`, {
        data: event.query.state.data,
        error: event.query.state.error,
        dataUpdatedAt: new Date(event.query.state.dataUpdatedAt).toISOString(),
      });
    } else if (event.type === 'added') {
      console.log(`[${getLogTimestamp()}][QUERY_ADDED] Key: ${key}`);
    } else if (event.type === 'removed') {
      console.log(`[${getLogTimestamp()}][QUERY_REMOVED] Key: ${key}`);
    }
  });

  mutationCache.subscribe((event) => {
    if (!event || !event.mutation) return;
    const mutation = event.mutation;
    const optionsKey = (mutation as any).options?.mutationKey;
    const key = optionsKey ? JSON.stringify(optionsKey) : 'anonymous';

    if (event.type === 'updated') {
      const state = mutation.state;
      console.log(`[${getLogTimestamp()}][MUTATION_UPDATED] Key: ${key} Status: ${state.status}`, {
        variables: state.variables,
        data: state.data,
        error: state.error,
      });
    } else if (event.type === 'added') {
      console.log(`[${getLogTimestamp()}][MUTATION_ADDED] Key: ${key}`, {
        variables: mutation.state.variables,
      });
    }
  });
}
