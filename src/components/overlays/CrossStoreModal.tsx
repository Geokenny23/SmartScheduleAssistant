import React, { useState } from 'react';
import type { ShiftCode } from '../../types.ts';
import { DAYS, NEARBY_STORES } from '../../data/seed.ts';

interface CrossStoreModalProps {
  day: number;
  shift: ShiftCode;
  onConfirm: (message: string) => void;
  onClose: () => void;
}

export const CrossStoreModal: React.FC<CrossStoreModalProps> = ({
  day,
  shift,
  onConfirm,
  onClose,
}) => {
  const [message, setMessage] = useState<string>(
    `Terjadi kekurangan staf pada hari ${DAYS[day]} Shift ${shift}. Tidak ada pengganti lokal yang memenuhi syarat operasional. Mohon bantuan koordinasi staf lintas toko.`,
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Minta Bantuan Lintas Toko</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Eskalasi kekurangan staf ke Area Supervisor (AS)
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-subtle btn-sm">✕</button>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
          <div>Kebutuhan: <strong>{DAYS[day]} · Shift {shift} (1 orang)</strong></div>
        </div>

        {/* Nearby Stores sample display */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
            TOKO TERDEKAT (DATA CONTOH INDIKATIF):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {NEARBY_STORES.map((st) => (
              <div
                key={st.name}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <span>{st.name} ({st.distance})</span>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>~{st.available} staf mungkin tersedia</span>
              </div>
            ))}
          </div>
        </div>

        {/* Message to AS */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            PESAN UNTUK AREA SUPERVISOR:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
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
        </div>

        <div style={{ padding: '10px', background: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-sm)', fontSize: '12px', marginBottom: '20px' }}>
          ℹ Keputusan alokasi staf sepenuhnya berada di tangan Area Supervisor. Tidak ada transfer otomatis.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
          <button
            type="button"
            onClick={() => {
              onConfirm(message);
              onClose();
            }}
            className="btn btn-primary"
          >
            Kirim Permintaan ke AS
          </button>
        </div>
      </div>
    </div>
  );
};
