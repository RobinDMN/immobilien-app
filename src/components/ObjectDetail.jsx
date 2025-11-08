import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import OvmChecklist from './OvmChecklist';

const ObjectDetail = ({ objekte, onUpdateOvm, ovmData }) => {
  const { id } = useParams();
  const [object, setObject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[ObjectDetail] Lade Objekt mit ID:', id);
    console.log('[ObjectDetail] Verfügbare Objekte:', objekte.length);
    
    if (!id) {
      setError('Keine Objekt-ID in der URL gefunden');
      setLoading(false);
      return;
    }

    if (!objekte || objekte.length === 0) {
      console.log('[ObjectDetail] Warte auf Objekte...');
      setLoading(true);
      return;
    }

    const foundObject = objekte.find((o) => o.id.toString() === id);
    
    if (!foundObject) {
      console.error('[ObjectDetail] Objekt nicht gefunden:', id);
      setError(`Objekt mit ID "${id}" wurde nicht gefunden`);
      setLoading(false);
      return;
    }

    console.log('[ObjectDetail] Objekt gefunden:', foundObject.name);
    setObject(foundObject);
    setError(null);
    setLoading(false);
  }, [id, objekte]);

  // Loading State
  if (loading) {
    return (
      <div className="object-detail-container">
        <div className="sticky-header">
          <Link to="/" className="back-button">
            &larr; Zurück
          </Link>
        </div>
        <div className="object-detail-content">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p>Lade Objektdaten...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !object) {
    return (
      <div className="object-detail-container">
        <div className="sticky-header">
          <Link to="/" className="back-button">
            &larr; Zurück zur Liste
          </Link>
        </div>
        <div className="object-detail-content">
          <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
            <h2>❌ Fehler beim Laden</h2>
            <p>{error || 'Objekt nicht gefunden'}</p>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/" style={{ 
                display: 'inline-block', 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#3498db', 
                color: 'white', 
                borderRadius: '4px',
                textDecoration: 'none'
              }}>
                Zurück zur Liste
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success State - Render Object Details
  return (
    <div className="object-detail-container">
      <div className="sticky-header">
        <Link to="/" className="back-button">
          &larr; Zurück
        </Link>
        <h2>{object.name}</h2>
      </div>
      <div className="object-detail-content">
        <p>{object.adresse}</p>
        
        {/* Objektinformationen */}
        <div className="objekt-info-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginTop: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* 1. Grundmiete */}
          {object.grundmiete && (
            <div className="info-item">
              <span className="info-label">Grundmiete:</span>
              <span className="info-value">{object.grundmiete}</span>
            </div>
          )}
          
          {/* 2. Ø-Miete pro m² (durchschnittlich) */}
          {object.durchschnitt_miete_qm && (
            <div className="info-item">
              <span className="info-label">Ø-Miete/m²:</span>
              <span className="info-value">{object.durchschnitt_miete_qm}</span>
            </div>
          )}
          
          {/* 3. Energieeffizienzklasse */}
          {object.energieklasse && (
            <div className="info-item">
              <span className="info-label">Energieklasse:</span>
              <span className="info-value">{object.energieklasse}</span>
            </div>
          )}
          
          {/* 4. Vermietbare Fläche (m²) */}
          {object.vermietbare_flaeche_qm && (
            <div className="info-item">
              <span className="info-label">Vermietbare Fläche:</span>
              <span className="info-value">{object.vermietbare_flaeche_qm} m²</span>
            </div>
          )}
          
          {/* 5. Wohneinheiten */}
          {object.wohneinheiten !== undefined && object.wohneinheiten !== null && (
            <div className="info-item">
              <span className="info-label">Wohneinheiten:</span>
              <span className="info-value">{object.wohneinheiten}</span>
            </div>
          )}
          
          {/* 6. Gewerbeeinheiten */}
          {object.gewerbeeinheiten !== undefined && object.gewerbeeinheiten !== null && (
            <div className="info-item">
              <span className="info-label">Gewerbeeinheiten:</span>
              <span className="info-value">{object.gewerbeeinheiten}</span>
            </div>
          )}
          
          {/* 7. Stellplätze */}
          {object.stellplaetze !== undefined && object.stellplaetze !== null && (
            <div className="info-item">
              <span className="info-label">Stellplätze:</span>
              <span className="info-value">{object.stellplaetze}</span>
            </div>
          )}
          
          {/* 8. Energieträger */}
          {object.energietraeger && (
            <div className="info-item">
              <span className="info-label">Energieträger:</span>
              <span className="info-value">{object.energietraeger}</span>
            </div>
          )}
          
          {/* Baujahr (optional) */}
          {object.baujahr && (
            <div className="info-item">
              <span className="info-label">Baujahr:</span>
              <span className="info-value">{object.baujahr}</span>
            </div>
          )}
        </div>

        {/* OVM Checkliste */}
        {object.ovm_checkliste ? (
          <OvmChecklist
            key={object.id}
            object={object}
            onUpdate={onUpdateOvm}
            initialState={ovmData[object.id] || {}}
          />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#95a5a6' }}>
            <p>Für dieses Objekt ist keine OVM-Checkliste verfügbar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObjectDetail;
