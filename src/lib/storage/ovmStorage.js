/**
 * @fileoverview OVM Storage Provider - Persistenz für Checklisten-Antworten
 * Unterstützt LocalStorage (Default) und optionalen Remote-Provider
 */

// @ts-check

/**
 * Schema-Version für OVM-Checkliste Magdeburg 2024
 */
const SCHEMA_VERSION = 'ms-2024.1';

/**
 * Storage-Provider Interface
 * @typedef {Object} StorageProvider
 * @property {(objectId: string) => Promise<OvmAnswerData | null>} load
 * @property {(objectId: string, data: OvmAnswerData) => Promise<void>} save
 * @property {(objectId: string) => Promise<void>} clear
 */

/**
 * OVM Answer Data - Nur Antworten, keine Stammdaten
 * @typedef {Object} OvmAnswerData
 * @property {string} schemaVersion
 * @property {string} objectId
 * @property {string} lastModified - ISO timestamp
 * @property {Record<string, OvmAnswerValue>} answers - Item-ID → Antwort
 */

/**
 * @typedef {Object} OvmAnswerValue
 * @property {string | number | null} [wert] - Für Eingabefelder
 * @property {string} [antwort] - Für Radio-Buttons (Ja/Nein/nicht gesehen)
 */

/**
 * LocalStorage Provider (Default)
 */
class LocalStorageProvider {
  /**
   * Generiert stabilen Key für LocalStorage
   * @param {string} objectId
   * @returns {string}
   */
  getStorageKey(objectId) {
    return `immobilien-app:ovm:${SCHEMA_VERSION}:${objectId}`;
  }

  /**
   * Lädt gespeicherte Antworten aus LocalStorage
   * @param {string} objectId
   * @returns {Promise<OvmAnswerData | null>}
   */
  async load(objectId) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }

      const key = this.getStorageKey(objectId);
      const raw = localStorage.getItem(key);
      
      if (!raw) {
        return null;
      }

      const data = JSON.parse(raw);
      
      // Validierung
      if (!data.schemaVersion || !data.objectId || !data.answers) {
        console.warn('[OVM Storage] Ungültige Daten, verwerfe:', data);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[OVM Storage] Fehler beim Laden:', error);
      return null;
    }
  }

  /**
   * Speichert Antworten in LocalStorage
   * @param {string} objectId
   * @param {OvmAnswerData} data
   * @returns {Promise<void>}
   */
  async save(objectId, data) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        throw new Error('LocalStorage nicht verfügbar');
      }

      const key = this.getStorageKey(objectId);
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('[OVM Storage] Fehler beim Speichern:', error);
      throw error;
    }
  }

  /**
   * Löscht gespeicherte Antworten
   * @param {string} objectId
   * @returns {Promise<void>}
   */
  async clear(objectId) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const key = this.getStorageKey(objectId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[OVM Storage] Fehler beim Löschen:', error);
    }
  }
}

/**
 * Remote Storage Provider (optional, per ENV aktiviert)
 */
class RemoteStorageProvider {
  constructor() {
    this.apiBaseUrl = '/api/ovm-storage';
    this.timeout = 5000; // 5 Sekunden
    this.localFallback = new LocalStorageProvider();
  }

  /**
   * Lädt Antworten vom Server
   * @param {string} objectId
   * @returns {Promise<OvmAnswerData | null>}
   */
  async load(objectId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.apiBaseUrl}/${objectId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('[OVM Storage] Remote-Load fehlgeschlagen, versuche LocalStorage:', error);
      return this.localFallback.load(objectId);
    }
  }

  /**
   * Speichert Antworten auf Server (mit LocalStorage Fallback)
   * @param {string} objectId
   * @param {OvmAnswerData} data
   * @returns {Promise<void>}
   */
  async save(objectId, data) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.apiBaseUrl}/${objectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Zusätzlich lokal speichern als Backup
      await this.localFallback.save(objectId, data);
    } catch (error) {
      console.warn('[OVM Storage] Remote-Save fehlgeschlagen, speichere lokal:', error);
      await this.localFallback.save(objectId, data);
      throw new Error('Remote-Speicherung fehlgeschlagen (lokal gesichert)');
    }
  }

  /**
   * Löscht Antworten vom Server und lokal
   * @param {string} objectId
   * @returns {Promise<void>}
   */
  async clear(objectId) {
    try {
      await fetch(`${this.apiBaseUrl}/${objectId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('[OVM Storage] Remote-Clear fehlgeschlagen:', error);
    }

    await this.localFallback.clear(objectId);
  }
}

/**
 * Factory: Liefert aktiven Provider basierend auf ENV
 * @returns {StorageProvider}
 */
export function getStorageProvider() {
  // Prüfe ENV-Variable (Vite verwendet import.meta.env)
  const useRemote = import.meta.env.VITE_USE_REMOTE_OVM_STORAGE === 'true';
  
  if (useRemote) {
    console.log('[OVM Storage] Remote-Provider aktiviert');
    return new RemoteStorageProvider();
  }
  
  console.log('[OVM Storage] LocalStorage-Provider aktiviert');
  return new LocalStorageProvider();
}

/**
 * Extrahiert Antworten aus OVM-Checkliste
 * @param {import('../../types/ovm.js').OvmItem[]} checklist
 * @returns {Record<string, OvmAnswerValue>}
 */
export function extractAnswers(checklist) {
  /** @type {Record<string, OvmAnswerValue>} */
  const answers = {};

  checklist.forEach((item) => {
    if (item.antworttyp === 'wahl' && item.antwort) {
      answers[item.id] = { antwort: item.antwort };
    } else if (item.antworttyp === 'eingabe' && item.wert !== null && item.wert !== undefined) {
      answers[item.id] = { wert: item.wert };
    }
  });

  return answers;
}

/**
 * Merged gespeicherte Antworten in Vorlage
 * @param {import('../../types/ovm.js').OvmItem[]} templateChecklist - Bereinigte Vorlage
 * @param {OvmAnswerData | null} savedData - Gespeicherte Antworten
 * @returns {import('../../types/ovm.js').OvmItem[]}
 */
export function mergeAnswers(templateChecklist, savedData) {
  if (!savedData || !savedData.answers) {
    return templateChecklist;
  }

  return templateChecklist.map((item) => {
    const savedAnswer = savedData.answers[item.id];
    
    if (!savedAnswer) {
      return item;
    }

    // Merge Radio-Button Antwort
    if (item.antworttyp === 'wahl' && savedAnswer.antwort) {
      return { ...item, antwort: savedAnswer.antwort };
    }

    // Merge Eingabewert
    if (item.antworttyp === 'eingabe' && savedAnswer.wert !== undefined) {
      return { ...item, wert: savedAnswer.wert };
    }

    return item;
  });
}

/**
 * Erstellt OvmAnswerData Objekt für Speicherung
 * @param {string} objectId
 * @param {import('../../types/ovm.js').OvmItem[]} checklist
 * @returns {OvmAnswerData}
 */
export function createAnswerData(objectId, checklist) {
  return {
    schemaVersion: SCHEMA_VERSION,
    objectId,
    lastModified: new Date().toISOString(),
    answers: extractAnswers(checklist),
  };
}

export { SCHEMA_VERSION };
