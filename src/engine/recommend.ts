import { DAYS } from '../data/seed.ts';
import type { Cell, Issue, ShiftCode, WorkingCopy } from '../types.ts';
import { canWorkShift, cellKey, cloneCopy, DAY_IDX, empName, isAbsent, isLeave, repairPk, requiredOff, shiftMembers, type Ctx } from './core.ts';
import { validate } from './validate.ts';

export interface Change {
  empId: string;
  day: number;
  value: Cell;
}

export interface Candidate {
  empId: string;
  kind: 'move' | 'swap';
  summary: string;
  changes: Change[];
  checks: string[];
  warnings: string[];
  pkNotes: string[];
  score: number;
}

export interface Ineligible {
  empId: string;
  reason: string;
}

/** Apply cell changes on a copy; optionally let the assistant re-pick PK for affected days. */
export function applyChanges(ctx: Ctx, base: WorkingCopy, changes: Change[], repair = true) {
  const copy = cloneCopy(base);
  const days = new Set<number>();
  for (const c of changes) {
    copy.roster.cells[c.empId][c.day] = c.value;
    copy.manual[cellKey(c.empId, c.day)] = true;
    days.add(c.day);
    if (c.day > 0) days.add(c.day - 1);
  }
  const pkNotes: string[] = [];
  if (repair) {
    for (const d of [...days].sort()) {
      const before = copy.roster.pk[d];
      const after = repairPk(copy.roster, ctx.employees, ctx.input, copy.absences, d);
      if (before !== after && after) pkNotes.push(`PK ${DAYS[d]} dialihkan ke ${empName(ctx.employees, after)}`);
    }
  }
  return { copy, pkNotes };
}

function shortfall(issues: Issue[]) {
  const m: Record<string, number> = {};
  for (const i of issues) if (i.severity === 'shortage') m[`${i.day}|${i.shift}`] = i.amount ?? 1;
  return m;
}

