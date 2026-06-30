import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; info: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info: info.componentStack ?? '' });
    // eslint-disable-next-line no-console
    console.error('[ARGUS ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0a0a0f', color: '#f87171',
        font: '13px/1.5 monospace', padding: 24, overflow: 'auto', zIndex: 99999,
      }}>
        <h1 style={{ color: '#fca5a5', fontSize: 16, marginBottom: 12 }}>⚠ ARGUS crashed on render</h1>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#fde68a' }}>{this.state.error.message}</pre>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#94a3b8', marginTop: 12, fontSize: 11 }}>
          {this.state.error.stack}
        </pre>
        <pre style={{ whiteSpace: 'pre-wrap', color: '#64748b', marginTop: 12, fontSize: 11 }}>
          {this.state.info}
        </pre>
      </div>
    );
  }
}
