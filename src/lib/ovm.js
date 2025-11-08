/**
 * @fileoverview OVM Data Loader - Lädt Objekte und fügt OVM-Checkliste hinzu
 */

// @ts-check
/// <reference path="../types/ovm.js" />

import objekteData from '../data/objekte_magdeburg.json';
import ovmChecklisteTemplate from '../data/mietspiegel_checkliste_magdeburg_2024.json';

/**
 * IDs der Basisfelder, die aus der Checkliste entfernt werden sollen
 * (werden bereits in den Objektstammdaten angezeigt)
 */
const EXCLUDED_BASE_FIELD_IDS = ['OVM-1', 'OVM-2', 'OVM-3', 'OVM-4'];

/**
 * Normalisiert Straßenname für String-Matching (case-insensitiv, trim)
 * @param {string} strasse - Straße + Hausnummer
 * @returns {string} Normalisierter String
 */
function normalizeStrasse(strasse) {
  if (!strasse) return '';
  return strasse.toLowerCase().trim();
}

/**
 * Parst deutsche Zahlen-Strings (z.B. "1.704,30" oder "7,02") zu Number
 * @param {string|number} value - Wert als String oder Number
 * @returns {number|null} Geparste Zahl oder null
 */
function parseDeNumber(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  if (str === '') return null;
  
  // Entferne Tausender-Punkte, ersetze Dezimal-Komma durch Punkt
  const normalized = str.replace(/\./g, '').replace(',', '.');
  const num = Number(normalized);
  
  return isNaN(num) ? null : num;
}

/**
 * Formatiert Zahlen im deutschen Format
 * @param {number} value - Zahl
 * @param {object} options - Formatierungs-Optionen
 * @param {number} options.decimals - Anzahl Dezimalstellen
 * @returns {string|null} Formatierter String oder null
 */
