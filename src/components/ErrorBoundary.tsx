import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
          <div className="mb-6 h-16 w-16 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-slate-400 mb-8 max-w-md">
            The application encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all"
          >
            <RefreshCw className="h-5 w-5" />
            Reload Application
          </button>
          {this.state.error && (
            <pre className="mt-8 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 max-w-2xl overflow-auto text-left">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}
