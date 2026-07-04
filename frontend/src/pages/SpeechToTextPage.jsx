import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Copy, Trash2, Download, RefreshCw, AlertCircle, LayoutDashboard, LogOut, Menu, X, Check, Save, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español (Spain)' },
  { code: 'fr-FR', label: 'Français (France)' },
  { code: 'de-DE', label: 'Deutsch (Germany)' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'zh-CN', label: '中文 (Simplified Chinese)' },
  { code: 'ar-SA', label: 'العربية (Arabic)' },
];

function SpeechToTextPage({ onViewChange }) {
  const { logout } = useAuth();
  const { addToast } = useToast();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  
  const recognitionRef = useRef(null);
  const baseTranscriptRef = useRef('');
  const userEmail = localStorage.getItem('userEmail') || 'admin@example.com';

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('speech_transcripts');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }

    stopListening();

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang;

      baseTranscriptRef.current = transcript;
      setInterimTranscript('');

      rec.onresult = (event) => {
        let sessionFinalText = '';
        let lastFinalPhrase = '';

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            let phrase = result[0].transcript.trim();
            if (phrase) {
              // Strip prefix if the engine returns cumulative duplicates (common on Android/mobile)
              if (lastFinalPhrase && phrase.toLowerCase().startsWith(lastFinalPhrase.toLowerCase())) {
                phrase = phrase.substring(lastFinalPhrase.length).trim();
              }
              if (phrase) {
                sessionFinalText += (sessionFinalText ? ' ' : '') + phrase;
                lastFinalPhrase = result[0].transcript.trim();
              }
            }
          }
        }

        // Extract and clean interim result if present
        let interimText = '';
        if (event.results.length > 0) {
          const lastResult = event.results[event.results.length - 1];
          if (!lastResult.isFinal) {
            let phrase = lastResult[0].transcript.trim();
            if (lastFinalPhrase && phrase.toLowerCase().startsWith(lastFinalPhrase.toLowerCase())) {
              phrase = phrase.substring(lastFinalPhrase.length).trim();
            }
            interimText = phrase;
          }
        }

        const base = baseTranscriptRef.current.trim();
        const combinedFinal = base && sessionFinalText ? `${base} ${sessionFinalText}` : (base || sessionFinalText);
        setTranscript(combinedFinal);
        setInterimTranscript(interimText);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          addToast('Microphone access denied. Please enable microphone permissions.', 'error');
        } else if (event.error !== 'aborted') {
          addToast(`Speech recognition error: ${event.error}`, 'error');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
      addToast('Voice recording started...', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to start recording. Please try again.', 'error');
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      addToast('Voice recording stopped.', 'success');
    } else {
      startListening();
    }
  };

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleCopy = () => {
    const fullText = transcript + (interimTranscript ? ' ' + interimTranscript : '');
    if (!fullText.trim()) {
      addToast('Nothing to copy!', 'warning');
      return;
    }
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    addToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
    addToast('Transcript cleared.', 'success');
  };

  const saveToHistory = () => {
    const fullText = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
    if (!fullText) {
      addToast('Cannot save empty transcription.', 'warning');
      return;
    }

    const newItem = {
      id: Date.now(),
      text: fullText,
      lang: LANGUAGES.find(l => l.code === selectedLang)?.label || selectedLang,
      timestamp: new Date().toLocaleString()
    };

    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('speech_transcripts', JSON.stringify(updatedHistory));
    addToast('Saved to history!', 'success');
  };

  const deleteHistoryItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('speech_transcripts', JSON.stringify(updatedHistory));
    addToast('History item deleted.', 'success');
  };

  const downloadTxtFile = () => {
    const fullText = (transcript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
    if (!fullText) {
      addToast('No text to download.', 'warning');
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([fullText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcription_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addToast('Text file downloaded.', 'success');
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Top Navigation Header */}
      <header className="mobile-header">
        <button 
          className="menu-toggle-btn" 
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <Mic size={20} style={{ color: 'var(--color-primary)' }} />
          <span>SpeechScribe</span>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header-mobile">
          <div className="sidebar-logo">
            <Mic size={24} style={{ color: 'var(--color-primary)' }} />
            <span>SpeechScribe</span>
          </div>
          <button 
            className="menu-close-btn" 
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-logo-desktop">
          <Mic size={24} style={{ color: 'var(--color-primary)' }} />
          <span>SpeechScribe</span>
        </div>

        <ul className="sidebar-menu">
          <li>
            <div className="sidebar-link" onClick={() => { onViewChange('dashboard'); setIsSidebarOpen(false); }}>
              <LayoutDashboard size={18} />
              <span>Students Registry</span>
            </div>
          </li>
          <li>
            <div className="sidebar-link" onClick={() => { onViewChange('student-dashboard'); setIsSidebarOpen(false); }}>
              <CreditCard size={18} />
              <span>Student Portal</span>
            </div>
          </li>
          <li>
            <div className="sidebar-link active" onClick={() => setIsSidebarOpen(false)}>
              <Mic size={18} />
              <span>Speech to Text</span>
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-email" title={userEmail}>{userEmail}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile drawer */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Speech to Text Console</h1>
          <p className="dashboard-subtitle">Convert your spoken words into text in real-time, edit live, and export notes</p>
        </header>

        {/* Console Interface Grid */}
        <div className="stt-grid">
          {/* Main Recorder Section */}
          <div className="stt-main-card">
            {/* Lang Selection & Live Status */}
            <div className="stt-card-header">
              <div className="stt-lang-picker">
                <label className="form-label" htmlFor="lang-select">Language</label>
                <select 
                  id="lang-select"
                  className="form-input stt-select"
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  disabled={isListening}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>

              {isListening && (
                <div className="live-pulse-indicator">
                  <span className="pulse-dot"></span>
                  <span className="pulse-text">Listening...</span>
                </div>
              )}
            </div>

            {/* Visualizer & Mic Button Box */}
            <div className="stt-mic-container">
              {isListening && (
                <div className="audio-wave">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}

              <button 
                className={`stt-mic-btn ${isListening ? 'recording' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Stop recording' : 'Start voice recording'}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              
              <span className="stt-mic-hint">
                {isListening ? 'Click button to pause transcribing' : 'Click microphone to start speaking'}
              </span>
            </div>

            {/* Output Transcript Textarea */}
            <div className="stt-output-box">
              <label className="form-label">Live Output Transcript</label>
              <div className="stt-textarea-wrapper">
                <textarea
                  className="stt-textarea"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your transcribed text will appear here. You can also directly type and edit this transcript..."
                />
                {interimTranscript && (
                  <div className="stt-interim-preview">
                    {interimTranscript}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="stt-actions-panel">
              <button className="btn-cancel" onClick={handleClear} disabled={!transcript && !interimTranscript}>
                <RefreshCw size={14} />
                <span>Reset</span>
              </button>
              
              <button className="btn-cancel" onClick={saveToHistory} disabled={!transcript.trim() && !interimTranscript.trim()}>
                <Save size={14} />
                <span>Save Note</span>
              </button>

              <button className="btn-cancel" onClick={handleCopy} disabled={!transcript.trim() && !interimTranscript.trim()}>
                {copied ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button className="btn-add-student stt-download-btn" onClick={downloadTxtFile} disabled={!transcript.trim() && !interimTranscript.trim()}>
                <Download size={14} />
                <span>Download TXT</span>
              </button>
            </div>
          </div>

          {/* Sidebar History Panel */}
          <div className="stt-history-card">
            <h3 className="stt-history-title">Saved Notes & Transcripts</h3>
            <div className="stt-history-list">
              {history.length === 0 ? (
                <div className="stt-history-empty">
                  <AlertCircle size={28} className="empty-icon" />
                  <p className="empty-title" style={{ fontSize: '14px', marginBottom: '4px' }}>No saved transcripts</p>
                  <p className="empty-description" style={{ fontSize: '12px' }}>Your saved audio notes will be listed here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="stt-history-item">
                    <div className="stt-history-item-header">
                      <span className="stt-history-item-lang">{item.lang}</span>
                      <span className="stt-history-item-time">{item.timestamp}</span>
                    </div>
                    <p className="stt-history-item-text">{item.text}</p>
                    <div className="stt-history-item-actions">
                      <button 
                        className="action-btn edit" 
                        onClick={() => {
                          navigator.clipboard.writeText(item.text);
                          addToast('Transcript copied to clipboard!', 'success');
                        }}
                        title="Copy text"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => deleteHistoryItem(item.id)}
                        title="Delete from history"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SpeechToTextPage;
