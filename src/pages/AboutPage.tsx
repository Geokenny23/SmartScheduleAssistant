import React from 'react';
import { RULE_LIST } from '../engine/validate.ts';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Tentang Smart Schedule Assistant</h2>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Dokumentasi Konseptual & Batasan Prototipe Rekrutmen
        </div>
      </div>

      <div style={{ padding: '16px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--info)' }}>
        <strong>Catatan Evaluator:</strong> Ini adalah prototipe klik interaktif untuk keperluan rekrutmen, bukan sistem produksi atau pengganti TSM. Semua data bersifat contoh dan diproses secara deterministik di peramban (browser).
      </div>

      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Latar Belakang Masalah (Problem Framing)</h3>
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
          Pimpinan Shift (PS) menghadapi beban kognitif tinggi dalam menyusun roster mingguan toko karena harus menyeimbangkan ketersediaan staf, hak libur, kuota per shift, serta ketergantungan antar-hari (seperti rotasi penutup dan pembuka toko / PK).
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Hipotesis Solusi & Prinsip Produk</h3>
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '12px' }}>
          Jika Asisten dapat memberikan usulan jadwal awal yang layak (feasible starting roster) alih-alih kisi kosong, beban PS akan berkurang signifikan sambil tetap menjaga kendali operasional dan alur persetujuan PS → AS.
        </p>
        <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '13px', color: 'var(--primary)', textAlign: 'center' }}>
          ✦ Prinsip: Asisten Merekomendasikan · Pimpinan Shift Memutuskan · Area Supervisor Menyetujui
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Aturan yang Diimplementasikan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '6px' }}>Aturan Wajib (Hard Rules):</div>
            <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {RULE_LIST.hard.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>Preferensi (Soft Considerations):</div>
            <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
              {RULE_LIST.soft.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div style={{ fontWeight: 700, color: 'var(--text-dim)', marginBottom: '6px' }}>Di Luar Cakupan (Non-Goals):</div>
            <ul style={{ paddingLeft: '16px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              {RULE_LIST.out.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>Pertanyaan Validasi Masa Depan</h3>
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)' }}>
          Prototipe ini dibuat untuk menguji interaksi konsep bantuan jadwal. Untuk produk riil, riset lanjutan diperlukan untuk memvalidasi:
        </p>
        <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '8px' }}>
          <li>Tingkat kepercayaan Pimpinan Shift terhadap usulan otomatis.</li>
          <li>Frekuensi intervensi manual dan pengecualian aturan di lapangan.</li>
          <li>Kesesuaian alur eskalasi kekurangan staf lintas toko dengan realitas operasional toko.</li>
        </ul>
      </div>
    </div>
  );
};
