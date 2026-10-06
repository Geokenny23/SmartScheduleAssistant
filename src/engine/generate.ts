import type { Cell, Employee, PrevWeekInfo, Roster, ShiftCode, WeekInput } from '../types.ts';
import { canWorkShift, cellKey, DAY_IDX, emptyCopy, mulberry32, requiredOff } from './core.ts';
import { summarize, validate } from './validate.ts';

export interface GenerateArgs {
  employees: Employee[];
  input: WeekInput;
  prev: PrevWeekInfo;
  seed: number;
  absences?: Record<string, number[]>;
  /** cells the PS wants to keep (manual edits), keyed by empId|day */
  fixed?: Record<string, Cell>;
  /** previous proposal; the generator prefers a different alternative */
  avoid?: Roster | null;
  attempts?: number;
}

function combos(days: number[], r: number): number[][] {
  if (r === 1) return days.map((d) => [d]);
  const out: number[][] = [];
  for (let i = 0; i < days.length; i++)
    for (let j = i + 1; j < days.length; j++) if (days[j] - days[i] > 1) out.push([days[i], days[j]]);
  return out;
}

/**
 * Rule-based weekly roster generator (deterministic per seed).
 * 1. Filter out unavailable employees (leave, absence).
 * 2. Choose off days satisfying the off-day rules while keeping enough staff each day.
 * 3. Fill Shift I / II day by day (male per shift, CIF≠SSL, availability, PK chain).
 * 4. Repeat with variations and keep the roster with the fewest violations / shortages.
 * Unfillable slots are left empty (shortage) rather than forced.
 */
