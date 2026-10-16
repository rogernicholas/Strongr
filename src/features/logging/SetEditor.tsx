import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { formatNumber, fromDisplayWeight, toDisplayWeight, type WeightUnit } from '@/core/units';
import type { SetInput, WorkoutExercise } from '@/data';
import { AppText, Button, NumberStepper } from '@/ui';

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

export function SetEditor(props: Props) {
  const { tracks, unit, rpeEnabled, initial, submitLabel, onSubmit, onDelete, onCancel } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const [weight, setWeight] = useState(
    initial.weightKg === null ? '' : text(toDisplayWeight(initial.weightKg, unit)),
  );
  const [reps, setReps] = useState(text(initial.reps));
  const [duration, setDuration] = useState(text(initial.durationS));
  const [distance, setDistance] = useState(text(initial.distanceM));
  const [rpe, setRpe] = useState(text(initial.rpe));
  const [isWarmup, setIsWarmup] = useState(initial.isWarmup);

  const weightValue = parseDecimal(weight);
  const rpeValue = parseDecimal(rpe);
  const input: SetInput = {
    weightKg: tracks.weight && weightValue !== null ? fromDisplayWeight(weightValue, unit) : null,
    reps: tracks.reps ? parseWholeNumber(reps) : null,
    durationS: tracks.time ? parseDecimal(duration) : null,
    distanceM: tracks.distance ? parseDecimal(distance) : null,
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
              label={t('logging.seconds')}
              value={duration}
              onChangeText={setDuration}
              step={15}
            />
          ) : null}
          {tracks.distance ? (
            <NumberStepper
              label={t('logging.meters')}
              value={distance}
              onChangeText={setDistance}
              step={100}
            />
          ) : null}
        </View>
      ) : null}
      {rpeEnabled ? (
        <NumberStepper label="RPE" value={rpe} onChangeText={setRpe} step={0.5} decimals />
      ) : null}

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: isWarmup }}
        onPress={() => setIsWarmup((w) => !w)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isWarmup ? theme.colors.accent : theme.colors.subtle,
            backgroundColor: isWarmup ? theme.colors.accent : 'transparent',
          }}
        />
        <AppText>{t('logging.warmup')}</AppText>
      </Pressable>

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
