import { DAYS } from '../data/seed.ts';
import type { Issue, ShiftCode } from '../types.ts';
import {
  canWorkShift,
  DAY_IDX,
  empName,
  isAbsent,
  isLeave,
  requiredOff,
  shiftMembers,
  slotKey,
  type Ctx,
} from './core.ts';

const key = (rule: string, empId = '', day: number | string = '', shift = '') => `${rule}|${empId}|${day}|${shift}`;

/**
 * Validates a roster against the MVP hard rules and soft preferences.
 * Runs after generation and after every manual change.
 */
export function validate(ctx: Ctx): Issue[] {
  const { employees, input, prev, copy } = ctx;
  const { roster } = copy;
  const issues: Issue[] = [];
  const name = (id: string | null | undefined) => empName(employees, id);

  const push = (i: Issue) => {
    if (i.severity === 'error' && i.overridable && ctx.exceptions[i.key]) i.exception = ctx.exceptions[i.key];
    issues.push(i);
  };

  // --- Workforce composition (store level)
  const males = employees.filter((e) => e.gender === 'L').length;
  const pct = Math.round((males / employees.length) * 100);
  if (males * 2 < employees.length) {
    push({
      key: key('MALE_50'),
      rule: 'MALE_50',
      severity: 'error',
      overridable: false,
      message: `Laki-laki hanya ${pct}% dari tenaga kerja toko (min. 50%)`,
    });
  }

  for (const e of employees) {
    const cells = roster.cells[e.id] ?? [];
    let offs = 0;
    for (const d of DAY_IDX) {
      const c = cells[d];
      const leave = isLeave(input, e.id, d);
      const absent = isAbsent(copy, e.id, d);
      if ((leave || absent) && (c === 'I' || c === 'II' || c === 'OFF')) {
        push({
          key: key('UNAVAILABLE', e.id, d),
          rule: 'UNAVAILABLE',
          severity: 'error',
          overridable: false,
          empId: e.id,
          day: d,
          message: `${name(e.id)} dijadwalkan pada ${DAYS[d]} padahal ${leave ? 'cuti' : 'tidak hadir'}`,
        });
      }
      if (!leave && !absent && c === null) {
        push({
          key: key('UNSET', e.id, d),
          rule: 'UNSET',
          severity: 'error',
          overridable: false,
          empId: e.id,
          day: d,
          message: `${name(e.id)} belum dijadwalkan pada ${DAYS[d]}`,
        });
      }
      if ((c === 'I' || c === 'II') && !canWorkShift(e, d, c)) {
        push({
          key: key('AVAIL', e.id, d),
          rule: 'AVAIL',
          severity: 'error',
          overridable: false,
          empId: e.id,
          day: d,
          message: `${name(e.id)} hanya tersedia Shift ${e.availability[d]} pada ${DAYS[d]}`,
        });
      }
      if (c === 'OFF') {
        offs++;
        if (prev.offs[e.id]?.includes(d)) {
          push({
            key: key('SAME_OFF', e.id, d),
            rule: 'SAME_OFF',
            severity: 'error',
            overridable: true,
            empId: e.id,
            day: d,
            message: `${name(e.id)} libur ${DAYS[d]}, sama dengan minggu lalu`,
          });
        }
        if (d < 6 && cells[d + 1] === 'OFF') {
          push({
            key: key('CONSEC_OFF', e.id, d),
            rule: 'CONSEC_OFF',
            severity: 'error',
            overridable: true,
            empId: e.id,
            day: d,
            message: `${name(e.id)} libur 2 hari berturut-turut (${DAYS[d]}–${DAYS[d + 1]})`,
          });
        }
        if (d === 0 && prev.offs[e.id]?.includes(6)) {
          push({
            key: key('CONSEC_OFF', e.id, 'prev'),
            rule: 'CONSEC_OFF',
            severity: 'error',
            overridable: true,
            empId: e.id,
            day: 0,
            message: `${name(e.id)} libur 2 hari berturut-turut (Minggu lalu–Senin)`,
          });
        }
      }
    }
    const req = requiredOff(e);
    if (offs !== req) {
      push({
        key: key('OFF_COUNT', e.id),
        rule: 'OFF_COUNT',
        severity: 'error',
        overridable: true,
        empId: e.id,
        message: `${name(e.id)} mendapat ${offs} libur, seharusnya ${req} (${e.workDays} hari kerja)`,
      });
    }
  }

  // --- Per shift rules
  const cif = employees.find((e) => e.position === 'CIF')?.id;
  const ssl = employees.find((e) => e.position === 'SSL')?.id;
  for (const d of DAY_IDX) {
    for (const s of ['I', 'II'] as ShiftCode[]) {
      const members = shiftMembers(roster, d, s);
      const req = s === 'I' ? input.req.I[d] : input.req.II[d];
      if (members.length > 0 && !members.some((id) => employees.find((e) => e.id === id)?.gender === 'L')) {
        push({
          key: key('MALE_SHIFT', '', d, s),
          rule: 'MALE_SHIFT',
          severity: 'error',
          overridable: true,
          day: d,
          shift: s,
          message: `${DAYS[d]} Shift ${s} tidak ada karyawan laki-laki`,
        });
      }
      if (cif && ssl && members.includes(cif) && members.includes(ssl)) {
        push({
          key: key('CIF_SSL', '', d, s),
          rule: 'CIF_SSL',
          severity: 'error',
          overridable: true,
          day: d,
          shift: s,
          message: `CIF (${name(cif)}) dan SSL (${name(ssl)}) sama-sama di ${DAYS[d]} Shift ${s}`,
        });
      }
      if (members.length < req) {
        const sk = slotKey(d, s);
        const esc = ctx.escalations.filter((x) => x.day === d && x.shift === s && x.status !== 'declined').pop();
        const issue: Issue = {
          key: key('SHORTAGE', '', d, s),
          rule: 'SHORTAGE',
          severity: 'shortage',
          overridable: true,
          day: d,
          shift: s,
          amount: req - members.length,
          message: `${DAYS[d]} Shift ${s} kurang ${req - members.length} orang (${members.length}/${req})`,
        };
        if (esc?.status === 'resolved') {
          issue.resolution = 'resolved';
          issue.resolutionText = `Diselesaikan AS: ${esc.helperName ?? 'bantuan lintas toko'}`;
        } else if (esc) {
          issue.resolution = 'escalated';
          issue.resolutionText = 'Dieskalasi ke AS · menunggu';
        } else if (ctx.acceptedShortages[sk]) {
          issue.resolution = 'accepted';
          issue.resolutionText = ctx.acceptedShortages[sk];
        }
        push(issue);
      }
    }

    // --- PK (key holder) rules
    const ii = shiftMembers(roster, d, 'II');
    const pk = roster.pk[d];
    if (ii.length > 0 && (!pk || !ii.includes(pk))) {
      push({
        key: key('PK_MISSING', '', d),
        rule: 'PK_MISSING',
        severity: 'error',
        overridable: false,
        day: d,
        shift: 'II',
        message: `${DAYS[d]} Shift II belum punya PK (penutup toko)`,
      });
    }
    if (pk && ii.includes(pk) && d < 6) {
      if (isAbsent(copy, pk, d + 1)) {
        push({
          key: key('PK_ABSENT', pk, d + 1),
          rule: 'PK_ABSENT',
          severity: 'warning',
          overridable: true,
          empId: pk,
          day: d + 1,
          message: `PK ${DAYS[d]} (${name(pk)}) tidak hadir ${DAYS[d + 1]}. Pastikan kunci diserahkan ke pembuka toko`,
        });
      } else if (roster.cells[pk]?.[d + 1] !== 'I') {
        push({
          key: key('PK_CHAIN', pk, d),
          rule: 'PK_CHAIN',
          severity: 'error',
          overridable: true,
          empId: pk,
          day: d + 1,
          shift: 'I',
          message: `PK ${DAYS[d]} (${name(pk)}) harus membuka toko di Shift I ${DAYS[d + 1]}`,
        });
      }
    }
  }

  // PK from last week's Sunday must open Monday
  const prevPk = prev.sundayPk;
  if (prevPk && roster.cells[prevPk]) {
    if (isAbsent(copy, prevPk, 0) || isLeave(input, prevPk, 0)) {
      push({
        key: key('PK_ABSENT', prevPk, 0),
        rule: 'PK_ABSENT',
        severity: 'warning',
        overridable: true,
        empId: prevPk,
        day: 0,
        message: `PK Minggu lalu (${name(prevPk)}) tidak masuk Senin. Pastikan kunci diserahkan`,
      });
    } else if (roster.cells[prevPk][0] !== 'I') {
      push({
        key: key('PK_CHAIN', prevPk, 'prev'),
        rule: 'PK_CHAIN',
        severity: 'error',
        overridable: true,
        empId: prevPk,
        day: 0,
        shift: 'I',
        message: `PK Minggu lalu (${name(prevPk)}) harus membuka toko di Shift I Senin`,
      });
    }
  }

  // --- Soft preferences (warnings only)
  for (const e of employees) {
    const cells = roster.cells[e.id] ?? [];
    if (e.prefOff !== undefined && !isLeave(input, e.id, e.prefOff) && cells[e.prefOff] !== 'OFF') {
      push({
        key: key('PREF_OFF', e.id),
        rule: 'PREF_OFF',
        severity: 'warning',
        overridable: true,
        empId: e.id,
        day: e.prefOff,
        message: `${name(e.id)} tidak libur di hari pilihannya (${DAYS[e.prefOff]})`,
      });
    }
    if (e.prefShift) {
      const other = cells.filter((c) => (c === 'I' || c === 'II') && c !== e.prefShift).length;
      if (other >= 3) {
        push({
          key: key('PREF_SHIFT', e.id),
          rule: 'PREF_SHIFT',
          severity: 'warning',
          overridable: true,
          empId: e.id,
          message: `${name(e.id)} ${other}× di luar shift pilihannya (Shift ${e.prefShift})`,
        });
      }
    }
  }

  // Shift II distribution (fairness hypothesis)
  const iiCounts = employees
    .filter((e) => e.availability.some((a) => a !== 'I'))
    .map((e) => ({ id: e.id, n: (roster.cells[e.id] ?? []).filter((c) => c === 'II').length }));
  if (iiCounts.length) {
    const max = Math.max(...iiCounts.map((x) => x.n));
    const min = Math.min(...iiCounts.map((x) => x.n));
    if (max - min >= 4) {
      const top = iiCounts.find((x) => x.n === max)!;
      push({
        key: key('II_BALANCE', top.id),
        rule: 'II_BALANCE',
        severity: 'warning',
        overridable: true,
        empId: top.id,
        message: `${name(top.id)} mendapat ${max}× Shift II, jauh lebih banyak dari rekan`,
      });
    }
  }
  const pkCounts: Record<string, number> = {};
  roster.pk.forEach((p) => p && (pkCounts[p] = (pkCounts[p] ?? 0) + 1));
  for (const [id, n] of Object.entries(pkCounts)) {
    if (n >= 3) {
      push({
        key: key('PK_BALANCE', id),
        rule: 'PK_BALANCE',
        severity: 'warning',
        overridable: true,
        empId: id,
        message: `${name(id)} menjadi PK ${n}× minggu ini (tugas PK belum merata)`,
      });
    }
  }

  return issues;
}

