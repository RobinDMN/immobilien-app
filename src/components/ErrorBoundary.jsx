import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Fehler abgefangen:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>
            ⚠️ Etwas ist schiefgelaufen
          </h1>
          <p style={{ color: '#7f8c8d', marginBottom: '1.5rem' }}>
            Die Anwendung ist auf einen Fehler gestoßen.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              textAlign: 'left', 
              backgroundColor: '#f8f9fa', 
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              border: '1px solid #e0e0e0'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Fehlerdetails (Dev Mode)
              </summary>
              <pre style={{ 
                fontSize: '0.85rem', 
                overflow: 'auto',
                color: '#e74c3c'
              }}>
                {this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <pre style={{ 
                  fontSize: '0.75rem', 
                  overflow: 'auto',
                  marginTop: '0.5rem',
                  color: '#95a5a6'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🔄 Seite neu laden
            </button>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#95a5a6',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '1rem'
              }}
            >
              🏠 Zur Startseite
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
