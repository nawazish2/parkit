import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white p-6">
            <div className="max-w-md text-center space-y-4">
              <div className="text-rose-400 text-6xl">⚠️</div>
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-slate-400 text-sm">
                An unexpected error occurred. Please refresh the page or try again later.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold"
              >
                Reload App
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
