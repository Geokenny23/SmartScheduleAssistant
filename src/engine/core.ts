import type { Cell, Employee, Escalation, PrevWeekInfo, Roster, ShiftCode, WeekInput, WorkingCopy } from '../types.ts';

export interface Ctx {
  employees: Employee[];
  input: WeekInput;
  prev: PrevWeekInfo;
  copy: WorkingCopy;
  exceptions: Record<string, string>;
  acceptedShortages: Record<string, string>;
  escalations: Escalation[];
}

export const DAY_IDX = [0, 1, 2, 3, 4, 5, 6];

export const cellKey = (empId: string, day: number) => `${empId}|${day}`;
export const slotKey = (day: number, shift: ShiftCode) => `${day}|${shift}`;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isLeave(input: WeekInput, empId: string, day: number) {
  return !!input.leave[empId]?.includes(day);
}

export function isAbsent(copy: Pick<WorkingCopy, 'absences'>, empId: string, day: number) {
  return !!copy.absences[empId]?.includes(day);
}

export function requiredOff(e: Employee) {
  return e.workDays === 6 ? 1 : 2;
}

export function canWorkShift(e: Employee, day: number, shift: ShiftCode) {
  const a = e.availability[day];
  return a === 'all' || a === shift;
}

export function shiftMembers(roster: Roster, day: number, shift: ShiftCode): string[] {
  return Object.keys(roster.cells).filter((id) => roster.cells[id][day] === shift);
}

export function cloneRoster(r: Roster): Roster {
  const cells: Record<string, Cell[]> = {};
  for (const k of Object.keys(r.cells)) cells[k] = [...r.cells[k]];
  return { cells, pk: [...r.pk] };
}

export function cloneCopy(c: WorkingCopy): WorkingCopy {
  const absences: Record<string, number[]> = {};
  for (const k of Object.keys(c.absences)) absences[k] = [...c.absences[k]];
  return {
    roster: cloneRoster(c.roster),
    absences,
    absenceReasons: { ...c.absenceReasons },
    manual: { ...c.manual },
    duties: c.duties ? { ...c.duties } : {},
  };
}

export function emptyCopy(roster: Roster): WorkingCopy {
  return { roster, absences: {}, absenceReasons: {}, manual: {}, duties: {} };
}

export function empName(employees: Employee[], id: string | null | undefined) {
  if (!id) return '-';
  return employees.find((e) => e.id === id)?.name.split(' ')[0] ?? id;
}

export interface DayCoverage {
  I: number;
  II: number;
  reqI: number;
  reqII: number;
}

export function coverage(roster: Roster, input: WeekInput): DayCoverage[] {
  return DAY_IDX.map((d) => ({
    I: shiftMembers(roster, d, 'I').length,
    II: shiftMembers(roster, d, 'II').length,
    reqI: input.req.I[d],
    reqII: input.req.II[d],
  }));
}

export function coverageTotals(roster: Roster, input: WeekInput) {
  const cov = coverage(roster, input);
  let filled = 0;
  let required = 0;
  for (const c of cov) {
    filled += Math.min(c.I, c.reqI) + Math.min(c.II, c.reqII);
    required += c.reqI + c.reqII;
  }
  return { filled, required };
}

/** Employees who can take PK duty on `day` Shift II (they must be able to open Shift I next day). */
export function pkCandidates(
  roster: Roster,
  employees: Employee[],
  input: WeekInput,
  absences: Record<string, number[]>,
  day: number,
): string[] {
  const members = shiftMembers(roster, day, 'II');
  if (day === 6) return members;
  return members.filter((id) => {
    const e = employees.find((x) => x.id === id)!;
    const next = roster.cells[id][day + 1];
    if (next === 'I') return true;
    if (next === 'II' || next === 'OFF' || next === null) return false;
    return canWorkShift(e, day + 1, 'I') && !isLeave(input, id, day + 1) && !absences[id]?.includes(day + 1);
  });
}

/** Ensure the PK of a day is still in Shift II; otherwise choose a new one (prefer someone already on next day's Shift I). */
export function repairPk(
  roster: Roster,
  employees: Employee[],
  input: WeekInput,
  absences: Record<string, number[]>,
  day: number,
): string | null {
  const current = roster.pk[day];
  if (current && roster.cells[current]?.[day] === 'II') return current;
  const counts: Record<string, number> = {};
  roster.pk.forEach((p) => p && (counts[p] = (counts[p] ?? 0) + 1));
  const cands = pkCandidates(roster, employees, input, absences, day).filter(
    (id) => day === 6 || roster.cells[id][day + 1] === 'I',
  );
  cands.sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0));
  roster.pk[day] = cands[0] ?? null;
  return roster.pk[day];
}
