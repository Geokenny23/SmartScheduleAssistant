import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import { STORE_NAME, DAYS, NEARBY_STAFF } from '../data/seed.ts';

export const AsCrossStorePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, resolveEscalation, declineEscalation } = useApp();

  const escalation = id
    ? state.escalations.find((e) => e.id === id)
    : state.escalations.find((e) => e.status === 'pending');

  const [selectedStaffId, setSelectedStaffId] = useState<string>(NEARBY_STAFF[0]?.id ?? '');
  const [resolutionNote, setResolutionNote] = useState<string>('Staf perbantuan telah dikoordinasikan dengan toko asal untuk mengisi shift.');

  if (!escalation) {
    return (
      <div style={{ maxWidth: '700px', margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '32px' }}>
          <h3>Tidak Ada Permintaan Bantuan Lintas Toko Aktif</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: '16px' }}>
            Semua eskalasi bantuan telah ditindaklanjuti atau belum ada permohonan baru dari toko.
          </p>
          <button type="button" onClick={() => navigate('/as')} className="btn btn-secondary">
            Kembali ke Kotak Masuk
          </button>
        </div>
      </div>
    );
  }

  const selectedStaff = NEARBY_STAFF.find((s) => s.id === selectedStaffId);

  const handleResolve = () => {
    if (!selectedStaff) {
      alert('Pilih salah satu staf toko perbantuan.');
      return;
    }
    resolveEscalation(escalation.id, `${selectedStaff.name} (${selectedStaff.store})`, resolutionNote);
    navigate('/as');
  };

  const handleDecline = () => {
    declineEscalation(escalation.id);
    navigate('/as');
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/as')}
        className="btn btn-subtle btn-sm"
        style={{ marginBottom: '16px' }}
      >
        ← Kembali ke Kotak Masuk
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
          Permintaan Bantuan Lintas Toko
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Asal: <strong>{STORE_NAME}</strong> • Status: <span className="status-pill pending">● Menunggu Keputusan AS</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        {/* Request details card */}
        <div className="card">
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
            RINCIAN KEKURANGAN STAF:
          </h4>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>
            Kebutuhan: <strong>{DAYS[escalation.day]} · Shift {escalation.shift} ({escalation.count} orang)</strong>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-main)' }}>
            Pesan PS: "{escalation.message}"
          </div>
        </div>

        {/* Available Staff from nearby stores */}
        <div className="card">
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
            PILIH STAF TOKO TERDEKAT (DATA CONTOH INDIKATIF):
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {NEARBY_STAFF.map((staff) => {
              const isChecked = selectedStaffId === staff.id;
              return (
                <label
                  key={staff.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: isChecked ? 'var(--primary-light)' : 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="nearbyStaff"
                      checked={isChecked}
                      onChange={() => setSelectedStaffId(staff.id)}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {staff.name} ({staff.gender})
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {staff.position} • {staff.store}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 600 }}>
                    Tersedia
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Resolution note */}
        <div className="card">
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
            Catatan Arahan Penyelesaian:
          </h4>
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              fontSize: '13px',
              color: 'var(--text-main)',
              background: 'var(--bg-surface)',
            }}
          />
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
            ℹ Ini adalah prototipe konseptual untuk mendemonstrasikan penyelesaian eskalasi oleh AS. Tidak ada sinkronisasi multi-toko nyata.
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          onClick={handleDecline}
          className="btn btn-secondary"
          style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
        >
          Tolak Permintaan
        </button>

        <button
          type="button"
          onClick={handleResolve}
          className="btn btn-primary btn-lg"
          style={{ minWidth: '220px' }}
        >
          ✓ Tandai Terselesaikan
        </button>
      </div>
    </div>
  );
};
