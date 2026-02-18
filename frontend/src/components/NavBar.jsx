import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flower2, Settings, MessageCircle, Plug } from 'lucide-react';

export default function NavBar({ onConnectClick }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav
      data-testid="navbar"
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3"
      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 70%, transparent 100%)' }}
    >
      <Link to="/" data-testid="nav-logo" className="flex items-center group">
        <div
          className="w-7 h-7 rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{
            background: 'radial-gradient(circle, #FFB6C1 0%, #FF6B9D 70%)',
            boxShadow: '0 0 12px 3px rgba(255,107,157,0.35)'
          }}
        />
      </Link>

      <div className="flex items-center gap-2">
        <NavLink to="/" icon={<MessageCircle size={14} />} label="Chat" isActive={isActive('/')} testId="nav-chat" />
        
        <button
          data-testid="connect-to-sam-btn"
          onClick={onConnectClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200"
          style={{
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB1 100%)',
            boxShadow: '0 2px 6px rgba(255,107,157,0.25)',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px'
          }}
        >
          <Plug size={12} />
          <span>Connect</span>
        </button>
        
        <NavLink to="/garden" icon={<Flower2 size={14} />} label="Garden" isActive={isActive('/garden')} testId="nav-garden" />
        <NavLink to="/admin" icon={<Settings size={14} />} label="Admin" isActive={isActive('/admin')} testId="nav-admin" />
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, isActive, testId }) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors duration-200"
      style={{
        color: isActive ? '#FF6B9D' : '#666666',
        background: isActive ? 'rgba(255,107,157,0.1)' : 'transparent',
        fontFamily: 'Manrope, sans-serif',
        fontSize: '13px'
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
