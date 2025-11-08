/**
 * @fileoverview User Context - Profil-basiertes Login und User-State-Management
 */

// @ts-check

import React, { createContext, useContext, useState, useEffect } from 'react';

const USER_STORAGE_KEY = 'immobilien-app:currentUser';

/**
 * Feste Profile
 * @typedef {Object} UserProfile
 * @property {string} name - Display-Name
 * @property {string} slug - URL-tauglicher Slug für Storage
 */

/** @type {UserProfile[]} */
export const USER_PROFILES = [
  { name: 'Robin', slug: 'robin' },
  { name: 'Friedrich', slug: 'friedrich' },
  { name: 'Freddy', slug: 'freddy' },
  { name: 'Salih', slug: 'salih' },
];

/**
 * Findet Profil anhand Name oder Slug
 * @param {string} nameOrSlug
 * @returns {UserProfile | undefined}
 */
export function findProfile(nameOrSlug) {
  const normalized = nameOrSlug.toLowerCase().trim();
  return USER_PROFILES.find(
    p => p.name.toLowerCase() === normalized || p.slug === normalized
  );
}

/**
 * @typedef {Object} UserContextType
 * @property {string | null} currentUser - Display-Name des aktuellen Benutzers
 * @property {string | null} userSlug - URL-tauglicher Slug des Benutzers
 * @property {boolean} isAuthenticated - Ob ein Benutzer angemeldet ist
 * @property {(profileNameOrSlug: string) => void} login - Login-Funktion (mit festem Profil)
 * @property {() => void} logout - Logout-Funktion
 * @property {() => void} showLogin - Login-Modal anzeigen
 * @property {() => void} closeLogin - Login-Modal schließen
 * @property {boolean} showLoginModal - Ob Login-Modal angezeigt wird
 * @property {string | null} lastUsedProfile - Slug des zuletzt verwendeten Profils
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
  const [lastUsedProfile, setLastUsedProfile] = useState(/** @type {string | null} */ (null));

  // Auto-Login beim Start
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        if (userData.slug) {
          // Finde Profil anhand Slug
          const profile = findProfile(userData.slug);
          if (profile) {
            setCurrentUser(profile.name);
            setUserSlug(profile.slug);
            console.log('[UserContext] Auto-Login:', profile.name);
          } else {
            // Ungültiges Profil → Login anzeigen
            setShowLoginModal(true);
          }
        } else {
          // Kein Slug → Login anzeigen
          setShowLoginModal(true);
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
   * Login-Funktion (mit festem Profil)
   * @param {string} profileNameOrSlug - Name oder Slug des Profils
   */
  const login = (profileNameOrSlug) => {
    const profile = findProfile(profileNameOrSlug);
    
    if (!profile) {
      throw new Error('Ungültiges Profil');
    }
    
    // Speichere in State
    setCurrentUser(profile.name);
    setUserSlug(profile.slug);
    setShowLoginModal(false);

    // Persistiere im LocalStorage
    try {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({
          name: profile.name,
          slug: profile.slug,
          loginAt: new Date().toISOString(),
        })
      );
      console.log('[UserContext] Login erfolgreich:', profile.name, '→', profile.slug);
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
    lastUsedProfile: userSlug, // Aktuelles Profil = zuletzt verwendet
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
