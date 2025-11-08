// @ts-check
/// <reference path="../types/ovm.js" />

import React, { useState, useEffect } from 'react';
import { loadMagdeburgObjects, findObjectById } from '../lib/ovm.js';
import OvmChecklist from '../components/OvmChecklist.jsx';
import './PropertyDetail.css';

/**
 * Property Detail Page - Zeigt Objektdetails und OVM-Checkliste
 * 
 * @param {Object} props
 * @param {string} props.objectId - ID des anzuzeigenden Objekts
 */
export default function PropertyDetail({ objectId }) {
  /** @type {[import('../types/ovm.js').PropertyObject | null, Function]} */
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [objectId]);

  async function loadData() {
    try {
      setLoading(true);
      const objects = await loadMagdeburgObjects();
      const foundProperty = findObjectById(objects, objectId);

      if (!foundProperty) {
        setError(`Objekt mit ID "${objectId}" nicht gefunden.`);
        return;
      }

      setProperty(foundProperty);
    } catch (err) {
      setError('Fehler beim Laden der Objektdaten.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handler für OVM-Checklisten-Änderungen
   * @param {import('../types/ovm.js').OvmItem[]} updatedChecklist
   */
  const handleOvmChange = (updatedChecklist) => {
    if (!property) return;

    // Update local state
    setProperty({
      ...property,
      ovm_checkliste: updatedChecklist
    });

    // Hier könnte ein API-Call zum Speichern erfolgen
    console.log('OVM Checklist updated:', updatedChecklist);
  };

  if (loading) {
    return (
      <div className="property-detail-loading">
        <div className="spinner"></div>
        <p>Lade Objektdaten...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="property-detail-error">
        <h2>❌ Fehler</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="property-detail">
      {/* Objekt-Header */}
      <div className="property-header">
        <div className="property-header-content">
          <h1 className="property-name">{property.name}</h1>
          <p className="property-address">{property.adresse}</p>
        </div>
      </div>

      {/* Objekt-Informationen */}
      <div className="property-info-section">
        <h2 className="section-title">Objektinformationen</h2>
        <div className="property-info-grid">
          {property.grundmiete && (
            <div className="info-card">
              <span className="info-label">Grundmiete</span>
              <span className="info-value">{property.grundmiete}</span>
            </div>
          )}
          {property.durchschnittsmiete && (
            <div className="info-card">
              <span className="info-label">Ø Miete/m²</span>
              <span className="info-value">{property.durchschnittsmiete}</span>
            </div>
          )}
          {property.zielmiete && (
            <div className="info-card">
              <span className="info-label">Zielmiete/m²</span>
              <span className="info-value">{property.zielmiete}</span>
            </div>
          )}
          {property.baujahr && (
            <div className="info-card">
              <span className="info-label">Baujahr</span>
              <span className="info-value">{property.baujahr}</span>
            </div>
          )}
          {property.modernisierung && (
            <div className="info-card">
              <span className="info-label">Modernisierung</span>
              <span className="info-value">{property.modernisierung}</span>
            </div>
          )}
          {property.denkmalschutz && (
            <div className="info-card">
              <span className="info-label">Denkmalschutz</span>
              <span className="info-value">{property.denkmalschutz}</span>
            </div>
          )}
          {property.energietraeger && (
            <div className="info-card">
              <span className="info-label">Energieträger</span>
              <span className="info-value">{property.energietraeger}</span>
            </div>
          )}
          {property.energieklasse && (
            <div className="info-card">
              <span className="info-label">Energieklasse</span>
              <span className="info-value">{property.energieklasse}</span>
            </div>
          )}
          {property.stellplatzmiete && (
            <div className="info-card">
              <span className="info-label">Stellplatzmiete</span>
              <span className="info-value">{property.stellplatzmiete}</span>
            </div>
          )}
        </div>
      </div>

      {/* OVM-Checkliste */}
      <div className="property-checklist-section">
        <h2 className="section-title">Mietspiegelrelevante Merkmale</h2>
        {property.ovm_checkliste ? (
          <OvmChecklist
            checklist={property.ovm_checkliste}
            onChange={handleOvmChange}
          />
        ) : (
          <div className="no-checklist">
            <p>Keine OVM-Checkliste verfügbar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
