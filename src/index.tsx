import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../index.css';
import '../phi_geometry.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; errorInfo: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
    const splash = document.getElementById('splash');
    if (splash) splash.remove();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px',
            color: 'white',
            background: 'red',
            height: '100vh',
            width: '100vw',
            fontFamily: 'sans-serif',
            fontSize: '24px',
          }}
        >
          <h1>APPLICATION CRASHED</h1>
          <p>There was a critical error rendering the application.</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: 'black',
              color: 'lightgreen',
              padding: '20px',
              fontSize: '16px',
            }}
          >
            {this.state.error?.toString()}\n\n{this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ padding: '20px', fontSize: '20px', cursor: 'pointer', marginTop: '20px' }}
          >
            CLEAR SAVED DATA & RELOAD
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
}
