/**
 * @fileoverview User Context - Name-basiertes Login und User-State-Management
 */

// @ts-check

import React, { createContext, useContext, useState, useEffect } from 'react';

const USER_STORAGE_KEY = 'immobilien-app:currentUser';

/**
 * Konvertiert Namen zu URL-tauglichem Slug
 * @param {string} name
 * @returns {string}
 */
export function slugifyUsername(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validiert Benutzername
 * @param {string} name
 * @returns {{valid: boolean, error?: string}}
 */
export function validateUsername(name) {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Bitte gib einen Namen ein.' };
  }
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Der Name muss mindestens 2 Zeichen lang sein.' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Der Name darf maximal 50 Zeichen lang sein.' };
  }
  
  return { valid: true };
}

/**
 * @typedef {Object} UserContextType
 * @property {string | null} currentUser - Display-Name des aktuellen Benutzers
 * @property {string | null} userSlug - URL-tauglicher Slug des Benutzers
 * @property {boolean} isAuthenticated - Ob ein Benutzer angemeldet ist
 * @property {(name: string) => void} login - Login-Funktion
 * @property {() => void} logout - Logout-Funktion
 * @property {() => void} showLogin - Login-Modal anzeigen
 * @property {() => void} closeLogin - Login-Modal schließen
 * @property {boolean} showLoginModal - Ob Login-Modal angezeigt wird
 */

/** @type {React.Context<UserContextType>} */
const UserContext = createContext(null);

/**
 * User Provider Component
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(/** @type {string | null} */ (null));
  const [userSlug, setUserSlug] = useState(/** @type {string | null} */ (null));
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Auto-Login beim Start
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        if (userData.name) {
          setCurrentUser(userData.name);
          setUserSlug(slugifyUsername(userData.name));
          console.log('[UserContext] Auto-Login:', userData.name);
        }
      } else {
        // Kein User gespeichert → Login anzeigen
        setShowLoginModal(true);
      }
    } catch (error) {
      console.error('[UserContext] Fehler beim Auto-Login:', error);
      setShowLoginModal(true);
    }
  }, []);

  /**
   * Login-Funktion
   * @param {string} name
   */
  const login = (name) => {
    const trimmed = name.trim();
    const validation = validateUsername(trimmed);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const slug = slugifyUsername(trimmed);
    
    // Speichere in State
    setCurrentUser(trimmed);
    setUserSlug(slug);
    setShowLoginModal(false);

    // Persistiere im LocalStorage
    try {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({
          name: trimmed,
          slug,
          loginAt: new Date().toISOString(),
        })
      );
      console.log('[UserContext] Login erfolgreich:', trimmed, '→', slug);
    } catch (error) {
      console.error('[UserContext] Fehler beim Speichern:', error);
    }
  };

  /**
   * Logout-Funktion
   */
  const logout = () => {
    setCurrentUser(null);
    setUserSlug(null);
    setShowLoginModal(true);

    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      console.log('[UserContext] Logout erfolgreich');
    } catch (error) {
      console.error('[UserContext] Fehler beim Logout:', error);
    }
  };

  /**
   * Login-Modal anzeigen (für User-Switch)
   */
  const showLogin = () => {
    setShowLoginModal(true);
  };

  /**
   * Login-Modal schließen
   */
  const closeLogin = () => {
    // Nur schließen wenn User eingeloggt ist
    if (currentUser) {
      setShowLoginModal(false);
    }
  };

  const value = {
    currentUser,
    userSlug,
    isAuthenticated: !!currentUser,
    login,
    logout,
    showLogin,
    closeLogin,
    showLoginModal,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook für User-Context
 * @returns {UserContextType}
 */
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser muss innerhalb von UserProvider verwendet werden');
  }
  return context;
}
