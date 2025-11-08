/**
 * @fileoverview Login Modal - Profil-Auswahl für feste Benutzer
 */

// @ts-check

import React, { useRef, useEffect } from 'react';
import { useUser, USER_PROFILES } from '../contexts/UserContext.jsx';
import './LoginModal.css';

/**
 * Login Modal Component
 * Zeigt Profil-Auswahl für feste Benutzer
 */
export default function LoginModal() {
  const firstButtonRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const { login, currentUser, isAuthenticated, showLoginModal, closeLogin, lastUsedProfile } = useUser();

  // Fokus-Management
  useEffect(() => {
    if (showLoginModal && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [showLoginModal]);

  /**
   * Handle Profile Selection
   * @param {string} profileSlug
   */
  const handleProfileSelect = (profileSlug) => {
    try {
      login(profileSlug);
    } catch (err) {
      console.error('[LoginModal] Fehler beim Login:', err);
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
            {currentUser ? 'Benutzer wechseln' : 'Profil wählen'}
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

        <div className="login-modal-profiles">
          {currentUser && (
            <p className="login-modal-current-info">
              Aktuell angemeldet als: <strong>{currentUser}</strong>
            </p>
          )}

          <div className="profile-grid">
            {USER_PROFILES.map((profile, index) => {
              const isLastUsed = lastUsedProfile === profile.slug;
              const isCurrent = currentUser === profile.name;
              
              return (
                <button
                  key={profile.slug}
                  ref={index === 0 ? firstButtonRef : null}
                  type="button"
                  className={`profile-card ${isLastUsed ? 'profile-card--last-used' : ''} ${isCurrent ? 'profile-card--current' : ''}`}
                  onClick={() => handleProfileSelect(profile.slug)}
                  aria-label={`Als ${profile.name} anmelden`}
                >
                  <div className="profile-avatar">
                    {profile.name.charAt(0)}
                  </div>
                  <div className="profile-name">{profile.name}</div>
                  {isLastUsed && !isCurrent && (
                    <div className="profile-badge">Zuletzt verwendet</div>
                  )}
                  {isCurrent && (
                    <div className="profile-badge profile-badge--current">Aktiv</div>
                  )}
                </button>
              );
            })}
          </div>

          {isAuthenticated && closeLogin && (
            <div className="login-modal-actions">
              <button
                type="button"
                className="login-modal-button login-modal-button--secondary"
                onClick={closeLogin}
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
