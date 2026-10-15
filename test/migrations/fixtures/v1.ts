import type { Fixture } from './index';

const T = 1_760_000_000_000;

export const v1: Fixture = {
  async seed(db) {
    await db.exec(`
      INSERT INTO settings (id, data, created_at, updated_at)
        VALUES ('s1', '{"weightUnit":"lb","theme":"dark"}', ${T}, ${T});

      INSERT INTO exercises (id, name, source, seed_key, created_at, updated_at)
        VALUES ('e1', 'Bench Press', 'seed', 'bench_press', ${T}, ${T});
      INSERT INTO exercises (id, name, source, tracks_weight, tracks_reps, tracks_distance, tracks_time, created_at, updated_at)
        VALUES ('e2', 'Rowing', 'custom', 0, 0, 1, 1, ${T}, ${T});
      INSERT INTO exercises (id, name, source, created_at, updated_at, deleted_at)
        VALUES ('e3', 'Old exercise', 'custom', ${T}, ${T}, ${T + 1});

      INSERT INTO templates (id, name, created_at, updated_at) VALUES ('t1', 'Push', ${T}, ${T});
      INSERT INTO template_exercises (id, template_id, exercise_id, position, target_sets, target_reps, created_at, updated_at)
        VALUES ('te1', 't1', 'e1', 0, 3, 8, ${T}, ${T});

      INSERT INTO workouts (id, template_id, started_at, ended_at, timezone, created_at, updated_at)
        VALUES ('w1', 't1', ${T}, ${T + 3_600_000}, 'Europe/Prague', ${T}, ${T});
      INSERT INTO workout_exercises (id, workout_id, exercise_id, position, created_at, updated_at)
        VALUES ('we1', 'w1', 'e1', 0, ${T}, ${T});
      INSERT INTO workout_exercises (id, workout_id, exercise_id, position, created_at, updated_at)
        VALUES ('we2', 'w1', 'e2', 1, ${T}, ${T});

      INSERT INTO sets (id, workout_exercise_id, position, weight_kg, reps, is_warmup, created_at, updated_at)
        VALUES ('st1', 'we1', 0, 60, 10, 1, ${T}, ${T});
      INSERT INTO sets (id, workout_exercise_id, position, weight_kg, reps, rpe, created_at, updated_at)
        VALUES ('st2', 'we1', 1, 102.5, 5, 8.5, ${T}, ${T});
      INSERT INTO sets (id, workout_exercise_id, position, duration_s, distance_m, created_at, updated_at)
        VALUES ('st3', 'we2', 0, 480, 2000, ${T}, ${T});
    `);
  },
  expectedCounts: {
    settings: 1,
    exercises: 3,
    templates: 1,
    template_exercises: 1,
    workouts: 1,
    workout_exercises: 2,
    sets: 3,
  },
};
