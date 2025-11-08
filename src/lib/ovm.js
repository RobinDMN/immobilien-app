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
 * Normalisiert eine Adresse für konsistentes Matching
 * @param {string} address - Straße + Hausnummer
 * @param {string} plz - Postleitzahl
 * @returns {string} Normalisierte Adresse (lowercase, ohne Spaces, Straße→Str.)
 */
function normalizeAddress(address, plz) {
  if (!address || !plz) return '';
  
  // Normalisiere PLZ: Entferne ".0" am Ende (z.B. "39288.0" → "39288")
  const normalizedPlz = plz.toString().replace('.0', '').trim();
  
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Multiple Spaces → Single Space
    .replace(/straße/g, 'str') // Straße → str
    .replace(/strasse/g, 'str') // Strasse → str
    .replace(/\./g, '') // Punkte entfernen für konsistentes Matching
    + '|' + normalizedPlz;
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
 * Lädt Zusatzdaten (Mieten, Energieklasse, Einheiten, Baujahr, Denkmalschutz)
 * @returns {Promise<Array<{name: string, plz: string, vermietbare_flaeche_qm?: number, wohneinheiten?: number, gewerbeeinheiten?: number, stellplaetze?: number, grundmiete?: string, durchschnitt_miete_qm?: string, energieklasse?: string|null, energietraeger?: string|null, baujahr?: number|null, denkmalschutz?: string|null}>>}
 */
async function loadZusatzdaten() {
  try {
    const response = await fetch('/data/objekt_zusatzdaten_magdeburg_full.json');
    if (!response.ok) {
      console.warn('Zusatzdaten konnten nicht geladen werden:', response.status);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.warn('Fehler beim Laden der Zusatzdaten:', error);
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
  // Lade Zusatzdaten parallel
  const zusatzdaten = await loadZusatzdaten();
  
  // Erstelle Lookup-Map: normalisierte Adresse → Zusatzdaten
  const zusatzdatenMap = new Map();
  zusatzdaten.forEach(zd => {
    const key = normalizeAddress(zd.name, zd.plz);
    if (key) {
      zusatzdatenMap.set(key, zd);
    }
  });
  
  console.log('[OVM] Zusatzdaten geladen:', zusatzdaten.length, 'Einträge');
  console.log('[OVM] Map Keys (erste 5):', Array.from(zusatzdatenMap.keys()).slice(0, 5));
  
  // Simuliere async (für zukünftige API-Anbindung)
  return new Promise((resolve) => {
    setTimeout(() => {
      let matchCount = 0;
      const objects = objekteData.map((obj) => {
        // Normalisiere Adresse des Objekts für Matching
        // Extrahiere PLZ aus adresse
        // Format kann sein: "39108 Magdeburg" oder "Straße Nummer, PLZ Ort"
        let plz = '';
        if (obj.adresse) {
          // Versuche zuerst Split by Komma (falls Format "Straße, PLZ Ort")
          const adressParts = obj.adresse.split(',');
          if (adressParts.length > 1) {
            plz = adressParts[1].trim().split(' ')[0];
          } else {
            // Falls kein Komma: Nimm erstes Wort (Format "PLZ Ort")
            plz = obj.adresse.trim().split(' ')[0];
          }
        }

        const objectKey = normalizeAddress(obj.name, plz);
        const zusatz = zusatzdatenMap.get(objectKey);        if (zusatz) {
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
        
        // Merge Zusatzdaten falls vorhanden
        if (zusatz) {
          console.log('[OVM] Merge für', obj.name, '→', JSON.stringify({
            flaeche: zusatz.vermietbare_flaeche_qm,
            we: zusatz.wohneinheiten,
            ge: zusatz.gewerbeeinheiten,
            stellplaetze: zusatz.stellplaetze,
            grundmiete: zusatz.grundmiete,
            durchschnitt_miete_qm: zusatz.durchschnitt_miete_qm
          }));
          
          return {
            ...baseObject,
            vermietbare_flaeche_qm: zusatz.vermietbare_flaeche_qm,
            wohneinheiten: zusatz.wohneinheiten,
            gewerbeeinheiten: zusatz.gewerbeeinheiten,
            stellplaetze: zusatz.stellplaetze,
            grundmiete: formatCurrency(zusatz.grundmiete),
            durchschnitt_miete_qm: formatRentPerSqm(zusatz.durchschnitt_miete_qm),
            energieklasse: zusatz.energieklasse || null,
            energietraeger: zusatz.energietraeger || null,
            baujahr: zusatz.baujahr,
            denkmalschutz: zusatz.denkmalschutz || null
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
