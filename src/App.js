import './App.css';
import React, { useState, useRef, useEffect } from 'react';

const revisionAreas = ["Technology", "Differentiation", "Discourse"];

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const ribbonColors = { Technology: '#1565c0', Differentiation: '#2e7d32', Discourse: '#6a1b9a' };
const ribbonBgs   = { Technology: '#e3f2fd', Differentiation: '#e8f5e9', Discourse: '#f3e5f5' };

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([[], [], []]);
  const [uploadStatus, setUploadStatus]   = useState(['yellow', 'yellow', 'yellow']);
  const [ideas, setIdeas]                 = useState([null, null, null]);

  // Drawer state
  const [drawer, setDrawer] = useState({ open: false, area: '', summary: '', text: '' });

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const sendChat = async (messages) => {
    setChatLoading(true);
    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error('Chat error');
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRibbonClick = (idea, area, lessonIdx) => {
    // Open drawer with full idea text (editable)
    setDrawer({
      open: true,
      area,
      summary: idea.summary,
      text: `${idea.summary}\n\n${idea.detail}`,
    });

    // Add a ToddGPT greeting to chat (no API call needed)
    const greeting = `Hi! I see you're looking at a ${area} idea: "${idea.summary}". What would you like to explore further? You can paste text from the idea drawer below, or just ask me anything.`;
    setChatMessages(prev => [...prev, { role: 'assistant', content: greeting, isGreeting: true }]);
  };

  const clearChat = () => setChatMessages([]);

  const downloadChat = () => {
    const text = chatMessages
      .map(m => `${m.role === 'user' ? 'You' : 'ToddGPT'}: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tomgpt-chat-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const newMessages = [...chatMessages.filter(m => !m.isGreeting || m.role === 'user'), { role: 'user', content: chatInput.trim() }];
    // Build actual API messages (exclude greeting-only assistant messages that have no prior user context)
    const apiMessages = chatMessages.reduce((acc, msg) => {
      if (msg.isGreeting) return acc; // skip auto-greetings from API call history
      acc.push({ role: msg.role, content: msg.content });
      return acc;
    }, []);
    apiMessages.push({ role: 'user', content: chatInput.trim() });
    setChatMessages(prev => [...prev, { role: 'user', content: chatInput.trim() }]);
    setChatInput('');
    sendChat(apiMessages);
  };

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

  const handleFileChange = (lessonIdx, e) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const files = Array.from(e.target.files);
        setUploadedFiles(prev => { const u = [...prev]; u[lessonIdx] = [...u[lessonIdx], ...files]; return u; });
        setUploadStatus(prev => { const u = [...prev]; u[lessonIdx] = 'green'; return u; });
        generateIdeas(lessonIdx, files[0]);
      } catch {
        setUploadStatus(prev => { const u = [...prev]; u[lessonIdx] = 'red'; return u; });
      }
    }
  };

  const uploadCardSize = 200;
  const cardRowHeight  = 'calc((100vh - 230px) / 3)';
  const backgroundImage = require('./images/strategic-planning-a-group-works-at-a-table.webp');

  const CHAT_WIDTH = 340;
  const DRAWER_HEIGHT = 260;

  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Background */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0,
        backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.18, pointerEvents: 'none',
      }} />

      {/* Main layout */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100vh', overflow: 'hidden' }}>

        {/* Left: revision grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, minWidth: 0, paddingBottom: drawer.open ? DRAWER_HEIGHT + 16 : 24, transition: 'padding-bottom 0.3s' }}>
          <div className="lesson-grid" style={{ display: 'grid', gridTemplateColumns: `auto ${uploadCardSize}px repeat(3, 1fr)`, gap: 16, alignItems: 'start' }}>
            <div className="grid-header-cell"></div>
            <div className="grid-header-cell"></div>
            {revisionAreas.map(area => (
              <div key={area + '-header'} className="grid-header-cell column-header"
                style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>
                {area}
              </div>
            ))}

            {(() => {
              const cards = [];
              for (let lessonIdx = 0; lessonIdx < 3; lessonIdx++) {
                cards.push(
                  <React.Fragment key={`upload-row-${lessonIdx}`}>
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 120, height: 64,
                      background: uploadStatus[lessonIdx] === 'green' ? '#4caf50' : uploadStatus[lessonIdx] === 'red' ? '#e53935' : '#ffd600',
                      color: '#222', borderRadius: 16, fontWeight: 700, fontSize: 18, cursor: 'pointer',
                      marginRight: 8, border: '2px solid #bbb', transition: 'background 0.2s',
                      boxShadow: '0 2px 8px #0002', userSelect: 'none', position: 'relative', padding: 0,
                    }}>
                      <input type="file" multiple style={{ display: 'none' }} onChange={e => handleFileChange(lessonIdx, e)} />
                      <span style={{ width: '100%', textAlign: 'center', fontSize: 18, fontWeight: 700, pointerEvents: 'none', whiteSpace: 'pre-line', display: 'block', lineHeight: 1.1 }}>
                        {uploadStatus[lessonIdx] === 'green' ? '✔\nUploaded' : uploadStatus[lessonIdx] === 'red' ? '✖\nError' : 'Upload\nLesson'}
                      </span>
                    </label>
                    <div style={{
                      border: '1px solid #ccc', borderRadius: 8,
                      minHeight: cardRowHeight, height: cardRowHeight, width: '100%',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
                      background: '#fff', boxSizing: 'border-box', padding: 12, overflow: 'hidden',
                    }}>
                      {uploadedFiles[lessonIdx].length === 0
                        ? <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: 14 }}>No files uploaded.</span>
                        : <ul style={{ margin: 0, padding: 0, listStyle: 'none', width: '100%' }}>
                            {uploadedFiles[lessonIdx].map((file, i) => (
                              <li key={i} style={{ fontSize: 14, wordBreak: 'break-all', marginBottom: 2 }}>
                                {file.name.length > 14 ? file.name.slice(0, 10) + '...' : file.name}
                              </li>
                            ))}
                          </ul>
                      }
                      <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>Upload PDFs, images, or DOCX</div>
                    </div>
                  </React.Fragment>
                );

                for (let colIdx = 0; colIdx < revisionAreas.length; colIdx++) {
                  const area        = revisionAreas[colIdx];
                  const hasFiles    = uploadedFiles[lessonIdx].length > 0;
                  const lessonIdeas = ideas[lessonIdx];
                  const isLoading   = lessonIdeas === 'loading';
                  const isError     = lessonIdeas === 'error';
                  const areaIdeas   = lessonIdeas && typeof lessonIdeas === 'object' ? lessonIdeas[area.toLowerCase()] : null;
                  const hasIdeas    = Array.isArray(areaIdeas) && areaIdeas.length > 0;

                  cards.push(
                    <div key={`cell-${lessonIdx}-${colIdx}`}
                      className="revision-card" data-area={area}
                      style={{
                        background: '#f7f9fc', borderRadius: 8,
                        minHeight: cardRowHeight, height: cardRowHeight, width: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: hasIdeas ? 'stretch' : 'center',
                        justifyContent: 'center',
                        gap: hasIdeas ? 8 : 0, fontSize: 15,
                        color: hasFiles ? '#555' : '#aaa',
                        fontStyle: hasFiles ? 'normal' : 'italic',
                        opacity: hasFiles ? 1 : 0.85,
                        padding: hasIdeas ? '12px 10px' : 0,
                        overflowY: hasIdeas ? 'auto' : 'hidden',
                        boxSizing: 'border-box',
                      }}
                    >
                      {isLoading
                        ? <span style={{ textAlign: 'center' }}>⏳ Generating ideas...</span>
                        : isError
                        ? <span style={{ textAlign: 'center' }}>⚠️ Could not generate ideas. Try uploading again.</span>
                        : hasIdeas
                        ? areaIdeas.map((idea, i) => (
                            <button key={i} className="ribbon-btn"
                              onClick={() => handleRibbonClick(idea, area, lessonIdx)}
                              style={{
                                display: 'block', width: '100%', padding: '10px 14px',
                                border: `2px solid ${ribbonColors[area]}`,
                                borderRadius: 8, background: ribbonBgs[area],
                                color: ribbonColors[area], fontWeight: 700, fontSize: 14,
                                cursor: 'pointer', textAlign: 'left', lineHeight: 1.3,
                                transition: 'transform 0.1s, box-shadow 0.15s',
                                boxShadow: '0 1px 4px #0001',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 3px 12px #0002'; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 1px 4px #0001'; }}
                            >
                              {idea.summary}
                            </button>
                          ))
                        : 'Upload a lesson plan to get revision ideas.'}
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

        {/* Right: ToddGPT chat panel */}
        <div className="chat-panel" style={{
          width: CHAT_WIDTH, minWidth: 280, display: 'flex', flexDirection: 'column',
          background: '#1a1a2e', color: '#eee', height: '100vh',
          boxShadow: '-4px 0 20px #0004',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #333',
            background: '#16213e', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <img
              src={require('./images/toddicon.jpg')}
              alt="TomBot"
              style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #4a7fa5', flexShrink: 0 }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>ToddGPT</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>Teaching Others Matters</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button onClick={downloadChat} disabled={chatMessages.length === 0} title="Download chat" style={{
                background: 'none', border: '1px solid #444', borderRadius: 6,
                color: chatMessages.length === 0 ? '#444' : '#aaa', cursor: chatMessages.length === 0 ? 'default' : 'pointer',
                fontSize: 11, padding: '3px 7px',
              }}>⬇ Save</button>
              <button onClick={clearChat} disabled={chatMessages.length === 0} title="Clear chat" style={{
                background: 'none', border: '1px solid #444', borderRadius: 6,
                color: chatMessages.length === 0 ? '#444' : '#e57373', cursor: chatMessages.length === 0 ? 'default' : 'pointer',
                fontSize: 11, padding: '3px 7px',
              }}>✕ Clear</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {chatMessages.length === 0 && (
              <div style={{ color: '#666', fontStyle: 'italic', fontSize: 13, textAlign: 'center', marginTop: 40, lineHeight: 1.6 }}>
                No conversation yet.<br />Click a ribbon button on the left to get started.
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: msg.role === 'user' ? '#0f3460' : '#2a2a4a',
                color: '#eee', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                boxShadow: '0 2px 8px #0003', textAlign: 'left',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4, fontWeight: 700, letterSpacing: 1 }}>TODDGPT</div>
                )}
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', background: '#2a2a4a', color: '#888', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', fontSize: 13 }}>
                <span style={{ letterSpacing: 3 }}>···</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleChatSubmit} style={{
            padding: '12px 14px', borderTop: '1px solid #333', background: '#16213e', display: 'flex', gap: 8,
          }}>
            <input
              type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
              placeholder="Ask a follow-up…" disabled={chatLoading}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid #444', background: '#2a2a4a', color: '#eee', fontSize: 13, outline: 'none' }}
            />
            <button type="submit" disabled={chatLoading || !chatInput.trim()} style={{
              background: chatLoading || !chatInput.trim() ? '#333' : '#0f3460',
              color: '#eee', border: 'none', borderRadius: 20, padding: '10px 16px',
              cursor: chatLoading || !chatInput.trim() ? 'default' : 'pointer',
              fontWeight: 700, fontSize: 13, transition: 'background 0.2s',
            }}>Send</button>
          </form>
        </div>
      </div>

      {/* Bottom drawer — idea viewer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: CHAT_WIDTH,
        height: drawer.open ? DRAWER_HEIGHT : 36,
        background: '#fff', boxShadow: '0 -4px 20px #0003',
        transition: 'height 0.3s ease', zIndex: 100,
        display: 'flex', flexDirection: 'column',
        borderTop: `3px solid ${ribbonColors[drawer.area] || '#ccc'}`,
      }}>
        {/* Drawer handle / tab */}
        <div
          onClick={() => setDrawer(d => ({ ...d, open: !d.open }))}
          style={{
            height: 36, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
            cursor: 'pointer', background: ribbonColors[drawer.area] || '#555',
            color: '#fff', userSelect: 'none', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13 }}>{drawer.open ? '▼' : '▲'}</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            {drawer.area ? `${drawer.area} Idea` : 'Idea Viewer'}
          </span>
          {drawer.summary && (
            <span style={{ fontSize: 12, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              — {drawer.summary}
            </span>
          )}
          {drawer.open && drawer.text && (
            <button
              onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(drawer.text); }}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 6, color: '#fff', fontSize: 11, padding: '2px 8px', cursor: 'pointer',
              }}
            >Copy</button>
          )}
        </div>

        {/* Drawer content — editable textarea */}
        {drawer.open && (
          <textarea
            value={drawer.text}
            onChange={e => setDrawer(d => ({ ...d, text: e.target.value }))}
            style={{
              flex: 1, padding: '12px 16px', border: 'none', outline: 'none', resize: 'none',
              fontSize: 14, lineHeight: 1.7, fontFamily: 'sans-serif', color: '#222',
              background: '#fafafa',
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
