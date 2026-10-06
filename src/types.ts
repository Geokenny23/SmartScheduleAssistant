export type Gender = 'L' | 'P';
export type Position = 'CIF' | 'SSL' | 'Kasir' | 'Pramuniaga';
export type ShiftCode = 'I' | 'II';
/** null = not working because of leave / absence (or not yet assigned) */
export type Cell = ShiftCode | 'OFF' | null;
export type Avail = 'all' | ShiftCode;

export interface Employee {
  id: string;
  name: string;
  gender: Gender;
  position: Position;
  workDays: 5 | 6;
  /** availability per day (Mon..Sun) */
  availability: Avail[];
  prefOff?: number;
  prefShift?: ShiftCode;
}

export interface WeekInput {
  /** empId -> day indexes on leave */
  leave: Record<string, number[]>;
  req: { I: number[]; II: number[] };
}

export interface Roster {
  cells: Record<string, Cell[]>;
  /** PK (key holder) for each day's Shift II */
  pk: (string | null)[];
}

export interface PrevWeekInfo {
  offs: Record<string, number[]>;
  sundayPk: string | null;
  label: string;
}

export type WeekStatus = 'empty' | 'draft' | 'pending' | 'approved' | 'change_pending';

export interface ActivityItem {
  at: number;
  actor: 'PS' | 'AS' | 'Asisten';
  text: string;
}

export interface Outcome {
  type: 'rejected' | 'withdrawn' | 'approved' | 'change_rejected' | 'change_approved';
  comment?: string;
  at: number;
}

export interface WorkingCopy {
  roster: Roster;
  absences: Record<string, number[]>;
  absenceReasons: Record<string, string>;
  /** cell keys (empId|day) edited by PS */
  manual: Record<string, true>;
  /** cell keys (empId|day) assigned duty: Kasir vs Pramuniaga */
  duties?: Record<string, 'Kasir' | 'Pramuniaga'>;
}

export interface Week {
  id: string;
  label: string;
  startISO: string;
  input: WeekInput;
  status: WeekStatus;
  proposalIndex: number;
  main: WorkingCopy | null;
  /** only while an approved schedule is being changed */
  change: WorkingCopy | null;
  exceptions: Record<string, string>;
  acceptedShortages: Record<string, string>;
  note: string;
  noteEdited: boolean;
  validatedAt: number | null;
  dirty: boolean;
  submittedAt: number | null;
  lastOutcome: Outcome | null;
  activity: ActivityItem[];
}

export interface Escalation {
  id: string;
  weekId: string;
  day: number;
  shift: ShiftCode;
  count: number;
  message: string;
  status: 'pending' | 'resolved' | 'declined';
  resolution?: string;
  helperName?: string;
  createdAt: number;
  resolvedAt?: number;
}

export type Severity = 'error' | 'warning' | 'shortage';

export interface Issue {
  key: string;
  rule: string;
  severity: Severity;
  overridable: boolean;
  message: string;
  empId?: string;
  day?: number;
  shift?: ShiftCode;
  /** exception reason when PS accepted a violation */
  exception?: string;
  /** shortage resolution state */
  resolution?: 'accepted' | 'escalated' | 'resolved';
  resolutionText?: string;
  /** shortage size (people) */
  amount?: number;
}

export interface NearbyStaff {
  id: string;
  name: string;
  gender: Gender;
  position: Position;
  store: string;
}

export interface AppState {
  version: number;
  role: 'PS' | 'AS';
  employees: Employee[];
  weekOrder: string[];
  weeks: Record<string, Week>;
  prevSeed: PrevWeekInfo;
  escalations: Escalation[];
  theme: 'light' | 'dark';
}
