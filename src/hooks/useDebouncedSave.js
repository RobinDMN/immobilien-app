/**
 * @fileoverview Custom Hook für Debounced Save mit Status-Tracking
 */

// @ts-check

import { useRef, useCallback, useState } from 'react';

/**
 * @typedef {'idle' | 'saving' | 'saved' | 'error'} SaveStatus
 */

/**
 * Hook für automatisches Speichern mit Debounce
 * @param {Function} saveFn - Async Save-Funktion
 * @param {number} delay - Debounce delay in ms
 * @returns {{save: Function, status: SaveStatus, error: string | null}}
 */
export function useDebouncedSave(saveFn, delay = 500) {
  const [status, setStatus] = useState(/** @type {SaveStatus} */ ('idle'));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const timeoutRef = useRef(/** @type {NodeJS.Timeout | null} */ (null));
  const savedTimeoutRef = useRef(/** @type {NodeJS.Timeout | null} */ (null));

  const save = useCallback(
    (...args) => {
      // Lösche vorherigen Timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Lösche "Gespeichert"-Status-Timeout
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      // Setze Status auf "Speichere..."
      setStatus('saving');
      setError(null);

      // Debounce: Speichere erst nach Delay
      timeoutRef.current = setTimeout(async () => {
        try {
          await saveFn(...args);
          setStatus('saved');
          setError(null);

          // Blende "Gespeichert" nach 2 Sekunden aus
          savedTimeoutRef.current = setTimeout(() => {
            setStatus('idle');
          }, 2000);
        } catch (err) {
          console.error('[useDebouncedSave] Fehler:', err);
          setStatus('error');
          setError(err instanceof Error ? err.message : 'Speicherfehler');

          // Blende Fehler nach 5 Sekunden aus
          savedTimeoutRef.current = setTimeout(() => {
            setStatus('idle');
            setError(null);
          }, 5000);
        }
      }, delay);
    },
    [saveFn, delay]
  );

  return { save, status, error };
}
