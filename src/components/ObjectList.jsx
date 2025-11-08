import React from 'react';
import { Link } from 'react-router-dom';

const ObjectList = ({ objekte, onSelectObject }) => {
  return (
    <div className="object-list-container">
      <h1>Objekte</h1>
      <ul className="objekt-liste">
        {objekte.map((objekt) => (
          <li key={objekt.id}>
            <Link to={`/objekte/${objekt.id}`}>
              <div className="objekt-name">{objekt.name}</div>
              <div className="objekt-adresse">{objekt.adresse}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ObjectList;
