import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flower2, Settings, MessageCircle } from 'lucide-react';

export default function NavBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav
      data-testid="navbar"
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-4"
      style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 70%, transparent 100%)' }}
    >
      <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
        <div
          className="w-7 h-7 rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{
            background: 'radial-gradient(circle, #FFB6C1 0%, #FF6B9D 70%)',
            boxShadow: '0 0 16px 4px rgba(255,107,157,0.4)'
          }}
        />
        <span
          className="text-lg font-semibold tracking-wide"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A1A' }}
        >
          Sam
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <NavLink to="/" icon={<MessageCircle size={16} />} label="Chat" isActive={isActive('/')} testId="nav-chat" />
        <NavLink to="/garden" icon={<Flower2 size={16} />} label="Garden" isActive={isActive('/garden')} testId="nav-garden" />
        <NavLink to="/admin" icon={<Settings size={16} />} label="Admin" isActive={isActive('/admin')} testId="nav-admin" />
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, isActive, testId }) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors duration-200"
      style={{
        color: isActive ? '#FF6B9D' : '#666666',
        background: isActive ? 'rgba(255,107,157,0.12)' : 'transparent',
        border: isActive ? '1px solid rgba(255,107,157,0.25)' : '1px solid transparent',
        fontFamily: 'Manrope, sans-serif'
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
