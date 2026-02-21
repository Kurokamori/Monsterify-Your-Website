// ── Starter Selection Utilities ───────────────────────────────────────

export const STEPS = [
  { label: 'First Starter', short: '1st' },
  { label: 'Second Starter', short: '2nd' },
  { label: 'Third Starter', short: '3rd' },
  { label: 'Review & Name', short: 'Review' },
] as const;

export function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}
