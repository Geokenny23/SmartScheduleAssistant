import { DAYS } from '../data/seed.ts';
import type { Employee, Issue, WeekInput, WorkingCopy } from '../types.ts';
import { cellKey, empName } from './core.ts';

/** Drafts an operational note from shortages, exceptions and absences. PS can edit it. */
export function draftNote(employees: Employee[], input: WeekInput, copy: WorkingCopy, issues: Issue[]): string {
  const name = (id: string) => empName(employees, id);
  const shortages = issues.filter((i) => i.severity === 'shortage');
  const exceptions = issues.filter((i) => i.severity === 'error' && i.exception);
  const absentees = Object.entries(copy.absences).flatMap(([id, days]) =>
    days.map((d) => ({ id, d, reason: copy.absenceReasons[cellKey(id, d)] ?? 'Tidak hadir' })),
  );

  if (!shortages.length && !exceptions.length && !absentees.length) {
    return 'Jadwal lengkap. Semua aturan wajib terpenuhi dan tidak ada kekurangan staf.';
  }

  const lines: string[] = [];
  if (shortages.length) {
    lines.push('Kekurangan staf:');
    for (const s of shortages) {
      const d = s.day!;
      const causes: string[] = [];
      for (const a of absentees.filter((x) => x.d === d)) causes.push(`ketidakhadiran mendadak ${name(a.id)} (${a.reason})`);
      for (const [id, days] of Object.entries(input.leave)) if (days.includes(d)) causes.push(`${name(id)} cuti`);
      let line = `• ${DAYS[d]} Shift ${s.shift} kurang ${s.amount} orang`;
      if (causes.length) line += ` karena ${causes.join(' dan ')}`;
      line += '. Tidak ada pengganti yang memenuhi syarat di toko ini.';
      if (s.resolution === 'escalated') line += ' Bantuan lintas toko sudah diajukan.';
      if (s.resolution === 'resolved') line += ` ${s.resolutionText}.`;
      if (s.resolution === 'accepted') line += ` Diterima sebagai pengecualian: ${s.resolutionText}`;
      lines.push(line);
    }
  }
  if (exceptions.length) {
    lines.push('', 'Pengecualian aturan:');
    for (const e of exceptions) lines.push(`• ${e.message}. Alasan: ${e.exception}`);
  }
  const unhandledErrors = issues.filter((i) => i.severity === 'error' && !i.exception);
  if (unhandledErrors.length) {
    lines.push('', 'Catatan penyesuaian manual PS (perlu tinjauan AS):');
    for (const e of unhandledErrors) {
      lines.push(`• ${e.message} (Penyesuaian manual oleh Pimpinan Shift)`);
    }
  }
  const unrelated = absentees.filter((a) => !shortages.some((s) => s.day === a.d));
  if (unrelated.length) {
    lines.push('', 'Ketidakhadiran (sudah ada pengganti):');
    for (const a of unrelated) lines.push(`• ${name(a.id)} tidak hadir ${DAYS[a.d]} (${a.reason})`);
  }
  lines.push('', 'Tindakan: Mohon tinjauan Area Supervisor.');
  return lines.join('\n');
}
