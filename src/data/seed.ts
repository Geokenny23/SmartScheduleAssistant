import type { Employee, NearbyStaff, PrevWeekInfo, WeekInput } from '../types';

export const STORE_NAME = 'Toko Kelapa Gading Raya';
export const PS_NAME = 'Rudi';
export const AS_NAME = 'Ratna';

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DAYS_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const ALL: Employee['availability'] = ['all', 'all', 'all', 'all', 'all', 'all', 'all'];

export const EMPLOYEES: Employee[] = [
  { id: 'andi', name: 'Andi Pratama', gender: 'L', position: 'Kasir', workDays: 6, availability: ALL, prefShift: 'I' },
  { id: 'budi', name: 'Budi Santoso', gender: 'L', position: 'Pramuniaga', workDays: 5, availability: ALL, prefOff: 0 },
  { id: 'citra', name: 'Citra Lestari', gender: 'P', position: 'CIF', workDays: 6, availability: ALL, prefOff: 6 },
  { id: 'dimas', name: 'Dimas Saputra', gender: 'L', position: 'SSL', workDays: 6, availability: ALL },
  { id: 'dewi', name: 'Dewi Anggraini', gender: 'P', position: 'Kasir', workDays: 5, availability: ALL },
  {
    id: 'eko',
    name: 'Eko Wijaya',
    gender: 'L',
    position: 'Pramuniaga',
    workDays: 6,
    availability: ['I', 'I', 'I', 'I', 'I', 'all', 'all'],
  },
  { id: 'fani', name: 'Fani Rahmawati', gender: 'P', position: 'Pramuniaga', workDays: 5, availability: ALL, prefShift: 'II' },
  { id: 'gita', name: 'Gita Permata', gender: 'P', position: 'Kasir', workDays: 5, availability: ALL, prefOff: 5 },
  { id: 'fajar', name: 'Fajar Nugroho', gender: 'L', position: 'Kasir', workDays: 6, availability: ALL },
];

export function defaultReq(): WeekInput['req'] {
  return { I: [3, 3, 3, 3, 3, 3, 3], II: [3, 3, 3, 3, 3, 4, 4] };
}

/** The week before the current week (only used as history for the first week). */
export const PREV_SEED: PrevWeekInfo = {
  label: '28 Sep – 4 Okt 2026',
  offs: {
    andi: [2],
    budi: [1, 3],
    citra: [4],
    dimas: [1],
    dewi: [2, 5],
    eko: [3],
    fani: [1, 4],
    gita: [0, 6],
    fajar: [5],
  },
  sundayPk: 'andi',
};

export const WEEKS_SEED = [
  { id: 'w41', label: '5 – 11 Okt 2026', startISO: '2026-10-05', leave: {} as Record<string, number[]> },
  { id: 'w42', label: '12 – 18 Okt 2026', startISO: '2026-10-12', leave: { dewi: [3, 4] } as Record<string, number[]> },
];

export const NEARBY_STAFF: NearbyStaff[] = [
  { id: 'rina', name: 'Rina Marlina', gender: 'P', position: 'Kasir', store: 'Toko Sunter Agung' },
  { id: 'yoga', name: 'Yoga Prasetyo', gender: 'L', position: 'Pramuniaga', store: 'Toko Sunter Agung' },
  { id: 'hendra', name: 'Hendra Gunawan', gender: 'L', position: 'Kasir', store: 'Toko Boulevard Barat' },
];

export const NEARBY_STORES = [
  { name: 'Toko Sunter Agung', distance: '1,8 km', available: 2 },
  { name: 'Toko Boulevard Barat', distance: '2,4 km', available: 1 },
];

export const ABSENCE_REASONS = ['Sakit', 'Urusan keluarga mendesak', 'Izin mendadak', 'Lainnya'];

export function dateOf(startISO: string, day: number): string {
  const d = new Date(startISO + 'T00:00:00');
  d.setDate(d.getDate() + day);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
