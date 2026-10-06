import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import { AS_NAME, STORE_NAME, DAYS } from '../data/seed.ts';
import { coverageTotals } from '../engine/core.ts';

export const AsInboxPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'schedules' | 'changes' | 'crossStore'>('schedules');

  const pendingSchedules = Object.values(state.weeks).filter((w) => w.status === 'pending');
  const pendingChanges = Object.values(state.weeks).filter((w) => w.status === 'change_pending');
  const pendingEscalations = state.escalations.filter((e) => e.status === 'pending');

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Kotak Masuk Persetujuan</h2>
        <p style={{ fontSize: '13px', marginTop: '2px' }}>
          Selamat datang, {AS_NAME} (Area Supervisor). Tinjau dan setujui usulan jadwal serta eskalasi staf dari toko binaan Anda.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px', paddingBottom: '4px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`btn ${activeTab === 'schedules' ? 'btn-primary' : 'btn-subtle'}`}
        >
          Pengajuan Jadwal ({pendingSchedules.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('changes')}
          className={`btn ${activeTab === 'changes' ? 'btn-primary' : 'btn-subtle'}`}
        >
          Perubahan Jadwal ({pendingChanges.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crossStore')}
          className={`btn ${activeTab === 'crossStore' ? 'btn-primary' : 'btn-subtle'}`}
        >
          Bantuan Lintas Toko ({pendingEscalations.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'schedules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingSchedules.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada jadwal baru yang sedang menunggu persetujuan.
            </div>
          ) : (
            pendingSchedules.map((w) => {
              const totals = w.main ? coverageTotals(w.main.roster, w.input) : { filled: 0, required: 0 };
              const exCount = Object.keys(w.exceptions).length;
              return (
                <div
                  key={w.id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{STORE_NAME}</h3>
                      <span className="status-pill pending">● Menunggu AS</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Periode: <strong>{w.label}</strong> • Dikirim: {w.submittedAt ? new Date(w.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                      <span>Cakupan: <strong>{totals.filled}/{totals.required}</strong></span>
                      {exCount > 0 && <span style={{ color: '#b45309' }}>⚑ {exCount} Pengecualian</span>}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/as/review/${w.id}`)}
                    className="btn btn-primary"
                  >
                    Tinjau Jadwal →
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'changes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingChanges.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada perubahan jadwal yang sedang menunggu persetujuan.
            </div>
          ) : (
            pendingChanges.map((w) => (
              <div
                key={w.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{STORE_NAME}</h3>
                    <span className="status-pill change_pending">● Perubahan Jadwal</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Periode: <strong>{w.label}</strong> • Pengajuan perubahan shift karena ketidakhadiran
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/as/review/${w.id}`)}
                  className="btn btn-primary"
                >
                  Tinjau Perubahan →
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'crossStore' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingEscalations.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tidak ada permintaan eskalasi bantuan lintas toko yang aktif.
            </div>
          ) : (
            pendingEscalations.map((esc) => (
              <div
                key={esc.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{STORE_NAME}</h3>
                    <span className="status-pill pending">● Permintaan Bantuan</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '4px' }}>
                    Kebutuhan: <strong>{DAYS[esc.day]} · Shift {esc.shift} ({esc.count} orang)</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Pesan PS: "{esc.message}"
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/as/cross-store/${esc.id}`)}
                  className="btn btn-primary"
                >
                  Tindak Lanjuti →
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