function formatDeNumber(value, { decimals = 2 } = {}) {
  if (value == null || isNaN(value)) return null;
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formatiert Geldbeträge ins deutsche Format (€ X.XXX,XX)
 * @param {string|number} value - Wert als String oder Number
 * @returns {string|null} Formatierter Betrag mit € Symbol oder null
 */
function formatCurrency(value) {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  return '€ ' + num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formatiert Miete pro m² (€/m²)
 * @param {string|number} value - Wert als String oder Number
 * @returns {string|null} Formatierter Wert mit €/m² Suffix oder null
 */
function formatRentPerSqm(value) {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return null;
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €/m²';
}

/**
 * Lädt Objekt-Infos aus objekt_infos_geordnet.json (1:1 Daten ohne Transformation)
 * @returns {Promise<Array>}
 */
async function loadObjektInfos() {
  try {
    const response = await fetch('/data/objekt_infos_geordnet.json');
    if (!response.ok) {
      console.warn('[OVM] Objekt-Infos konnten nicht geladen werden:', response.status);
      return [];
    }
    const data = await response.json();
    console.log('[OVM] Objekt-Infos geladen:', data.length, 'Einträge');
    return data;
  } catch (error) {
    console.warn('[OVM] Fehler beim Laden der Objekt-Infos:', error);
    return [];
  }
}

/**
 * Erstellt eine tiefe Kopie der OVM-Checkliste und entfernt Basisfelder
 * @returns {import('../types/ovm.js').OvmItem[]}
 */
function deepCopyOvmChecklist() {
  const fullChecklist = JSON.parse(JSON.stringify(ovmChecklisteTemplate));
  // Filtere Basisfelder (Wohnfläche, Adresse, Baujahr, Denkmalschutz) heraus
  return fullChecklist.filter(item => !EXCLUDED_BASE_FIELD_IDS.includes(item.id));
}

/**
 * Filtert Basisfelder aus einer bestehenden Checkliste
 * @param {import('../types/ovm.js').OvmItem[]} checklist
 * @returns {import('../types/ovm.js').OvmItem[]}
 */
function filterBaseFields(checklist) {
  return checklist.filter(item => !EXCLUDED_BASE_FIELD_IDS.includes(item.id));
}

/**
 * Lädt alle Magdeburg-Objekte und ergänzt fehlende ovm_checkliste
 * Entfernt Basisfelder (OVM-1 bis OVM-4) aus allen Checklisten
 * Merged Zusatzdaten (Mieten, Energieklasse, Einheiten)
 * @returns {Promise<import('../types/ovm.js').PropertyObject[]>}
 */
export async function loadMagdeburgObjects() {
  // Lade Objekt-Infos
  const objektInfos = await loadObjektInfos();
  
  // Erstelle Lookup-Map: normalisierte Straße → Objekt-Info
  const objektInfosMap = new Map();
  objektInfos.forEach(info => {
    const key = normalizeStrasse(info.strasse);
    if (key) {
      objektInfosMap.set(key, info);
    }
  });
  
  console.log('[OVM] Objekt-Infos Map Keys (erste 5):', Array.from(objektInfosMap.keys()).slice(0, 5));
  
  // Simuliere async (für zukünftige API-Anbindung)
  return new Promise((resolve) => {
    setTimeout(() => {
      let matchCount = 0;
      const objects = objekteData.map((obj) => {
        // Normalisiere Straßenname für Matching
        const objectKey = normalizeStrasse(obj.name);
        const info = objektInfosMap.get(objectKey);

        if (info) {
          matchCount++;
          console.log('[OVM] ✓ Match:', obj.name, '→', objectKey);
        } else {
          console.log('[OVM] ✗ Kein Match:', obj.name, '→', objectKey);
        }
        
        // @ts-ignore - Property wird dynamisch hinzugefügt
        const baseObject = {
          ...obj,
          ovm_checkliste: obj.ovm_checkliste 
            ? filterBaseFields(obj.ovm_checkliste)
            : deepCopyOvmChecklist()
        };
        
        // Merge Objekt-Infos falls vorhanden
        if (info) {
          // Rohdaten-Diagnose in Console ausgeben (VOR jeder Transformation)
          console.log('[OVM] Raw JSON für', obj.name, ':', {
            qm_flaeche: info.qm_flaeche,
            leerstand_qm: info.leerstand_qm,
            wohneinheiten: info.wohneinheiten,
            gewerbeeinheiten: info.gewerbeeinheiten,
            stellplaetze: info.stellplaetze,
            grundmiete: info.grundmiete,
            durchschnitt_miete_qm: info.durchschnitt_miete_qm,
            baujahr: info.baujahr,
            baujahr_waermeerzeuger: info.baujahr_waermeerzeuger
          });
          
          // KORREKTES Parsing (nur einmal, hier im Loader):
          // Flächenwerte: Inkonsistente Daten - intelligente Erkennung
          // Wenn Wert > 50000, dann ÷100, sonst ÷10
          const qm_flaeche_num = info.qm_flaeche != null 
            ? (info.qm_flaeche > 50000 ? info.qm_flaeche / 100 : info.qm_flaeche / 10)
            : null;
          // Leerstand: Integer / 100 (z.B. 41334 → 413,34)
          const leerstand_qm_num = info.leerstand_qm != null ? info.leerstand_qm / 100 : null;
          
          // Einheiten: Integer / 10 (z.B. 340 → 34)
          const wohneinheiten_int = info.wohneinheiten != null ? Math.round(info.wohneinheiten / 10) : null;
          const gewerbeeinheiten_int = info.gewerbeeinheiten != null ? Math.round(info.gewerbeeinheiten / 10) : null;
          const stellplaetze_int = info.stellplaetze != null ? Math.round(info.stellplaetze / 10) : null;
          
          // Jahre: Integer / 10 (z.B. 18980 → 1898, 19950 → 1995)
          const baujahr_int = info.baujahr != null ? Math.round(info.baujahr / 10) : null;
          const baujahr_waermeerzeuger_int = info.baujahr_waermeerzeuger != null ? Math.round(info.baujahr_waermeerzeuger / 10) : null;
          
          // Währung/Miete: Sind bereits Numbers im JSON, direkt übernehmen
          // KEINE Division, KEIN Parsing! Werte sind bereits korrekt.
          const grundmiete_num = typeof info.grundmiete === 'number' ? info.grundmiete : null;
          const durchschnitt_miete_qm_num = typeof info.durchschnitt_miete_qm === 'number' ? info.durchschnitt_miete_qm : null;
          
          console.log('[OVM] Parsed für', obj.name, ':', {
            qm_flaeche_num,
            leerstand_qm_num,
            wohneinheiten_int,
            gewerbeeinheiten_int,
            stellplaetze_int,
            grundmiete_num,
            durchschnitt_miete_qm_num,
            baujahr_int,
            baujahr_waermeerzeuger_int
          });
          
          return {
            ...baseObject,
            // Normierte Zahlen-Werte (einmalig geparst, eingefroren)
            qm_flaeche_num,
            leerstand_qm_num,
            wohneinheiten_int,
            gewerbeeinheiten_int,
            stellplaetze_int,
            grundmiete_num,
            durchschnitt_miete_qm_num,
            baujahr_int,
            baujahr_waermeerzeuger_int,
            // Text-Felder unverändert
            denkmalschutz: info.denkmalschutz,
            energieeffizienz: info.energieeffizienz,
            energietraeger: info.energietraeger,
            energieeffizienzklasse: info.energieeffizienzklasse,
            bemerkung: info.bemerkung
          };
        }
        
        return baseObject;
      });
      
      console.log('[OVM] Matching abgeschlossen:', matchCount, '/', objekteData.length, 'Objekte');
      resolve(objects);
    }, 0);
  });
}

/**
 * Gruppiert OVM-Items nach Bereich für bessere UI-Darstellung
 * @param {import('../types/ovm.js').OvmItem[]} items
 * @returns {import('../types/ovm.js').OvmGroup[]}
 */
export function groupOvmItemsByBereich(items) {
  /** @type {Record<string, import('../types/ovm.js').OvmItem[]>} */
  const grouped = {};
  
  items.forEach((item) => {
    if (!grouped[item.bereich]) {
      grouped[item.bereich] = [];
    }
    grouped[item.bereich].push(item);
  });
  
  return Object.keys(grouped).map((bereich) => ({
    bereich,
    items: grouped[bereich]
  }));
}

/**
 * Validiert Wohnflächen-Eingabe (muss zwischen 20 und 200 m² liegen)
 * @param {number} wohnflaeche
 * @returns {{valid: boolean, message?: string}}
 */
export function validateWohnflaeche(wohnflaeche) {
  if (isNaN(wohnflaeche)) {
    return { valid: false, message: 'Bitte geben Sie eine Zahl ein.' };
  }
  
  if (wohnflaeche < 20 || wohnflaeche > 200) {
    return { 
      valid: false, 
      message: 'Wohnfläche muss zwischen 20 und 200 m² liegen (Mietspiegelgültigkeit).' 
    };
  }
  
  return { valid: true };
}

/**
 * Findet ein Objekt anhand seiner ID
 * @param {import('../types/ovm.js').PropertyObject[]} objects
 * @param {string} id
 * @returns {import('../types/ovm.js').PropertyObject | undefined}
 */
export function findObjectById(objects, id) {
  return objects.find(obj => obj.id === id);
}
