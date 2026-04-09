import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export const ErrorBoundary = ({ children }: ErrorBoundaryProps) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const message = event instanceof ErrorEvent ? event.message : (event.reason?.message || String(event.reason));
      try {
        const parsed = JSON.parse(message);
        if (parsed.error) {
          setHasError(true);
          setErrorMessage(parsed.error);
        }
      } catch (e) {
        // Not a JSON error
      }
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    const isOfflineError = errorMessage.includes("não parece estar ativado");
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-blue-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-blue-600 mb-6">{errorMessage || "Ocorreu um erro inesperado no sistema."}</p>
          
          {isOfflineError && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-left">
              <p className="text-xs text-amber-800 font-medium mb-2">Como resolver:</p>
              <ol className="text-[10px] text-amber-700 space-y-1 list-decimal pl-4">
                <li>Acesse o Console do Firebase do seu projeto.</li>
                <li>Vá em <b>Firestore Database</b>.</li>
                <li>Clique em <b>Criar Banco de Dados</b>.</li>
                <li>Escolha o modo de teste e a região.</li>
                <li>Após criar, recarregue esta página.</li>
              </ol>
            </div>
          )}

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Recarregar Aplicativo
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
