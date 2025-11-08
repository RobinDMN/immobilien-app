import React from 'react';
import { useParams, Link } from 'react-router-dom';
import OvmChecklist from './OvmChecklist'; // Assuming OvmChecklist is in the same folder

const ObjectDetail = ({ objekte, onUpdateOvm, ovmData }) => {
  const { id } = useParams();
  const object = objekte.find((o) => o.id.toString() === id);

  if (!object) {
    return (
      <div>
        <h2>Objekt nicht gefunden</h2>
        <Link to="/">Zurück zur Liste</Link>
      </div>
    );
  }

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
        {/* Add Tabs here later if needed */}
        <OvmChecklist
          key={object.id}
          object={object}
          onUpdate={onUpdateOvm}
          initialState={ovmData[object.id] || {}}
        />
      </div>
    </div>
  );
};

export default ObjectDetail;
