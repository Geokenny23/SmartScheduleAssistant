import React, { useState } from 'react';
import type { Issue } from '../../types.ts';

interface ExceptionModalProps {
  issue: Issue;
  onSave: (reason: string) => void;
  onClose: () => void;
}

export const ExceptionModal: React.FC<ExceptionModalProps> = ({
  issue,
  onSave,
  onClose,
}) => {
  const [reason, setReason] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Alasan pengecualian wajib diisi.');
      return;
    }
    onSave(reason.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Jadikan Pengecualian</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Izinkan pelanggaran aturan ini dengan alasan operasional yang sah
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-subtle btn-sm">✕</button>
        </div>

        <div style={{ padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
          <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '2px' }}>
            ✕ {issue.message}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              ALASAN PENGECUALIAN (WAJIB, AKAN DITINJAU OLEH AS):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Contoh: Permintaan khusus dari karyawan yang bersangkutan karena urusan keluarga mendesak..."
              required
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

          <div style={{ padding: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            ℹ Pengecualian ini akan diberi tanda khusus pada jadwal dan disertakan dalam catatan pengajuan ke Area Supervisor.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan Pengecualian</button>
          </div>
        </form>
      </div>
    </div>
  );
};
