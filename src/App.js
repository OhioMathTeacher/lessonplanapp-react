


import './App.css';

import React, { useState } from 'react';

const revisionAreas = ["Technology", "Differentiation", "Discourse"];

function App() {
  // Track uploaded files for each lesson (array of arrays)
  const [uploadedFiles, setUploadedFiles] = useState([[], [], []]);
  const [uploadStatus, setUploadStatus] = useState(['yellow', 'yellow', 'yellow']); // yellow=ready, green=success, red=fail
  const [modal, setModal] = useState({ open: false, lessonIdx: null, area: null });

  // Handle file upload (append files)
  const handleFileChange = (lessonIdx, e) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => {
          const updated = [...prev];
          updated[lessonIdx] = [...updated[lessonIdx], ...files];
          return updated;
        });
        setUploadStatus(prev => {
          const updated = [...prev];
          updated[lessonIdx] = 'green';
          return updated;
        });
      } catch {
        setUploadStatus(prev => {
          const updated = [...prev];
          updated[lessonIdx] = 'red';
          return updated;
        });
      }
    }
  };

  const uploadCardSize = 200;
  const cardRowHeight = 'calc((100vh - 120px) / 3)';

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
        {/* Removed the main title as requested */}
        <div style={{ width: '100%', margin: '0 auto' }}>
          {/* 4-column grid: Uploads + 3 revision areas */}
          <div style={{ display: 'grid', gridTemplateColumns: `auto ${uploadCardSize}px repeat(3, 1fr)`, gap: 16, alignItems: 'start' }}>
            {/* Top row: empty cell + column headers */}
            <div></div>
            <div></div>
            {revisionAreas.map((area) => (
              <div key={area + '-header'} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{area}</div>
            ))}

            {/* 3 rows: upload card + 3 revision cards per lesson (flat array) */}
            {/* Generate all cards in a flat array to avoid unterminated JSX */}
            {(() => {
              const cards = [];
              for (let lessonIdx = 0; lessonIdx < 3; lessonIdx++) {
                // Upload row: empty cell, Browse button (left), card (right)
                cards.push(
                  <React.Fragment key={`upload-row-${lessonIdx}`}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 120,
                      height: 64,
                      background: uploadStatus[lessonIdx] === 'green' ? '#4caf50' : uploadStatus[lessonIdx] === 'red' ? '#e53935' : '#ffd600',
                      color: '#222',
                      borderRadius: 16,
                      fontWeight: 700,
                      fontSize: 18,
                      cursor: 'pointer',
                      marginRight: 8,
                      border: '2px solid #bbb',
                      transition: 'background 0.2s',
                      boxShadow: '0 2px 8px #0002',
                      letterSpacing: 0.5,
                      userSelect: 'none',
                      position: 'relative',
                      padding: 0,
                    }}>
                      <input type="file" multiple style={{ display: 'none' }} onChange={e => handleFileChange(lessonIdx, e)} />
                      <span style={{
                        width: '100%',
                        textAlign: 'center',
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                        whiteSpace: 'pre-line',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        lineHeight: 1.1,
                      }}>
                        {uploadStatus[lessonIdx] === 'green' ? '✔\nUploaded' : uploadStatus[lessonIdx] === 'red' ? '✖\nError' : 'Upload\nLesson'}
                      </span>
                    </label>
                    {/* Upload card */}
                    <div
                      style={{
                        border: '1px solid #ccc',
                        borderRadius: 8,
                        minHeight: cardRowHeight,
                        height: cardRowHeight,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        background: '#fff',
                        boxSizing: 'border-box',
                        marginBottom: 0,
                        padding: 12,
                        flex: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Uploaded file names (truncated, word-wrapped) */}
                      {uploadedFiles[lessonIdx].length === 0 ? (
                        <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: 14 }}>No files uploaded.</span>
                      ) : (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', width: '100%' }}>
                          {uploadedFiles[lessonIdx].map((file, i) => (
                            <li key={i} style={{ fontSize: 14, wordBreak: 'break-all', marginBottom: 2 }}>
                              {file.name.length > 14 ? file.name.slice(0, 10) + '...' : file.name}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Upload PDFs, images, or DOCX</div>
                    </div>
                  </React.Fragment>
                );
                // 3 revision idea cards
                for (let colIdx = 0; colIdx < revisionAreas.length; colIdx++) {
                  const area = revisionAreas[colIdx];
                  const hasFiles = uploadedFiles[lessonIdx].length > 0;
                  cards.push(
                    <div
                      key={`cell-${lessonIdx}-${colIdx}`}
                      style={{
                        background: '#e3eafc',
                        borderRadius: 8,
                        minHeight: cardRowHeight,
                        height: cardRowHeight,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                        color: hasFiles ? '#111' : '#aaa',
                        fontStyle: hasFiles ? 'normal' : 'italic',
                        fontWeight: hasFiles ? 500 : 400,
                        opacity: hasFiles ? 0.98 : 0.85,
                        transition: 'color 0.2s, opacity 0.3s',
                        cursor: hasFiles ? 'pointer' : 'not-allowed',
                        marginBottom: 0,
                      }}
                      onClick={() => hasFiles && setModal({ open: true, lessonIdx, area })}
                    >
                      {hasFiles
                        ? `Click for ideas (${area})`
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
      {/* Simple modal for ideas */}
      {modal.open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setModal({ open: false, lessonIdx: null, area: null })}
        >
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, minHeight: 120, boxShadow: '0 2px 16px #0002', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Ideas for Lesson {modal.lessonIdx + 1} ({modal.area})</h2>
            <div style={{ fontSize: 16, color: '#333' }}>
              {/* Placeholder idea content */}
              This is where your revision ideas will appear!
            </div>
            <button style={{ position: 'absolute', top: 8, right: 12, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setModal({ open: false, lessonIdx: null, area: null })}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
