import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../store/AppContext.tsx';

export const Sidebar: React.FC = () => {
  const { state } = useApp();
  const isPS = state.role === 'PS';

  const w42 = state.weeks.w42;
  const w42Path = w42.status === 'empty' ? '/ps/week/w42/setup' : '/ps/week/w42';

  const pendingApprovalsCount = Object.values(state.weeks).filter((w) => w.status === 'pending' || w.status === 'change_pending').length;
  const pendingEscalationsCount = state.escalations.filter((e) => e.status === 'pending').length;

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
    background: isActive ? 'var(--primary-light)' : 'transparent',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    marginBottom: '4px',
  });

  return (
    <aside className="sidebar">
      <div style={{ padding: '20px 16px 12px 16px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '8px' }}>
          Menu {isPS ? 'Pimpinan Shift' : 'Area Supervisor'}
        </div>
      </div>

      <nav style={{ padding: '0 12px', flex: 1 }}>
        {isPS ? (
          <>
            <NavLink to="/ps" end style={linkStyle}>
              <span>⌂</span>
              <span>Beranda</span>
            </NavLink>

            <NavLink to={w42Path} style={linkStyle}>
              <span>▦</span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Jadwal Mgg Depan</span>
                {w42.status === 'draft' && (
                  <span style={{ fontSize: '10px', background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: '4px' }}>Draf</span>
                )}
                {w42.status === 'pending' && (
                  <span style={{ fontSize: '10px', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '1px 6px', borderRadius: '4px' }}>Tinjauan</span>
                )}
              </div>
            </NavLink>

            <NavLink to="/ps/week/w41" style={linkStyle}>
              <span>▦</span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Jadwal Mgg Ini</span>
                <span style={{ fontSize: '10px', background: 'var(--success-bg)', color: 'var(--success)', padding: '1px 6px', borderRadius: '4px' }}>Aktif</span>
              </div>
            </NavLink>

            <NavLink to="/ps/team" style={linkStyle}>
              <span>☺</span>
              <span>Tim & Batasan</span>
            </NavLink>

            <NavLink to="/ps/requests" style={linkStyle}>
              <span>⇪</span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Eskalasi Saya</span>
                {pendingEscalationsCount > 0 && (
                  <span style={{ fontSize: '10px', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {pendingEscalationsCount}
                  </span>
                )}
              </div>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/as" end style={linkStyle}>
              <span>☰</span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Kotak Masuk</span>
                {pendingApprovalsCount > 0 && (
                  <span style={{ fontSize: '10px', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </div>
            </NavLink>

            <NavLink to="/as/cross-store" style={linkStyle}>
              <span>⇄</span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Bantuan Lintas Toko</span>
                {pendingEscalationsCount > 0 && (
                  <span style={{ fontSize: '10px', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {pendingEscalationsCount}
                  </span>
                )}
              </div>
            </NavLink>
          </>
        )}

        <div style={{ margin: '16px 0', borderTop: '1px solid var(--border-subtle)' }} />

        <NavLink to="/about" style={linkStyle}>
          <span>ⓘ</span>
          <span>Tentang Prototipe</span>
        </NavLink>
      </nav>

      {/* Role Notice at bottom */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Mode Aktif: <strong style={{ color: 'var(--text-main)' }}>{isPS ? 'Pimpinan Shift' : 'Area Supervisor'}</strong>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
          Gunakan tombol di pojok kanan atas untuk berpindah peran.
        </div>
      </div>
    </aside>
  );
};
