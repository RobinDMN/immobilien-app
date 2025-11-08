import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { loadMagdeburgObjects } from './lib/ovm.js';
import { getStorageProvider, mergeAnswers } from './lib/storage/ovmStorage.js';
import { UserProvider, useUser } from './contexts/UserContext.jsx';
import LoginModal from './components/LoginModal.jsx';
import ObjectList from './components/ObjectList.jsx';
import ObjectDetail from './components/ObjectDetail.jsx';

// Mock-Daten werden nicht mehr direkt hier verwendet, sondern in loadMagdeburgObjects gekapselt.

// ============================================================================
// KOMPONENTE: App (Root)
// ============================================================================
/**
 * Hauptkomponente der Immobilien-Besichtigungs-App (intern).
 * Verwaltet den gesamten State für Objekte und Checklisten.
 */
function AppContent() {
  const { currentUser, userSlug, showLogin } = useUser();
  
  const [objekte, setObjekte] = useState([]);
  const [ovmData, setOvmData] = useState({});
  const [loading, setLoading] = useState(true);

  // Lade Objekte und gespeicherte Antworten beim Start
  useEffect(() => {
    if (!userSlug) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const loadedObjects = await loadMagdeburgObjects();
        setObjekte(loadedObjects);

        const storageProvider = getStorageProvider();
        const allSavedData = {};
        
        await Promise.all(
          loadedObjects.map(async (obj) => {
            try {
              const savedData = await storageProvider.load(userSlug, obj.id);
              if (savedData && Object.keys(savedData).length > 0) {
                allSavedData[obj.id] = savedData;
              }
            } catch (error) {
              console.warn(`Fehler beim Laden der OVM-Daten für Objekt ${obj.id}:`, error);
            }
          })
        );
        
        setOvmData(allSavedData);
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Objekte:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [userSlug]);

  /**
   * Handler für OVM-Checklisten-Änderungen.
   * Wird vom OvmChecklist-Komponenten aufgerufen.
   */
  const handleOvmUpdate = (objectId, updatedAnswers) => {
    setOvmData(prevData => ({
      ...prevData,
      [objectId]: updatedAnswers
    }));
    // Die Speicherung wird durch den StorageProvider (mit Debounce) gehandhabt
  };

  if (loading && !objekte.length) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Lade Objekte...
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="user-info">
          Angemeldet als: <strong>{currentUser}</strong>
          <button onClick={showLogin} className="btn-user-switch">
            Benutzer wechseln
          </button>
        </div>
      </header>
      <main className="app-content">
        <Routes>
          <Route 
            path="/" 
            element={<ObjectList objekte={objekte} />} 
          />
          <Route 
            path="/objekte/:id" 
            element={
              <ObjectDetail 
                objekte={objekte} 
                ovmData={ovmData}
                onUpdateOvm={handleOvmUpdate}
              />
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

/**
 * App-Wrapper mit UserProvider und Router
 */
function App() {
  return (
    <Router>
      <UserProvider>
        <AppContent />
        <LoginModal />
      </UserProvider>
    </Router>
  );
}

export default App;