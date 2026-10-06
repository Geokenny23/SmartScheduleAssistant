import React from 'react';
import type { Issue } from '../../types.ts';
import { summarize } from '../../engine/validate.ts';

interface ValidationModalProps {
  issues: Issue[];
  onProceedSubmit: () => void;
  onClose: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  issues,
  onProceedSubmit,
  onClose,
}) => {
  const sum = summarize(issues);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Hasil Validasi Jadwal</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Pengecekan kepatuhan terhadap seluruh aturan operasional toko
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-subtle btn-sm">✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', background: sum.errors.length === 0 ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: sum.errors.length === 0 ? 'var(--success)' : 'var(--danger)' }}>
              {sum.errors.length === 0 ? '✓ Semua aturan wajib terpenuhi' : `✕ ${sum.errors.length} Pelanggaran wajib belum teratasi`}
            </span>
          </div>

          {sum.exceptions.length > 0 && (
            <div style={{ padding: '10px', background: '#fef3c7', borderRadius: 'var(--radius-md)', fontSize: '12px', color: '#92400e' }}>
              ⚑ {sum.exceptions.length} Pengecualian operasional telah dicatat dengan alasan.
            </div>
          )}

          {sum.shortages.length > 0 && (
            <div style={{ padding: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-main)' }}>
              ⚠ {sum.shortages.length} Kekurangan staf terdeteksi.
              {sum.openShortages.length > 0 ? (
                <div style={{ color: 'var(--danger)', marginTop: '2px' }}>
                  ({sum.openShortages.length} belum dieskalasi atau diterima sebagai catatan).
                </div>
              ) : (
                <div style={{ color: 'var(--success)', marginTop: '2px' }}>
                  (Semua kekurangan sudah dieskalasi ke AS atau dicatat).
                </div>
              )}
            </div>
          )}

          {sum.warnings.length > 0 && (
            <div style={{ padding: '10px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-muted)' }}>
              ℹ {sum.warnings.length} Catatan preferensi karyawan (tidak memblokir pengajuan).
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">Tutup</button>
          <button
            type="button"
            disabled={!sum.canSubmit}
            onClick={() => {
              onClose();
              onProceedSubmit();
            }}
            className="btn btn-primary"
          >
            Lanjut ke Tinjau & Kirim →
          </button>
        </div>
      </div>
    </div>
  );
};
