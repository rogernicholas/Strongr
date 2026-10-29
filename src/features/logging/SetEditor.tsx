import { useState } from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { formatNumber, fromDisplayWeight, toDisplayWeight, type WeightUnit } from '@/core/units';
import type { SetInput, WorkoutExercise } from '@/data';
import { Button, NumberStepper, Toggle } from '@/ui';

import { parseDecimal, parseWholeNumber, weightStep } from './setEntry';

interface Props {
  tracks: WorkoutExercise['tracks'];
  unit: WeightUnit;
  rpeEnabled: boolean;
  initial: SetInput;
  submitLabel: string;
  onSubmit(input: SetInput): void;
  onDelete?(): void;
  onCancel?(): void;
}

const text = (value: number | null) => (value === null ? '' : formatNumber(value, 2));
const scaled = (value: number | null, unit: number) => (value === null ? null : value * unit);

export function SetEditor(props: Props) {
  const { tracks, unit, rpeEnabled, initial, submitLabel, onSubmit, onDelete, onCancel } = props;
  const { t } = useTranslation();
  const [weight, setWeight] = useState(
    initial.weightKg === null ? '' : text(toDisplayWeight(initial.weightKg, unit)),
  );
  const [reps, setReps] = useState(text(initial.reps));
  // Cardio (time and distance) is entered in minutes and km; timed holds like a plank in seconds.
  const cardio = tracks.time && tracks.distance;
  const timeUnit = cardio ? 60 : 1;
  const distanceUnit = cardio ? 1000 : 1;
  const [duration, setDuration] = useState(
    initial.durationS === null ? '' : text(initial.durationS / timeUnit),
  );
  const [distance, setDistance] = useState(
    initial.distanceM === null ? '' : text(initial.distanceM / distanceUnit),
  );
  const [rpe, setRpe] = useState(text(initial.rpe));
  const [isWarmup, setIsWarmup] = useState(initial.isWarmup);

  const weightValue = parseDecimal(weight);
  const rpeValue = parseDecimal(rpe);
  const input: SetInput = {
    weightKg: tracks.weight && weightValue !== null ? fromDisplayWeight(weightValue, unit) : null,
    reps: tracks.reps ? parseWholeNumber(reps) : null,
    durationS: tracks.time ? scaled(parseDecimal(duration), timeUnit) : null,
    distanceM: tracks.distance ? scaled(parseDecimal(distance), distanceUnit) : null,
    rpe: rpeEnabled && rpeValue !== null && rpeValue >= 1 && rpeValue <= 10 ? rpeValue : null,
    isWarmup,
  };
  const valid = [input.weightKg, input.reps, input.durationS, input.distanceM].some(
    (v) => v !== null,
  );

  return (
    <View style={{ gap: 12 }}>
      {tracks.weight || tracks.reps ? (
        <View style={{ gap: 8 }}>
          {tracks.weight ? (
            <NumberStepper
              label={unit}
              value={weight}
              onChangeText={setWeight}
              step={weightStep(unit)}
              decimals
            />
          ) : null}
          {tracks.reps ? (
            <NumberStepper label={t('logging.reps')} value={reps} onChangeText={setReps} step={1} />
          ) : null}
        </View>
      ) : null}
      {tracks.time || tracks.distance ? (
        <View style={{ gap: 8 }}>
          {tracks.time ? (
            <NumberStepper
              label={cardio ? t('logging.minutes') : t('logging.seconds')}
              value={duration}
              onChangeText={setDuration}
              step={cardio ? 1 : 15}
              decimals={cardio}
            />
          ) : null}
          {tracks.distance ? (
            <NumberStepper
              label={cardio ? 'km' : t('logging.meters')}
              value={distance}
              onChangeText={setDistance}
              step={cardio ? 0.5 : 100}
              decimals
            />
          ) : null}
        </View>
      ) : null}
      {rpeEnabled ? (
        <NumberStepper label="RPE" value={rpe} onChangeText={setRpe} step={0.5} decimals />
      ) : null}

      <Toggle label={t('logging.warmup')} value={isWarmup} onChange={setIsWarmup} />

      <Button label={submitLabel} onPress={() => onSubmit(input)} disabled={!valid} />
      {onDelete || onCancel ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onCancel ? (
            <View style={{ flex: 1 }}>
              <Button label={t('common.cancel')} variant="quiet" onPress={onCancel} />
            </View>
          ) : null}
          {onDelete ? (
            <View style={{ flex: 1 }}>
              <Button label={t('logging.deleteSet')} variant="quiet" onPress={onDelete} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
