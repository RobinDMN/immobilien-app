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
 * @returns {Promise<import('../types/ovm.js').PropertyObject[]>}
 */
export async function loadMagdeburgObjects() {
  // Simuliere async (für zukünftige API-Anbindung)
  return new Promise((resolve) => {
    setTimeout(() => {
      const objects = objekteData.map((obj) => {
        // @ts-ignore - Property wird dynamisch hinzugefügt
        if (!obj.ovm_checkliste) {
          // Neue Checkliste: bereits gefiltert durch deepCopyOvmChecklist()
          return {
            ...obj,
            ovm_checkliste: deepCopyOvmChecklist()
          };
        } else {
          // Bestehende Checkliste: ebenfalls Basisfelder entfernen
          return {
            ...obj,
            ovm_checkliste: filterBaseFields(obj.ovm_checkliste)
          };
        }
      });
      
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
