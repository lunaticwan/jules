import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] h-full p-6 text-center bg-slate-900 border border-slate-800 rounded-2xl m-4">
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-400 rounded-2xl mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-1">화면을 불러오는 중 오류가 발생했습니다</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4 font-mono leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-800 text-left overflow-x-auto">
            {this.state.error?.message || '알 수 없는 랜더링 에러'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              새로고침
            </button>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Home className="h-3.5 w-3.5" />
              목록으로 돌아가기
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
