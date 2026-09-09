import { useState, useEffect } from 'react';

// 모바일 PWA 메인 애플리케이션 컴포넌트
export default function App() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="mobile-container">
      <header className="app-header">
        <h1>모바일 PWA</h1>
        <span className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '온라인' : '오프라인'}
        </span>
      </header>
      <main className="app-content">
        <section className="card">
          <h2>기본 설정 완료</h2>
          <p>React 18 + Vite + TypeScript 기반의 클라이언트 온리 PWA 환경 구축 완료.</p>
        </section>
      </main>
    </div>
  );
}
