/**
 * @fileoverview Login Modal - Name-basierte Benutzeranmeldung
 */

// @ts-check

import React, { useState, useRef, useEffect } from 'react';
import { useUser, validateUsername } from '../contexts/UserContext.jsx';
import './LoginModal.css';

/**
 * Login Modal Component
 * Nutzt showLoginModal State aus UserContext
 */
export default function LoginModal() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const { login, currentUser, isAuthenticated, showLoginModal, closeLogin } = useUser();

  // Fokus-Management
  useEffect(() => {
    if (showLoginModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showLoginModal]);

  /**
   * Handle Submit
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const validation = validateUsername(name);
      
      if (!validation.valid) {
        setError(validation.error || 'Ungültiger Name');
        setIsLoading(false);
        return;
      }

      login(name);
      setName('');
      // closeLogin() wird automatisch in login() aufgerufen
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
      setIsLoading(false);
    }
  };

  /**
   * Handle ESC-Key
   * @param {React.KeyboardEvent} e
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isAuthenticated && closeLogin) {
      closeLogin();
    }
  };

  if (!showLoginModal) return null;

  return (
    <div
      className="login-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && isAuthenticated && closeLogin) {
          closeLogin();
        }
      }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="login-modal">
        <div className="login-modal-header">
          <h2 id="login-modal-title">
            {currentUser ? 'Benutzer wechseln' : 'Anmelden'}
          </h2>
          {isAuthenticated && closeLogin && (
            <button
              type="button"
              className="login-modal-close"
              onClick={closeLogin}
              aria-label="Schließen"
            >
              ×
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="login-modal-form">
          <div className="login-modal-field">
            <label htmlFor="username" className="login-modal-label">
              Dein Name
            </label>
            <input
              ref={inputRef}
              id="username"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className={`login-modal-input ${error ? 'login-modal-input--error' : ''}`}
              placeholder="z.B. Robin"
              disabled={isLoading}
              autoComplete="name"
              maxLength={50}
            />
            {error && (
              <div className="login-modal-error" role="alert">
                {error}
              </div>
            )}
            <p className="login-modal-hint">
              Dein Name wird verwendet, um deine Checklisten-Antworten zu speichern.
            </p>
          </div>

          {currentUser && (
            <div className="login-modal-current">
              Aktuell angemeldet als: <strong>{currentUser}</strong>
            </div>
          )}

          <div className="login-modal-actions">
            {isAuthenticated && closeLogin && (
              <button
                type="button"
                className="login-modal-button login-modal-button--secondary"
                onClick={closeLogin}
                disabled={isLoading}
              >
                Abbrechen
              </button>
            )}
            <button
              type="submit"
              className="login-modal-button login-modal-button--primary"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Anmelden...' : currentUser ? 'Wechseln' : 'Anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
