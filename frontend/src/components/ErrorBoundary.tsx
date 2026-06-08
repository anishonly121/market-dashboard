import { Component, ErrorInfo, ReactNode } from "react";

interface Props  { children: ReactNode; fallback?: ReactNode }
interface State  { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="card border-red/30 bg-red/5 text-center py-12">
          <p className="text-red text-lg font-semibold mb-2">Something went wrong</p>
          <p className="text-muted text-sm mb-4">{this.state.message}</p>
          <button
            className="btn-ghost text-sm"
            onClick={() => this.setState({ hasError: false, message: "" })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
