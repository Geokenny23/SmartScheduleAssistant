import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext.tsx';
import { STORE_NAME, PS_NAME, AS_NAME } from '../../data/seed.ts';

export const TopBar: React.FC = () => {
  const { state, setRole, toggleTheme, resetState } = useApp();
  const navigate = useNavigate();
  const isPS = state.role === 'PS';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '17px', color: 'var(--primary)' }}>
          <span style={{ fontSize: '20px' }}>✦</span>
          <span>Smart Schedule</span>
        </div>
        <span style={{ color: 'var(--border-medium)', fontSize: '18px' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{STORE_NAME}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ({isPS ? `PS: ${PS_NAME}` : `AS: ${AS_NAME}`})
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Role Switcher Pill */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-full)',
            padding: '3px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setRole('PS');
              navigate('/ps');
            }}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              background: isPS ? 'var(--primary)' : 'transparent',
              color: isPS ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            Pimpinan Shift (PS)
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('AS');
              navigate('/as');
            }}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              background: !isPS ? 'var(--primary)' : 'transparent',
              color: !isPS ? '#ffffff' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
            }}
          >
            Area Supervisor (AS)
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-subtle btn-sm"
          title="Ubah tema gelap / terang"
        >
          {state.theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Reset Prototype State */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset semua data prototipe ke kondisi awal?')) {
              resetState();
            }
          }}
          className="btn btn-subtle btn-sm"
          title="Reset data contoh"
          style={{ color: 'var(--text-muted)' }}
        >
          ↻ Reset Demo
        </button>
      </div>
    </header>
  );
};
