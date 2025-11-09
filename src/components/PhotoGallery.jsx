import React, { useState, useEffect, useRef } from 'react';

// API-URL dynamisch bestimmen: Umgebungsvariable, sonst relativer Pfad (Proxy), sonst Fallback
let API_URL = '';
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
  API_URL = import.meta.env.VITE_API_URL;
} else if (window.location && window.location.origin) {
  // Relativer Pfad für Proxy-Setup (z.B. Vite-Proxy oder Nginx)
  API_URL = '';
} else {
  API_URL = 'http://localhost:3001';
}

const PhotoGallery = ({ objectId }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, [objectId]);

  const loadImages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/objects/${objectId}/images`);
      if (!response.ok) {
        throw new Error(`Image-API nicht erreichbar (${response.status}): ${API_URL}/api/objects/${objectId}/images`);
      }
      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to load images:', err);
      setError(`Fehler beim Laden der Bilder: ${err.message}`);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadImage(file);
  };

  const handleCameraCapture = () => {
    // Trigger file input with camera
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadImage = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/api/objects/${objectId}/images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload fehlgeschlagen (${response.status}): ${API_URL}/api/objects/${objectId}/images`);
      }

      const data = await response.json();
      // Reload images
      await loadImages();
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Fehler beim Hochladen des Bildes: ${err.message}`);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteImage = async (filename) => {
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/objects/${objectId}/images/${filename}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Reload images
      await loadImages();
    } catch (err) {
      console.error('Delete error:', err);
      setError('Fehler beim Löschen des Bildes');
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>Fotos</h3>

      {/* Camera/Upload Button */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          onClick={handleCameraCapture}
          disabled={uploading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: uploading ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📷 {uploading ? 'Wird hochgeladen...' : 'Foto aufnehmen'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#e74c3c',
          color: 'white',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          {images.map((image) => (
            <div
              key={image.filename}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #ecf0f1'
              }}
            >
              <img
                src={`${API_URL}${image.url}`}
                alt="Objekt Foto"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <button
                onClick={() => deleteImage(image.filename)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  backgroundColor: 'rgba(231, 76, 60, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>
          Noch keine Fotos vorhanden. Nehmen Sie das erste Foto auf!
        </p>
      )}
    </div>
  );
};

export default PhotoGallery;
