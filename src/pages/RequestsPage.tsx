import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import { DAYS } from '../data/seed.ts';

export const RequestsPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Eskalasi & Pengajuan Saya</h2>
        <p style={{ fontSize: '13px', marginTop: '2px' }}>
          Daftar permintaan bantuan lintas toko dan status pengajuan jadwal ke Area Supervisor.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Cross Store Escalations Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '14px' }}>
            Permintaan Bantuan Lintas Toko ({state.escalations.length})
          </div>

          {state.escalations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Belum ada eskalasi bantuan lintas toko yang diajukan.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px' }}>Waktu</th>
                  <th style={{ padding: '10px 16px' }}>Kebutuhan Shift</th>
                  <th style={{ padding: '10px 16px' }}>Pesan / Alasan</th>
                  <th style={{ padding: '10px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.escalations.map((esc) => (
                  <tr key={esc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '12px' }}>
                      {new Date(esc.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {DAYS[esc.day]} · Shift {esc.shift} ({esc.count} org)
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', maxWidth: '280px' }}>
                      {esc.message}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {esc.status === 'pending' && (
                        <span className="status-pill pending">● Menunggu AS</span>
                      )}
                      {esc.status === 'resolved' && (
                        <div>
                          <span className="status-pill approved">✓ Selesai</span>
                          <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '2px' }}>
                            {esc.helperName}: {esc.resolution}
                          </div>
                        </div>
                      )}
                      {esc.status === 'declined' && (
                        <span className="status-pill rejected">✕ Ditolak</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Schedule Submissions Summary */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '14px' }}>
            Riwayat Status Jadwal Mingguan
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px' }}>Minggu</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
                <th style={{ padding: '10px 16px' }}>Catatan Terakhir</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(state.weeks).map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {w.label}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`status-pill ${w.status}`}>
                      {w.status === 'empty' && '○ Belum dibuat'}
                      {w.status === 'draft' && '● Draf'}
                      {w.status === 'pending' && '● Menunggu AS'}
                      {w.status === 'approved' && '● Disetujui AS'}
                      {w.status === 'change_pending' && '● Perubahan Menunggu AS'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: '300px' }}>
                    {w.lastOutcome?.comment || (w.note ? w.note.slice(0, 60) + '...' : '-')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => navigate(w.status === 'empty' ? `/ps/week/${w.id}/setup` : `/ps/week/${w.id}`)}
                      className="btn btn-secondary btn-sm"
                    >
                      Buka Jadwal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
