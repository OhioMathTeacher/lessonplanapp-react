


import './App.css';

import React, { useState } from 'react';

const revisionAreas = ["Technology", "Differentiation", "Discourse"];

function App() {
  // Track uploaded files for each lesson
  const [uploaded, setUploaded] = useState([false, false, false]);

  // Handle file upload
  const handleFileChange = (lessonIdx, e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newUploaded = [...uploaded];
      newUploaded[lessonIdx] = true;
      setUploaded(newUploaded);
    }
  };

  // Card height matches revision idea cards
  const cardHeight = 120;

  // Choose a background image from images folder
  const backgroundImage = require('./images/strategic-planning-a-group-works-at-a-table.webp');

  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh', padding: 24, fontFamily: 'sans-serif' }}>
      {/* Faint background image behind grid */}
      <div
        className="background-mural"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ textAlign: 'center' }}>Lesson Plan Revision App</h1>
        <div style={{ width: '100%', maxWidth: 1800, margin: '0 auto' }}>
          {/* 4-column grid: Uploads + 3 revision areas */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(3, 1fr)', gap: 16, alignItems: 'start' }}>
            {/* Top row: empty cell + column headers */}
            <div></div>
            {revisionAreas.map((area) => (
              <div key={area + '-header'} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{area}</div>
            ))}

            {/* 3 rows: upload card + 3 revision cards per lesson (flat array) */}
            {/* Generate all cards in a flat array to avoid unterminated JSX */}
            {(() => {
              const cards = [];
              for (let lessonIdx = 0; lessonIdx < 3; lessonIdx++) {
                // Upload card
                cards.push(
                  <div
                    key={`upload-${lessonIdx}`}
                    style={{
                      border: '1px solid #ccc',
                      borderRadius: 8,
                      minWidth: 180,
                      minHeight: cardHeight,
                      height: cardHeight,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#fff',
                      boxSizing: 'border-box',
                      marginBottom: 0,
                      opacity: uploaded[lessonIdx] ? 0.98 : 0.85,
                      transition: 'opacity 0.3s',
                    }}
                  >
                    <strong>Lesson {lessonIdx + 1}</strong>
                    <div style={{ margin: '8px 0' }}>
                      <input type="file" multiple onChange={e => handleFileChange(lessonIdx, e)} />
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>Upload PDFs, images, or DOCX</div>
                  </div>
                );
                // 3 revision idea cards
                for (let colIdx = 0; colIdx < revisionAreas.length; colIdx++) {
                  const area = revisionAreas[colIdx];
                  cards.push(
                    <div
                      key={`cell-${lessonIdx}-${colIdx}`}
                      style={{
                        background: '#e3eafc',
                        borderRadius: 8,
                        minHeight: cardHeight,
                        height: cardHeight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        color: uploaded[lessonIdx] ? '#111' : '#aaa',
                        fontStyle: uploaded[lessonIdx] ? 'normal' : 'italic',
                        fontWeight: uploaded[lessonIdx] ? 500 : 400,
                        opacity: uploaded[lessonIdx] ? 0.98 : 0.85,
                        transition: 'color 0.2s, opacity 0.3s',
                      }}
                    >
                      {uploaded[lessonIdx]
                        ? `Ideas for Lesson ${lessonIdx + 1} (${area})`
                        : 'High-level ideas will appear here. Click for more detail.'}
                    </div>
                  );
                }
              }
              return cards;
            })()}
          </div>

          {/* Resource Links */}
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <h3>Resource Links</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><strong>Technology:</strong> <a href="https://www.youcubed.org/" target="_blank" rel="noopener noreferrer">YouCubed</a></li>
            <li><strong>Differentiation:</strong> <a href="https://www.map.mathshell.org/" target="_blank" rel="noopener noreferrer">MARS Assessment Project</a></li>
            <li><strong>Discourse:</strong> <a href="https://www.nctm.org/" target="_blank" rel="noopener noreferrer">NCTM</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;
