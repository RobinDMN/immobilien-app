/**
 * @fileoverview TypeScript-ähnliche Type Definitions für OVM-Checkliste
 * mit JSDoc für IDE-Support ohne vollständige TypeScript-Migration
 */

/**
 * @typedef {Object} OvmChoiceItem
 * @property {string} id - Eindeutige ID des Checklisteneintrags (z.B. "OVM-4")
 * @property {string} bereich - Kategoriebereich (z.B. "II. Wohnflächenabhängige Merkmale")
 * @property {string} titel - Titel/Frage des Merkmals
 * @property {"wahl"} antworttyp - Typ: immer "wahl" für Radio-Buttons
 * @property {["Ja", "Nein", "nicht gesehen"]} optionen - Die drei möglichen Antworten
 * @property {"Ja" | "Nein" | "nicht gesehen"} antwort - Aktuell gewählte Antwort
 * @property {string} [hinweis] - Optionaler Hinweistext
 */

/**
 * @typedef {Object} OvmInputItem
 * @property {string} id - Eindeutige ID des Checklisteneintrags (z.B. "OVM-1")
 * @property {string} bereich - Kategoriebereich
 * @property {string} titel - Titel/Frage des Merkmals
 * @property {"eingabe"} antworttyp - Typ: immer "eingabe" für Input-Felder
 * @property {"number" | "text"} format - Eingabeformat
 * @property {number | string | null} wert - Aktueller Wert der Eingabe
 * @property {string} [einheit] - Optionale Einheit (z.B. "m²")
 * @property {string} [hinweis] - Optionaler Hinweistext
 */

/**
 * Union-Type für alle Checklisteneinträge
 * @typedef {OvmChoiceItem | OvmInputItem} OvmItem
 */

/**
 * @typedef {Object} SimpleChecklistItem
 * @property {string} id - ID des einfachen Checklisteneintrags
 * @property {string} titel - Titel der Aufgabe
 * @property {boolean} erledigt - Ob die Aufgabe erledigt ist
 */

/**
 * @typedef {Object} PropertyObject
 * @property {string} id - Eindeutige Objekt-ID
 * @property {string} name - Name/Straße des Objekts
 * @property {string} adresse - Vollständige Adresse inkl. PLZ
 * @property {string | null} grundmiete - Grundmiete als String mit Einheit
 * @property {string | null} durchschnittsmiete - Ø Miete/m² als String
 * @property {string | null} zielmiete - Zielmiete/m² als String
 * @property {string | null} baujahr - Baujahr als String
 * @property {string | null} denkmalschutz - "Ja" / "Nein" / null
 * @property {string | null} modernisierung - Jahr der Modernisierung
 * @property {string | null} waermeerzeuger - Typ des Wärmeerzeugers
 * @property {string | null} energietraeger - Energieträger (z.B. "Erdgas")
 * @property {string | null} energieklasse - Energieklasse (z.B. "E" oder "HH = G, VH = E")
 * @property {string | null} stellplatzmiete - Stellplatzmiete als String mit Einheit
 * @property {SimpleChecklistItem[]} checkliste - Einfache (alte) Checkliste
 * @property {OvmItem[]} [ovm_checkliste] - OVM-Checkliste (erweitert)
 */

/**
 * Gruppierte OVM-Einträge nach Bereich
 * @typedef {Object} OvmGroup
 * @property {string} bereich - Name des Bereichs
 * @property {OvmItem[]} items - Alle Items dieses Bereichs
 */

// Export der Typen als Kommentar für Dokumentation
export {};