export interface IssueSummary {
  errors: Issue[];
  exceptions: Issue[];
  shortages: Issue[];
  openShortages: Issue[];
  warnings: Issue[];
  canSubmit: boolean;
  canSubmitWithNote: boolean;
}

export function summarize(issues: Issue[]): IssueSummary {
  const errors = issues.filter((i) => i.severity === 'error' && !i.exception);
  const exceptions = issues.filter((i) => i.severity === 'error' && i.exception);
  const shortages = issues.filter((i) => i.severity === 'shortage');
  const openShortages = shortages.filter((i) => !i.resolution);
  const warnings = issues.filter((i) => i.severity === 'warning');
  return {
    errors,
    exceptions,
    shortages,
    openShortages,
    warnings,
    canSubmit: errors.length === 0 && openShortages.length === 0,
    canSubmitWithNote: true,
  };
}

export const RULE_LIST = {
  hard: [
    'Cuti & ketersediaan karyawan',
    'Jumlah staf minimum per shift',
    'Periode jadwal Senin–Minggu',
    '5 hari kerja → 2 libur, 6 hari kerja → 1 libur',
    'Tidak libur 2 hari berturut-turut',
    'Hari libur tidak sama dengan minggu lalu',
    'Min. 1 laki-laki di setiap shift',
    'Min. 50% tenaga kerja toko laki-laki',
    'CIF & SSL tidak di shift yang sama',
    'Setiap Shift II punya PK (penutup toko)',
    'PK Shift II → besoknya Shift I (termasuk PK Minggu lalu)',
  ],
  soft: ['Hari libur pilihan', 'Shift pilihan', 'Pemerataan Shift II', 'Rotasi tugas PK'],
  out: ['Shift III', 'Pengecualian 2 SSL (toko volume tinggi)', 'Pengganti libur nasional'],
};
