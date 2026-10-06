import React, { useState } from 'react';

interface RegenerateModalProps {
  manualCount: number;
  onConfirm: (keepLocks: boolean) => void;
  onClose: () => void;
}

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
  manualCount,
  onConfirm,
  onClose,
}) => {
  const [keepLocks, setKeepLocks] = useState<boolean>(true);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Buat Usulan Jadwal Lain?</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Asisten akan menyusun proposal alternatif dari data tim yang sama
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-subtle btn-sm">✕</button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '16px' }}>
          Asisten akan mencari kombinasi penugasan baru yang tetap mematuhi seluruh batasan wajib dan ketersediaan karyawan.
        </p>

        {manualCount > 0 && (
          <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={keepLocks}
                onChange={(e) => setKeepLocks(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>
                Pertahankan <strong>{manualCount}</strong> sel yang telah Anda ubah secara manual
              </span>
            </label>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
          <button
            type="button"
            onClick={() => {
              onConfirm(keepLocks);
              onClose();
            }}
            className="btn btn-primary"
          >
            ↻ Buat Ulang Jadwal
          </button>
        </div>
      </div>
    </div>
  );
};
