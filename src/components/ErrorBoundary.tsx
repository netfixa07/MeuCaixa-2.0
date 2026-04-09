import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Ops! Algo deu errado.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
            </p>
            
            {this.state.error && (
              <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left overflow-auto max-h-40">
                <code className="text-xs text-rose-500 font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
