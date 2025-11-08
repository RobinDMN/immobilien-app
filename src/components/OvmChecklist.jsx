// @ts-check
/// <reference path="../types/ovm.js" />

import React, { useState, useEffect } from 'react';
import { groupOvmItemsByBereich, validateWohnflaeche } from '../lib/ovm.js';
import './OvmChecklist.css';

/**
 * OVM-Checkliste Komponente
 * Rendert eine gruppierte Checkliste mit aufklappbaren Items
 * 
 * @param {Object} props
 * @param {import('../types/ovm.js').OvmItem[]} props.checklist - Die OVM-Checkliste
 * @param {(updatedChecklist: import('../types/ovm.js').OvmItem[]) => void} props.onChange - Callback bei Änderungen
 */
export default function OvmChecklist({ checklist, onChange }) {
  const [items, setItems] = useState(checklist);
  /** @type {[Record<string, string>, Function]} */
  const [validationErrors, setValidationErrors] = useState({});
  /** @type {[Set<string>, Function]} */
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    setItems(checklist);
  }, [checklist]);

  /**
   * Toggle-Handler für Gruppen-Aufklappen
   * @param {string} bereich
   */
  const toggleGroup = (bereich) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(bereich)) {
        newSet.delete(bereich);
      } else {
        newSet.add(bereich);
      }
      return newSet;
    });
  };

  /**
   * Handler für Radio-Button Änderungen
   * @param {string} itemId
   * @param {"Ja" | "Nein" | "nicht gesehen"} value
   */
  const handleChoiceChange = (itemId, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId && item.antworttyp === 'wahl') {
        return { ...item, antwort: value };
      }
      return item;
    });

    setItems(updatedItems);
    onChange(updatedItems);
  };

  /**
   * Handler für Input-Feld Änderungen
   * @param {string} itemId
   * @param {string | number} value
   */
  const handleInputChange = (itemId, value) => {
    /** @type {Record<string, string> | null} */
    let validationError = null;

    const updatedItems = items.map((item) => {
      if (item.id === itemId && item.antworttyp === 'eingabe') {
        let parsedValue = value;

        // Konvertiere zu Number wenn format === 'number'
        if (item.format === 'number' && value !== '') {
          parsedValue = Number(value);
          // Hinweis: Wohnflächen-Validierung wurde entfernt, da OVM-1 (Wohnfläche)
          // jetzt in Objektstammdaten angezeigt wird und nicht mehr in der Checkliste
        }

        return { ...item, wert: parsedValue === '' ? null : parsedValue };
      }
      return item;
    });

    // Validierungsfehler aktualisieren
    if (validationError) {
      setValidationErrors((prev) => ({ ...prev, ...validationError }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[itemId];
        return newErrors;
      });
    }

    setItems(updatedItems);
    onChange(updatedItems);
  };

  const groups = groupOvmItemsByBereich(items);

  return (
    <div className="ovm-checklist">
      <h3 className="ovm-title">OVM-Checkliste Magdeburg 2024</h3>
      <p className="ovm-subtitle">Ortsübliche Vergleichsmiete - Erfassungsbogen</p>

      {groups.map((group) => {
        const isGroupExpanded = expandedGroups.has(group.bereich);
        
        return (
          <div key={group.bereich} className="ovm-group">
            {/* Gruppen-Header (aufklappbar) */}
            <div 
              className={`ovm-group-header ${isGroupExpanded ? 'ovm-group-expanded' : ''}`}
              onClick={() => toggleGroup(group.bereich)}
              role="button"
              tabIndex={0}
              aria-expanded={isGroupExpanded}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleGroup(group.bereich);
                }
              }}
            >
              <span className="ovm-group-icon">
                {isGroupExpanded ? '▼' : '▶'}
              </span>
              <h4 className="ovm-group-title">{group.bereich}</h4>
            </div>

            {/* Gruppen-Inhalt: Items inline */}
            {isGroupExpanded && (
              <div className="ovm-group-content">
                {group.items.map((item) => (
                  <div key={item.id} className="ovm-item">
                    {/* Item-Layout: Links Titel, Rechts Controls */}
                    <div className="ovm-item-row">
                      {/* Linke Seite: Titel + Hinweis */}
                      <div className="ovm-item-info">
                        <div className="ovm-item-title">
                          <span className="ovm-item-id">{item.id}</span>
                          {item.titel}
                          {item.hinweis && (
                            <span className="ovm-item-hint" title={item.hinweis}>
                              ℹ️
                            </span>
                          )}
                        </div>
                        {item.hinweis && (
                          <div className="ovm-item-hint-text">{item.hinweis}</div>
                        )}
                      </div>

                      {/* Rechte Seite: Controls */}
                      <div className="ovm-item-controls">
                        {/* Antworttyp: Wahl (Radio-Buttons) */}
                        {item.antworttyp === 'wahl' && (
                          <div className="ovm-radio-group" role="radiogroup" aria-label={item.titel}>
                            {item.optionen.map((option) => (
                              <label key={option} className="ovm-radio-label">
                                <input
                                  type="radio"
                                  name={item.id}
                                  value={option}
                                  checked={item.antwort === option}
                                  onChange={(e) => handleChoiceChange(item.id, /** @type {any} */ (e.target.value))}
                                  className="ovm-radio-input"
                                />
                                <span className="ovm-radio-text">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Antworttyp: Eingabe (Input-Felder) */}
                        {item.antworttyp === 'eingabe' && (
                          <div className="ovm-input-group">
                            <input
                              type={item.format === 'number' ? 'number' : 'text'}
                              value={item.wert ?? ''}
                              onChange={(e) => handleInputChange(item.id, e.target.value)}
                              placeholder={`Eingabe ${item.format === 'number' ? '(Zahl)' : '(Text)'}`}
                              className={`ovm-input ${validationErrors[item.id] ? 'ovm-input-error' : ''}`}
                              step={item.format === 'number' ? '1' : undefined}
                              aria-label={item.titel}
                            />
                            {item.einheit && <span className="ovm-input-unit">{item.einheit}</span>}
                            {validationErrors[item.id] && (
                              <div className="ovm-validation-error" role="alert">
                                {validationErrors[item.id]}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