export function generate(args: GenerateArgs): Roster {
  const { employees, input, prev, seed } = args;
  const absences = args.absences ?? {};
  const fixed = args.fixed ?? {};
  const attempts = args.attempts ?? 220;
  const rng = mulberry32(seed * 7919 + 17);

  const unavailable = (id: string, d: number) => !!input.leave[id]?.includes(d) || !!absences[id]?.includes(d);
  const demand = DAY_IDX.map((d) => input.req.I[d] + input.req.II[d]);

  const options = new Map<string, number[][]>();
  for (const e of employees) {
    const r = requiredOff(e);
    const strictDays = DAY_IDX.filter((d) => {
      if (unavailable(e.id, d)) return false;
      const f = fixed[cellKey(e.id, d)];
      if (f === 'I' || f === 'II') return false;
      if (prev.offs[e.id]?.includes(d)) return false;
      if (d === 0 && (prev.offs[e.id]?.includes(6) || prev.sundayPk === e.id)) return false;
      return true;
    });
    const mustOff = DAY_IDX.filter((d) => fixed[cellKey(e.id, d)] === 'OFF');
    let list = combos(strictDays, r).filter((c) => mustOff.every((d) => c.includes(d)));
    if (!list.length) {
      const loose = DAY_IDX.filter((d) => !unavailable(e.id, d));
      list = combos(loose, Math.min(r, loose.length));
    }
    options.set(e.id, list);
  }

  let best: Roster | null = null;
  let bestCost = Infinity;

  for (let a = 0; a < attempts; a++) {
    // ---- Step 2: off days
    const working = DAY_IDX.map((d) => employees.filter((e) => !unavailable(e.id, d)).length);
    const malesW = DAY_IDX.map((d) => employees.filter((e) => e.gender === 'L' && !unavailable(e.id, d)).length);
    const order = [...employees].sort(
      (x, y) => options.get(x.id)!.length - options.get(y.id)!.length + (rng() - 0.5) * 6,
    );
    const offs: Record<string, number[]> = {};
    for (const e of order) {
      let pick: number[] = [];
      let pickScore = Infinity;
      for (const c of options.get(e.id)!) {
        let s = rng() * 2.5;
        for (const d of c) {
          const slack = working[d] - 1 - demand[d];
          s += slack < 0 ? 100 : -Math.min(slack, 3);
          if (e.gender === 'L' && malesW[d] - 1 < 2) s += 60;
        }
        if (e.prefOff !== undefined && c.includes(e.prefOff)) s -= 3;
        if (s < pickScore) {
          pickScore = s;
          pick = c;
        }
      }
      offs[e.id] = pick;
      for (const d of pick) {
        working[d]--;
        if (e.gender === 'L') malesW[d]--;
      }
    }

    // ---- Step 3: shifts per day
    const cells: Record<string, Cell[]> = {};
    for (const e of employees) cells[e.id] = DAY_IDX.map((d) => (unavailable(e.id, d) ? null : offs[e.id].includes(d) ? 'OFF' : null));
    const pk: (string | null)[] = Array(7).fill(null);
    const iiCount: Record<string, number> = {};
    const pkCount: Record<string, number> = {};
    let forcedI: string | null = prev.sundayPk;

    for (const d of DAY_IDX) {
      const W = employees.filter((e) => !unavailable(e.id, d) && !offs[e.id].includes(d));
      const n = W.length;
      let bestMask = 0;
      let bestMaskCost = Infinity;
      for (let mask = 0; mask < 1 << n; mask++) {
        const I: Employee[] = [];
        const II: Employee[] = [];
        let cost = rng() * 0.6;
        W.forEach((e, i) => {
          const s: ShiftCode = mask & (1 << i) ? 'II' : 'I';
          (s === 'I' ? I : II).push(e);
          if (!canWorkShift(e, d, s)) cost += 5000;
          const f = fixed[cellKey(e.id, d)];
          if ((f === 'I' || f === 'II') && f !== s) cost += 3000;
          if (e.prefShift && e.prefShift !== s) cost += 1;
          if (s === 'II') cost += (iiCount[e.id] ?? 0) * 0.7;
        });
        if (forcedI && W.some((e) => e.id === forcedI) && !I.some((e) => e.id === forcedI)) cost += 2500;
        if (I.length && !I.some((e) => e.gender === 'L')) cost += 2000;
        if (II.length && !II.some((e) => e.gender === 'L')) cost += 2000;
        if (I.some((e) => e.position === 'CIF') && I.some((e) => e.position === 'SSL')) cost += 2000;
        if (II.some((e) => e.position === 'CIF') && II.some((e) => e.position === 'SSL')) cost += 2000;
        cost += Math.max(0, input.req.I[d] - I.length) * 1000 + Math.max(0, input.req.II[d] - II.length) * 1000;
        cost += Math.max(0, I.length - input.req.I[d]) * 0.4 + Math.max(0, II.length - input.req.II[d]) * 0.6;
        if (d < 6 && II.length) {
          const ok = II.some(
            (e) =>
              !unavailable(e.id, d + 1) &&
              !offs[e.id].includes(d + 1) &&
              canWorkShift(e, d + 1, 'I') &&
              fixed[cellKey(e.id, d + 1)] !== 'II',
          );
          if (!ok) cost += 400;
        }
        if (cost < bestMaskCost) {
          bestMaskCost = cost;
          bestMask = mask;
        }
      }
      W.forEach((e, i) => {
        const s: ShiftCode = bestMask & (1 << i) ? 'II' : 'I';
        cells[e.id][d] = s;
        if (s === 'II') iiCount[e.id] = (iiCount[e.id] ?? 0) + 1;
      });
      // PK for tonight's closing
      const iiMembers = W.filter((e) => cells[e.id][d] === 'II');
      const cands = iiMembers.filter(
        (e) =>
          d === 6 ||
          (!unavailable(e.id, d + 1) &&
            !offs[e.id].includes(d + 1) &&
            canWorkShift(e, d + 1, 'I') &&
            fixed[cellKey(e.id, d + 1)] !== 'II'),
      );
      const pool = cands.length ? cands : iiMembers;
      let chosen: string | null = null;
      let chosenScore = Infinity;
      for (const e of pool) {
        const sc = (pkCount[e.id] ?? 0) * 2 + rng();
        if (sc < chosenScore) {
          chosenScore = sc;
          chosen = e.id;
        }
      }
      pk[d] = chosen;
      if (chosen) pkCount[chosen] = (pkCount[chosen] ?? 0) + 1;
      forcedI = d < 6 ? chosen : null;
    }

    const roster: Roster = { cells, pk };
    const issues = validate({
      employees,
      input,
      prev,
      copy: { ...emptyCopy(roster), absences },
      exceptions: {},
      acceptedShortages: {},
      escalations: [],
    });
    const sum = summarize(issues);
    let cost =
      sum.errors.length * 1000 +
      sum.shortages.reduce((acc, i) => acc + (i.amount ?? 1), 0) * 300 +
      sum.warnings.length * 6 +
      rng() * 2;
    for (const [k, v] of Object.entries(fixed)) {
      const [id, d] = k.split('|');
      if (cells[id]?.[Number(d)] !== v) cost += 50;
    }
    if (args.avoid) {
      let same = 0;
      for (const e of employees) for (const d of DAY_IDX) if (args.avoid.cells[e.id]?.[d] === cells[e.id][d]) same++;
      cost += same * 0.5;
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = roster;
    }
  }
  return best!;
}