/** Find local replacement candidates for an under-staffed slot. Never applies anything. */
export function recommend(ctx: Ctx, day: number, shift: ShiftCode): { candidates: Candidate[]; ineligible: Ineligible[] } {
  const base = validate(ctx);
  const baseErr = new Set(base.filter((i) => i.severity === 'error').map((i) => i.key));
  const baseWarn = new Set(base.filter((i) => i.severity === 'warning').map((i) => i.key));
  const baseShort = shortfall(base);
  const target = `${day}|${shift}`;
  const cells = ctx.copy.roster.cells;

  const candidates: Candidate[] = [];
  const ineligible: Ineligible[] = [];

  for (const e of ctx.employees) {
    const name = empName(ctx.employees, e.id);
    if (isLeave(ctx.input, e.id, day)) {
      ineligible.push({ empId: e.id, reason: `Cuti pada ${DAYS[day]}` });
      continue;
    }
    if (isAbsent(ctx.copy, e.id, day)) {
      ineligible.push({ empId: e.id, reason: `Tidak hadir pada ${DAYS[day]}` });
      continue;
    }
    const cur = cells[e.id][day];
    if (cur === shift) continue;
    if (!canWorkShift(e, day, shift)) {
      ineligible.push({ empId: e.id, reason: `Hanya tersedia Shift ${e.availability[day]} pada ${DAYS[day]}` });
      continue;
    }

    const attempts: { kind: Candidate['kind']; summary: string; changes: Change[] }[] = [];
    if (cur === 'I' || cur === 'II') {
      attempts.push({ kind: 'move', summary: `Pindah dari Shift ${cur} ke Shift ${shift}`, changes: [{ empId: e.id, day, value: shift }] });
    } else if (cur === 'OFF') {
      for (const d2 of DAY_IDX) {
        const c2 = cells[e.id][d2];
        if (d2 === day || (c2 !== 'I' && c2 !== 'II')) continue;
        attempts.push({
          kind: 'swap',
          summary: `Masuk ${DAYS[day]}, libur dipindah ke ${DAYS[d2]}`,
          changes: [
            { empId: e.id, day, value: shift },
            { empId: e.id, day: d2, value: 'OFF' },
          ],
        });
      }
    }

    let best: Candidate | null = null;
    let firstReason = '';
    for (const at of attempts) {
      const { copy, pkNotes } = applyChanges(ctx, ctx.copy, at.changes);
      const after = validate({ ...ctx, copy });
      const newErr = after.filter((i) => i.severity === 'error' && !baseErr.has(i.key));
      const afterShort = shortfall(after);
      const worse = Object.entries(afterShort).find(([k, v]) => k !== target && v > (baseShort[k] ?? 0));
      const improved = (afterShort[target] ?? 0) < (baseShort[target] ?? 0);
      if (newErr.length || worse || !improved) {
        if (!firstReason) {
          if (newErr.length) firstReason = newErr[0].message.replace(`${name} `, '');
          else if (worse) {
            const [d, s] = worse[0].split('|');
            firstReason = `Memindahkan akan membuat ${DAYS[Number(d)]} Shift ${s} kekurangan`;
          } else firstReason = 'Tidak mengurangi kekurangan';
        }
        continue;
      }
      const newWarn = after.filter((i) => i.severity === 'warning' && !baseWarn.has(i.key));
      const checks: string[] = [];
      if (at.kind === 'swap') {
        checks.push(`Tetap ${requiredOff(e)} libur`, 'Tidak libur berurutan', 'Beda dari libur minggu lalu');
      } else {
        const from = cur as ShiftCode;
        const left = shiftMembers(copy.roster, day, from).length;
        const req = from === 'I' ? ctx.input.req.I[day] : ctx.input.req.II[day];
        checks.push(`Shift ${from} tetap ${left}/${req}`);
      }
      checks.push('Semua aturan wajib terpenuhi');
      const score = newWarn.length * 2 + (at.kind === 'swap' ? 1 : 0) + (e.prefShift && e.prefShift !== shift ? 1 : 0) + pkNotes.length * 0.5;
      const cand: Candidate = {
        empId: e.id,
        kind: at.kind,
        summary: at.summary,
        changes: at.changes,
        checks,
        warnings: newWarn.map((w) => w.message),
        pkNotes,
        score,
      };
      if (!best || cand.score < best.score) best = cand;
    }
    if (best) candidates.push(best);
    else if (cur === 'OFF' && attempts.length === 0) ineligible.push({ empId: e.id, reason: 'Tidak ada hari kerja yang bisa ditukar dengan libur' });
    else ineligible.push({ empId: e.id, reason: firstReason || 'Tidak memenuhi syarat' });
  }
  candidates.sort((a, b) => a.score - b.score);
  return { candidates: candidates.slice(0, 3), ineligible };
}

/** Mark short-notice absence; the roster is recalculated only for affected cells. */
export function markAbsent(ctx: Ctx, empId: string, days: number[], reason: string) {
  const copy = cloneCopy(ctx.copy);
  const impact: { day: number; shift: ShiftCode | null }[] = [];
  const pkNotes: string[] = [];
  for (const d of days) {
    const prevCell = copy.roster.cells[empId][d];
    impact.push({ day: d, shift: prevCell === 'I' || prevCell === 'II' ? prevCell : null });
    copy.roster.cells[empId][d] = null;
    copy.absences[empId] = [...new Set([...(copy.absences[empId] ?? []), d])].sort();
    copy.absenceReasons[cellKey(empId, d)] = reason;
    if (copy.roster.pk[d] === empId) {
      copy.roster.pk[d] = null;
      const np = repairPk(copy.roster, ctx.employees, ctx.input, copy.absences, d);
      pkNotes.push(np ? `PK ${DAYS[d]} dialihkan ke ${empName(ctx.employees, np)}` : `${DAYS[d]} belum punya PK pengganti`);
    }
  }
  return { copy, impact, pkNotes };
}
