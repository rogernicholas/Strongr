import { localDateKey, weekStartKey } from '@/core/dates';
import { formatDistance, formatDuration } from '@/core/format';
import { formatNumber, toDisplayWeight, type WeightUnit } from '@/core/units';
import type { Bodyweight, LoggedSet, Workout } from '@/data';

/**
 * Sets in notepad style: consecutive sets at the same weight share it.
 *   50: 7, 5, 4; 40: 8      bodyweight: 12, 10      warm-ups get a "w": 20: 10w
 */
export function formatSetsLine(sets: readonly LoggedSet[], unit: WeightUnit): string {
  const groups: { weight: string | null; items: string[] }[] = [];
  for (const set of sets) {
    const weight =
      set.weightKg === null ? null : formatNumber(toDisplayWeight(set.weightKg, unit), 2);
    const parts: string[] = [];
    if (set.reps !== null) parts.push(String(set.reps));
    if (set.distanceM !== null) parts.push(formatDistance(set.distanceM));
    if (set.durationS !== null) parts.push(formatDuration(set.durationS));
    let item = parts.join(' ') || '-';
    if (set.rpe !== null) item += `@${formatNumber(set.rpe, 1)}`;
    if (set.isWarmup) item += 'w';

    const last = groups.at(-1);
    if (last && last.weight === weight) last.items.push(item);
    else groups.push({ weight, items: [item] });
  }
  return groups
    .map((g) => (g.weight === null ? g.items.join(', ') : `${g.weight}: ${g.items.join(', ')}`))
    .join('; ');
}

interface Options {
  unit: WeightUnit;
  /** Formats a day heading, e.g. "Thursday 15 October 2026". */
  formatDay(date: Date): string;
  labels: { header: string; bodyweight: string; warmupNote: string };
}

/** Every workout as plain text, one block per day, oldest first. */
export function buildTxtExport(
  workouts: readonly Workout[],
  bodyweights: readonly Bodyweight[],
  { unit, formatDay, labels }: Options,
): string {
  const weightByWeek = new Map(bodyweights.map((b) => [b.weekStart, b.weightKg]));
  const lines: string[] = [labels.header, labels.warmupNote, ''];

  const byDay = new Map<string, Workout[]>();
  for (const w of [...workouts].sort((a, b) => a.startedAt - b.startedAt)) {
    const key = localDateKey(new Date(w.startedAt));
    byDay.set(key, [...(byDay.get(key) ?? []), w]);
  }

  const shownWeeks = new Set<string>();
  for (const dayWorkouts of byDay.values()) {
    const date = new Date(dayWorkouts[0]!.startedAt);
    const names = dayWorkouts.map((w) => w.name).filter(Boolean);
    lines.push(names.length ? `${formatDay(date)} · ${names.join(', ')}` : formatDay(date));

    const week = weekStartKey(date);
    const bw = weightByWeek.get(week);
    if (bw !== undefined && !shownWeeks.has(week)) {
      shownWeeks.add(week);
      lines.push(`${labels.bodyweight}: ${formatNumber(toDisplayWeight(bw, unit), 1)} ${unit}`);
    }

    for (const workout of dayWorkouts) {
      for (const exercise of workout.exercises) {
        if (exercise.sets.length === 0) continue;
        lines.push(`${exercise.exerciseName} ${formatSetsLine(exercise.sets, unit)}`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}
