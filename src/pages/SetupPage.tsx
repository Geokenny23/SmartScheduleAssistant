import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import { DAYS, DAYS_SHORT } from '../data/seed.ts';
import { RULE_LIST } from '../engine/validate.ts';

export const SetupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, generateWeek } = useApp();

  const week = id ? state.weeks[id] : null;
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);

  if (!week) {
    return <div style={{ padding: '24px' }}>Jadwal tidak ditemukan.</div>;
  }

  // Pre-flight numbers
  const totalSupply = state.employees.reduce((acc, e) => {
    const leaveCount = week.input.leave[e.id]?.length ?? 0;
    return acc + (e.workDays - leaveCount);
  }, 0);

  const totalDemand = DAYS.reduce((acc, _, d) => {
    return acc + week.input.req.I[d] + week.input.req.II[d];
  }, 0);

  const supplyOk = totalSupply >= totalDemand;

  const handleStartGenerate = () => {
    setIsGenerating(true);
    setGenStep(1);

    setTimeout(() => {
      setGenStep(2);
      setTimeout(() => {
        setGenStep(3);
        setTimeout(() => {
          setGenStep(4);
          setTimeout(() => {
            generateWeek(week.id);
            navigate(`/ps/week/${week.id}`);
          }, 450);
        }, 400);
      }, 400);
    }, 400);
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/ps')}
        className="btn btn-subtle btn-sm"
        style={{ marginBottom: '16px' }}
      >
        ← Kembali ke Beranda
      </button>

      {/* Stepper */}
      <div className="stepper">
        <div className="step-item active">
          <div className="step-num">1</div>
          <span>① Tinjau Input</span>
        </div>
        <div className="step-divider" />
        <div className="step-item">
          <div className="step-num">2</div>
          <span>② Ruang Kerja Jadwal</span>
        </div>
        <div className="step-divider" />
        <div className="step-item">
          <div className="step-num">3</div>
          <span>③ Kirim ke AS</span>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Tinjau Data Input & Batasan</h2>
        <p style={{ fontSize: '13px', marginTop: '2px' }}>
          Periode: <strong>{week.label}</strong>. Asisten akan menggunakan data di bawah untuk menyusun usulan jadwal terbaik.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        {/* Team Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
              Tim Toko ({state.employees.length} Orang · 5 L / 4 P)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 600 }}>
              ✓ Rasio Laki-laki 56% (Min. 50%)
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {state.employees.map((e) => (
              <span
                key={e.id}
                style={{
                  padding: '6px 10px',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <strong>{e.name}</strong>
                <span className="badge badge-gender">{e.gender}</span>
                <span style={{ color: 'var(--text-muted)' }}>{e.position}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Leave & Availability Card */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
            Cuti & Ketersediaan Khusus Minggu Ini
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            {Object.keys(week.input.leave).length === 0 ? (
              <div style={{ color: 'var(--text-muted)' }}>Tidak ada pengajuan cuti minggu ini.</div>
            ) : (
              Object.entries(week.input.leave).map(([empId, days]) => {
                const emp = state.employees.find((e) => e.id === empId);
                return (
                  <div key={empId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{emp?.name}:</span>
                    <span style={{ color: 'var(--shift-leave-text)', background: 'var(--shift-leave-bg)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      Cuti {days.map((d) => DAYS[d]).join(', ')}
                    </span>
                  </div>
                );
              })
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600 }}>Eko Wijaya:</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                Hanya bersedia Shift I (Senin–Jumat)
              </span>
            </div>
          </div>
        </div>

        {/* Staffing Matrix Card */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
            Kebutuhan Minimal Staf per Shift
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', textAlign: 'center', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>Shift</th>
                  {DAYS_SHORT.map((d) => (
                    <th key={d} style={{ padding: '8px' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--shift-1-text)' }}>Shift I</td>
                  {DAYS.map((_, i) => (
                    <td key={i} style={{ padding: '8px' }}>{week.input.req.I[i]}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: 'var(--shift-2-text)' }}>Shift II</td>
                  {DAYS.map((_, i) => (
                    <td key={i} style={{ padding: '8px' }}>{week.input.req.II[i]}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pre-flight Supply/Demand Check Banner */}
        <div
          style={{
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            background: supplyOk ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: `1px solid ${supplyOk ? 'var(--success-border)' : 'var(--warning-border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>{supplyOk ? '✓' : '⚠'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: supplyOk ? 'var(--success)' : 'var(--warning)' }}>
              {supplyOk
                ? `Cek Awal: ${totalSupply} hari kerja tersedia untuk ${totalDemand} kebutuhan shift.`
                : `Cek Awal: ${totalSupply} hari kerja tersedia untuk ${totalDemand} kebutuhan shift. Kemungkinan ada kekurangan.`}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {supplyOk
                ? 'Secara kuantitas staf toko mencukupi untuk memenuhi seluruh shift.'
                : 'Kapasitas hari kerja berada di bawah total kebutuhan shift.'}
            </div>
          </div>
        </div>

        {/* Accordion Rules */}
        <details className="card" style={{ padding: '16px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            ▸ Aturan yang Diterapkan oleh Asisten ({RULE_LIST.hard.length + RULE_LIST.soft.length})
          </summary>
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--primary)' }}>Aturan Wajib (Hard Constraints):</div>
              <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)' }}>
                {RULE_LIST.hard.map((r) => (
                  <li key={r} style={{ marginBottom: '3px' }}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Pertimbangan Preferensi (Soft):</div>
              <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {RULE_LIST.soft.map((r) => (
                  <li key={r} style={{ marginBottom: '3px' }}>{r}</li>
                ))}
              </ul>
              <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-dim)' }}>Di Luar Cakupan MVP:</div>
              <ul style={{ paddingLeft: '16px', color: 'var(--text-dim)' }}>
                {RULE_LIST.out.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>

      {/* Sticky Bottom Generate Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          onClick={handleStartGenerate}
          className="btn btn-primary btn-lg"
          style={{ minWidth: '240px' }}
        >
          ✦ Buat Jadwal Otomatis
        </button>
      </div>

      {/* Generating Overlay Modal */}
      {isGenerating && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 2s linear infinite' }}>
              ✦
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Asisten Sedang Menyusun Jadwal...
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '13px' }}>
              <div style={{ color: genStep >= 1 ? 'var(--success)' : 'var(--text-dim)' }}>
                {genStep > 1 ? '✓' : '◌'} Memeriksa karyawan yang memenuhi syarat
              </div>
              <div style={{ color: genStep >= 2 ? 'var(--success)' : 'var(--text-dim)' }}>
                {genStep > 2 ? '✓' : '◌'} Menentukan hari libur non-berurutan
              </div>
              <div style={{ color: genStep >= 3 ? 'var(--success)' : 'var(--text-dim)' }}>
                {genStep > 3 ? '✓' : '◌'} Mengisi Shift I & Shift II serta rotasi PK
              </div>
              <div style={{ color: genStep >= 4 ? 'var(--success)' : 'var(--text-dim)' }}>
                {genStep >= 4 ? '✓' : '◌'} Memvalidasi seluruh aturan operasional
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
