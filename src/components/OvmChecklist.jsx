// @ts-check
/// <reference path="../types/ovm.js" />

import React, { useState, useEffect } from 'react';
import { groupOvmItemsByBereich, validateWohnflaeche } from '../lib/ovm.js';
import { getStorageProvider, createAnswerData, mergeAnswers } from '../lib/storage/ovmStorage.js';
import { useDebouncedSave } from '../hooks/useDebouncedSave.js';
import { useUser } from '../contexts/UserContext.jsx';
import './OvmChecklist.css';

/**
 * OVM-Checkliste Komponente
 * Rendert eine gruppierte Checkliste mit Persistenz
 * 
 * @param {Object} props
 * @param {string} props.objectId - ID des Objekts für Persistenz
 * @param {import('../types/ovm.js').OvmItem[]} props.checklist - Die OVM-Checkliste
 * @param {(updatedChecklist: import('../types/ovm.js').OvmItem[]) => void} props.onChange - Callback bei Änderungen
 */
export default function OvmChecklist({ object, onUpdate, initialState = {} }) {
  const { userSlug } = useUser();
  const [items, setItems] = useState([]);
  
  /** @type {[Record<string, string>, Function]} */
  const [validationErrors, setValidationErrors] = useState({});
  /** @type {[Set<string>, Function]} */
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // Storage Provider & Debounced Save
  const storageProvider = getStorageProvider();
  const { save: debouncedSave, status: saveStatus, error: saveError } = useDebouncedSave(
    async (answers) => {
      if (!userSlug || !object?.id) return;
      await storageProvider.save(userSlug, object.id, answers);
      onUpdate(object.id, answers); // Inform parent about the update
    },
    500
  );

  // Merge initial state with checklist definition when component mounts or props change
  useEffect(() => {
    if (object?.ovm_checkliste) {
      const merged = mergeAnswers(object.ovm_checkliste, initialState);
      setItems(merged);
    }
  }, [object, initialState]);

  /**
   * Hilfsfunktion: Erstellt neue Antwortdaten und löst die Speicherung aus.
   * @param {import('../types/ovm.js').OvmItem[]} updatedItems 
   */
  const triggerSave = (updatedItems) => {
    const answerData = createAnswerData(object.id, updatedItems);
    debouncedSave(answerData);
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
    triggerSave(updatedItems);
  };

  /**
   * Handler für Input-Feld Änderungen
   * @param {string} itemId
   * @param {string | number} value
   */
  const handleInputChange = (itemId, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId && item.antworttyp === 'eingabe') {
        let parsedValue = value;
        if (item.format === 'number' && value !== '') {
          parsedValue = Number(value);
        }
        return { ...item, wert: parsedValue === '' ? null : parsedValue };
      }
      return item;
    });
    setItems(updatedItems);
    triggerSave(updatedItems);
  };

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

  if (!object || !items.length) {
    return <div>Checkliste wird geladen...</div>;
  }

  const groups = groupOvmItemsByBereich(items);

  return (
    <div className="ovm-checklist">
      <div className="ovm-checklist-header">
        <div>
          <h3 className="ovm-title">OVM-Checkliste Magdeburg 2024</h3>
          <p className="ovm-subtitle">Ortsübliche Vergleichsmiete - Erfassungsbogen</p>
        </div>
        
        {/* Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <div className={`ovm-save-status ovm-save-status--${saveStatus}`}>
            {saveStatus === 'saving' && (
              <>
                <span className="ovm-save-spinner"></span>
                Speichere...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <span className="ovm-save-icon">✓</span>
                Gespeichert
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <span className="ovm-save-icon">⚠</span>
                {saveError || 'Fehler beim Speichern'}
              </>
            )}
          </div>
        )}
      </div>

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
