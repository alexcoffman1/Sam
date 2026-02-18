import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import SamPage from './pages/SamPage';
import MemoryGarden from './pages/MemoryGarden';
import AdminPortal from './pages/AdminPortal';
import NavBar from './components/NavBar';
import ConnectToSamModal from './components/ConnectToSamModal';
import { Toaster } from './components/ui/sonner';

function App() {
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('sam-session-id');
    if (stored) return stored;
    const newId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('sam-session-id', newId);
    return newId;
  });

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="relative w-full h-full overflow-hidden" style={{ background: '#FFFFFF' }}>
        <NavBar onConnectClick={() => setIsConnectModalOpen(true)} />
        <Routes>
          <Route path="/" element={<SamPage sessionId={sessionId} />} />
          <Route path="/garden" element={<MemoryGarden sessionId={sessionId} />} />
          <Route path="/admin" element={<AdminPortal sessionId={sessionId} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ConnectToSamModal 
          isOpen={isConnectModalOpen} 
          onClose={() => setIsConnectModalOpen(false)} 
        />
        <Toaster position="bottom-right" theme="light" />
      </div>
    </BrowserRouter>
  );
}

export default App;
