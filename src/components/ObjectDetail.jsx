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
        
        {/* Objektinformationen - 1:1 aus objekt_infos_geordnet.json */}
        <div className="objekt-info-list" style={{ 
          marginTop: '1.5rem',
          marginBottom: '2rem'
        }}>
          {/* 1. qm_flaeche */}
          {object.qm_flaeche != null && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Fläche (m²):</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.qm_flaeche}</span>
            </div>
          )}
          
          {/* 2. leerstand_qm */}
          {object.leerstand_qm != null && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Leerstand (m²):</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.leerstand_qm}</span>
            </div>
          )}
          
          {/* 3. wohneinheiten */}
          {object.wohneinheiten != null && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Wohneinheiten:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.wohneinheiten}</span>
            </div>
          )}
          
          {/* 4. gewerbeeinheiten */}
          {object.gewerbeeinheiten != null && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Gewerbeeinheiten:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.gewerbeeinheiten}</span>
            </div>
          )}
          
          {/* 5. stellplaetze */}
          {object.stellplaetze != null && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Stellplätze:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.stellplaetze}</span>
            </div>
          )}
          
          {/* 6. grundmiete */}
          {object.grundmiete != null && object.grundmiete !== '' && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Grundmiete:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.grundmiete}</span>
            </div>
          )}
          
          {/* 7. durchschnitt_miete_qm */}
          {object.durchschnitt_miete_qm != null && object.durchschnitt_miete_qm !== '' && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Ø-Miete/m²:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.durchschnitt_miete_qm}</span>
            </div>
          )}
          
          {/* 8. baujahr */}
          {object.baujahr != null && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Baujahr:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.baujahr}</span>
            </div>
          )}
          
          {/* 9. denkmalschutz */}
          {object.denkmalschutz != null && object.denkmalschutz !== '' && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Denkmalschutz:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.denkmalschutz}</span>
            </div>
          )}
          
          {/* 10. energieeffizienz */}
          {object.energieeffizienz != null && object.energieeffizienz !== '' && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Energieeffizienz:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.energieeffizienz}</span>
            </div>
          )}
          
          {/* 11. energietraeger */}
          {object.energietraeger != null && object.energietraeger !== '' && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Energieträger:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.energietraeger}</span>
            </div>
          )}
          
          {/* 12. baujahr_waermeerzeuger */}
          {object.baujahr_waermeerzeuger != null && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Baujahr Wärmeerzeuger:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.baujahr_waermeerzeuger}</span>
            </div>
          )}
          
          {/* 13. energieeffizienzklasse */}
          {object.energieeffizienzklasse != null && object.energieeffizienzklasse !== '' && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Energieeffizienzklasse:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.energieeffizienzklasse}</span>
            </div>
          )}
          
          {/* 14. bemerkung */}
          {object.bemerkung != null && object.bemerkung !== '' && (
            <div className="info-row" style={{ padding: '0.75rem 0', borderBottom: '1px solid #ecf0f1' }}>
              <span className="info-label" style={{ fontWeight: '600', color: '#34495e' }}>Bemerkung:</span>
              <span className="info-value" style={{ marginLeft: '0.5rem' }}>{object.bemerkung}</span>
            </div>
          )}
          
          {/* Fallback wenn keine Daten vorhanden */}
          {!object.qm_flaeche && !object.leerstand_qm && !object.wohneinheiten && 
           !object.gewerbeeinheiten && !object.stellplaetze && !object.grundmiete &&
           !object.durchschnitt_miete_qm && !object.baujahr && !object.denkmalschutz &&
           !object.energieeffizienz && !object.energietraeger && !object.baujahr_waermeerzeuger &&
           !object.energieeffizienzklasse && !object.bemerkung && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#95a5a6', fontStyle: 'italic' }}>
              Für dieses Objekt sind keine Detailinformationen verfügbar
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
