import React, { useState } from 'react';
import { useApp } from '../store/AppContext.tsx';
import { DAYS } from '../data/seed.ts';
import type { Employee } from '../types.ts';

export const TeamPage: React.FC = () => {
  const { state, toggleEmployeeRole } = useApp();
  const [selectedEmp, setSelectedEmp] = useState<Employee>(state.employees[0]);

  const males = state.employees.filter((e) => e.gender === 'L').length;
  const malePct = Math.round((males / state.employees.length) * 100);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Data Tim & Batasan Kerja</h2>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>
            Profil karyawan, posisi, ketersediaan, dan preferensi kerja toko.
          </p>
        </div>
        <div style={{ padding: '8px 16px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
          ✓ Komposisi: {males} L / {state.employees.length - males} P ({malePct}% Laki-laki)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Table of employees */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Nama</th>
                <th style={{ padding: '12px 8px' }}>Gender</th>
                <th style={{ padding: '12px 8px' }}>Posisi</th>
                <th style={{ padding: '12px 8px' }}>Kontrak</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {state.employees.map((emp) => {
                const isSelected = selectedEmp.id === emp.id;
                return (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                      {emp.name}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-gender">{emp.gender}</span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                      {emp.position}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {emp.workDays} hari
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                        {isSelected ? 'Terpilih ▸' : 'Detail'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Employee Details Panel */}
        <div className="card">
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedEmp.name}</h3>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <span className="badge badge-gender">{selectedEmp.gender}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Posisi: {selectedEmp.position}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• {selectedEmp.workDays} hari kerja (wajib {selectedEmp.workDays === 6 ? 1 : 2} libur)</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px' }}>
                KETERSEDIAAN SHIFT HARIAN:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {DAYS.map((day, idx) => {
                  const avail = selectedEmp.availability[idx];
                  return (
                    <div key={idx} style={{ padding: '6px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '11px' }}>
                      <div style={{ fontWeight: 600 }}>{day.slice(0, 3)}</div>
                      <div style={{ color: avail === 'all' ? 'var(--success)' : 'var(--primary)', fontWeight: 600 }}>
                        {avail === 'all' ? 'Shift I & II' : `Shift ${avail}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px' }}>
                PREFERENSI KARYAWAN:
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div>• Hari Libur Pilihan: <strong>{selectedEmp.prefOff !== undefined ? DAYS[selectedEmp.prefOff] : 'Tidak ada preferensi'}</strong></div>
                <div style={{ marginTop: '4px' }}>• Shift Pilihan: <strong>{selectedEmp.prefShift ? `Shift ${selectedEmp.prefShift}` : 'Fleksibel'}</strong></div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px' }}>
                ATURAN KHUSUS POSISI:
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {selectedEmp.position === 'CIF' && 'Sebagai CIF, posisi tetap dan tidak boleh dijadwalkan pada shift yang sama persis dengan SSL.'}
                {selectedEmp.position === 'SSL' && 'Sebagai SSL, posisi tetap dan tidak boleh dijadwalkan pada shift yang sama persis dengan CIF.'}
                {(selectedEmp.position === 'Kasir' || selectedEmp.position === 'Pramuniaga') && (
                  <div>
                    <p style={{ marginBottom: '8px' }}>
                      Kasir & Pramuniaga bersifat <strong>interchangeable</strong> (dapat saling menggantikan tugas harian).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        toggleEmployeeRole(selectedEmp.id);
                        setSelectedEmp((prev) => ({
                          ...prev,
                          position: prev.position === 'Kasir' ? 'Pramuniaga' : 'Kasir',
                        }));
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      ⇄ Ubah Posisi Tim ({selectedEmp.position === 'Kasir' ? 'Jadikan Pramuniaga' : 'Jadikan Kasir'})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
