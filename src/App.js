


import './App.css';

import React, { useState } from 'react';

const revisionAreas = ["Technology", "Differentiation", "Discourse"];

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function App() {
  // Track uploaded files for each lesson (array of arrays)
  const [uploadedFiles, setUploadedFiles] = useState([[], [], []]);
  const [uploadStatus, setUploadStatus] = useState(['yellow', 'yellow', 'yellow']); // yellow=ready, green=success, red=fail
  const [modal, setModal] = useState({ open: false, lessonIdx: null, area: null, summary: null, detail: null });
  // null = no file yet, 'loading' = generating, 'error' = failed, object = ideas ready
  const [ideas, setIdeas] = useState([null, null, null]);

  const generateIdeas = async (lessonIdx, file) => {
    setIdeas(prev => { const u = [...prev]; u[lessonIdx] = 'loading'; return u; });
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData: base64, mimeType: file.type || 'application/pdf' }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setIdeas(prev => { const u = [...prev]; u[lessonIdx] = data; return u; });
    } catch {
      setIdeas(prev => { const u = [...prev]; u[lessonIdx] = 'error'; return u; });
    }
  };

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
        generateIdeas(lessonIdx, files[0]);
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
  const cardRowHeight = 'calc((100vh - 230px) / 3)';

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
          <div className="lesson-grid" style={{ display: 'grid', gridTemplateColumns: `auto ${uploadCardSize}px repeat(3, 1fr)`, gap: 16, alignItems: 'start' }}>
            {/* Top row: empty cell + column headers */}
            <div className="grid-header-cell"></div>
            <div className="grid-header-cell"></div>
            {revisionAreas.map((area) => (
              <div key={area + '-header'} className="grid-header-cell column-header" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>{area}</div>
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
                const ribbonColors = { Technology: '#1565c0', Differentiation: '#2e7d32', Discourse: '#6a1b9a' };
                const ribbonBgs = { Technology: '#e3f2fd', Differentiation: '#e8f5e9', Discourse: '#f3e5f5' };
                for (let colIdx = 0; colIdx < revisionAreas.length; colIdx++) {
                  const area = revisionAreas[colIdx];
                  const hasFiles = uploadedFiles[lessonIdx].length > 0;
                  const lessonIdeas = ideas[lessonIdx];
                  const isLoading = lessonIdeas === 'loading';
                  const isError = lessonIdeas === 'error';
                  const areaIdeas = lessonIdeas && typeof lessonIdeas === 'object'
                    ? lessonIdeas[area.toLowerCase()] : null;
                  const hasIdeas = Array.isArray(areaIdeas) && areaIdeas.length > 0;

                  cards.push(
                    <div
                      key={`cell-${lessonIdx}-${colIdx}`}
                      className="revision-card"
                      data-area={area}
                      style={{
                        background: '#f7f9fc',
                        borderRadius: 8,
                        minHeight: cardRowHeight,
                        height: cardRowHeight,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: hasIdeas ? 'stretch' : 'center',
                        justifyContent: hasIdeas ? 'center' : 'center',
                        gap: hasIdeas ? 8 : 0,
                        fontSize: 15,
                        color: hasFiles ? '#555' : '#aaa',
                        fontStyle: hasFiles ? 'normal' : 'italic',
                        opacity: hasFiles ? 1 : 0.85,
                        transition: 'color 0.2s, opacity 0.3s',
                        padding: hasIdeas ? '12px 10px' : 0,
                        overflowY: hasIdeas ? 'auto' : 'hidden',
                        boxSizing: 'border-box',
                      }}
                    >
                      {isLoading ? <span style={{ textAlign: 'center' }}>⏳ Generating ideas...</span> :
                       isError ? <span style={{ textAlign: 'center' }}>⚠️ Could not generate ideas. Try uploading again.</span> :
                       hasIdeas ? areaIdeas.map((idea, i) => (
                        <button
                          key={i}
                          className="ribbon-btn"
                          onClick={() => setModal({ open: true, lessonIdx, area, summary: idea.summary, detail: idea.detail })}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 14px',
                            border: `2px solid ${ribbonColors[area]}`,
                            borderRadius: 8,
                            background: ribbonBgs[area],
                            color: ribbonColors[area],
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            textAlign: 'left',
                            lineHeight: 1.3,
                            transition: 'transform 0.1s, box-shadow 0.15s',
                            boxShadow: '0 1px 4px #0001',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 3px 12px #0002'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 1px 4px #0001'; }}
                        >
                          {idea.summary}
                        </button>
                       )) :
                       'Upload a lesson plan to get revision ideas.'}
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
          onClick={() => setModal({ open: false, lessonIdx: null, area: null, summary: null, detail: null })}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', maxWidth: 540, width: '90vw', boxShadow: '0 8px 32px #0003', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, color: '#888', marginBottom: 4 }}>
              Lesson {modal.lessonIdx + 1} — {modal.area}
            </div>
            <h2 style={{ marginTop: 0, fontSize: 22, color: '#222', lineHeight: 1.3 }}>
              {modal.summary || 'Revision Idea'}
            </h2>
            <div style={{ fontSize: 16, color: '#444', lineHeight: 1.7, marginTop: 16 }}>
              {modal.detail || 'No details available.'}
            </div>
            <button style={{ position: 'absolute', top: 12, right: 16, fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#999' }} onClick={() => setModal({ open: false, lessonIdx: null, area: null, summary: null, detail: null })}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
