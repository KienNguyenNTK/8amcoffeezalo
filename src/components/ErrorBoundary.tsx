import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gray-50 text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
            ☕
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đã có sự cố xảy ra</h2>
          <p className="text-gray-600 text-sm mb-6 max-w-xs">
            Hệ thống đang được làm mới để mang lại trải nghiệm tốt nhất. Vui lòng tải lại trang.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-[#8B4513] text-white rounded-lg font-medium text-sm shadow hover:bg-[#6e350d] transition"
            >
              Tải lại trang
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition"
            >
              Trang chủ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
