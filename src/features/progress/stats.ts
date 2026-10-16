import { parseDateKey } from '@/core/dates';
import type { Bodyweight, ExerciseSession, LoggedSet } from '@/data';

const DAY = 24 * 60 * 60 * 1000;

/** What the exercise graph plots per session. */
export type Metric = 'topSet' | 'e1rm' | 'reps';
export type Range = '3m' | '1y' | 'all';

export interface Point {
  /** Epoch ms. */
  t: number;
  /** kg for weight metrics, a count for reps. */
  value: number;
}

/** Estimated one-rep max (Epley). A single rep is the weight itself. */
export function estimate1Rm(weightKg: number, reps: number): number | null {
  if (!(weightKg > 0) || !(reps > 0)) return null;
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

const working = (sets: readonly LoggedSet[]) => sets.filter((s) => !s.isWarmup);

function maxOf(values: (number | null)[]): number | null {
  const real = values.filter((v): v is number => v !== null);
  return real.length ? Math.max(...real) : null;
}

/** The best value of one session for a metric; warm-ups never count. */
function sessionValue(sets: readonly LoggedSet[], metric: Metric): number | null {
  const w = working(sets);
  switch (metric) {
    case 'topSet':
      return maxOf(w.map((s) => s.weightKg));
    case 'e1rm':
      return maxOf(
        w.map((s) =>
          s.weightKg !== null && s.reps !== null ? estimate1Rm(s.weightKg, s.reps) : null,
        ),
      );
    case 'reps':
      return maxOf(w.map((s) => s.reps));
  }
}

/** Weighted exercises graph weight; bodyweight ones (no weight logged) graph reps. */
export function defaultMetric(sessions: readonly ExerciseSession[]): Metric | null {
  const sets = sessions.flatMap((s) => working(s.sets));
  if (sets.some((s) => s.weightKg !== null)) return 'topSet';
  if (sets.some((s) => s.reps !== null)) return 'reps';
  return null;
}

export function exercisePoints(sessions: readonly ExerciseSession[], metric: Metric): Point[] {
  return sessions.flatMap((s) => {
    const value = sessionValue(s.sets, metric);
    return value === null ? [] : [{ t: s.startedAt, value }];
  });
}

export function bodyweightPoints(entries: readonly Bodyweight[]): Point[] {
  return entries
    .map((b) => ({ t: parseDateKey(b.weekStart).getTime(), value: b.weightKg }))
    .sort((a, b) => a.t - b.t);
}

export function inRange(points: readonly Point[], range: Range, now: number): Point[] {
  if (range === 'all') return [...points];
  const from = now - (range === '3m' ? 91 : 365) * DAY;
  return points.filter((p) => p.t >= from);
}

/**
 * Change of the latest value against the latest point at least `days` older.
 * Null when there is no point that old.
 */
export function changeOver(points: readonly Point[], days: number): number | null {
  const latest = points[points.length - 1];
  if (!latest) return null;
  // Half a day of slack so a daylight-saving switch doesn't skip the entry exactly `days` back.
  const cutoff = latest.t - days * DAY + DAY / 2;
  const base = [...points].reverse().find((p) => p.t <= cutoff);
  return base ? latest.value - base.value : null;
}

export interface ExerciseSummary {
  /** Heaviest working set (most reps breaks ties). */
  bestSet: LoggedSet | null;
  bestE1rm: number | null;
  sessions: number;
  lastAt: number | null;
}

export function summarizeExercise(sessions: readonly ExerciseSession[]): ExerciseSummary {
  let bestSet: LoggedSet | null = null;
  for (const s of sessions.flatMap((x) => working(x.sets))) {
    if (s.weightKg === null) continue;
    const better =
      !bestSet ||
      s.weightKg > bestSet.weightKg! ||
      (s.weightKg === bestSet.weightKg && (s.reps ?? 0) > (bestSet.reps ?? 0));
    if (better) bestSet = s;
  }
  return {
    bestSet,
    bestE1rm: maxOf(sessions.map((s) => sessionValue(s.sets, 'e1rm'))),
    // Warm-up-only sessions have nothing to graph, so they don't count.
    sessions: sessions.filter((s) => working(s.sets).length > 0).length,
    lastAt: sessions[sessions.length - 1]?.startedAt ?? null,
  };
}

export interface BodyweightSummary {
  current: number | null;
  lowest: number | null;
  highest: number | null;
}

export function summarizeBodyweight(points: readonly Point[]): BodyweightSummary {
  const values = points.map((p) => p.value);
  return {
    current: values[values.length - 1] ?? null,
    lowest: values.length ? Math.min(...values) : null,
    highest: values.length ? Math.max(...values) : null,
  };
}
