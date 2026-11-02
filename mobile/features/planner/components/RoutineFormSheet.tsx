import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/Button';
import { CustomInput } from '@/components/ui/CustomInput';
import { spacing } from '@/constants/theme';
import type { RoutineCategory } from '@/types/models';
import { CategorySelector } from './CategorySelector';

export interface RoutineFormValues {
  name: string;
  description?: string;
  category?: RoutineCategory;
}

interface RoutineFormSheetProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialValues?: RoutineFormValues;
  onClose: () => void;
  onSubmit: (values: RoutineFormValues) => void;
}

export function RoutineFormSheet({
  visible,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: RoutineFormSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RoutineCategory | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!visible) return;
    setName(initialValues?.name ?? '');
    setDescription(initialValues?.description ?? '');
    setCategory(initialValues?.category ?? null);
    setError(undefined);
  }, [visible, initialValues]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Routine name is required.');
      return;
    }
    onSubmit({
      name: trimmed,
      description: description.trim() || undefined,
      category: category ?? undefined,
    });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={mode === 'create' ? 'Create routine' : 'Edit routine'}
    >
      <CustomInput
        label="Routine name"
        placeholder="e.g. Monday Upper Body"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (error) setError(undefined);
        }}
        error={error}
        autoFocus
        returnKeyType="next"
        maxLength={60}
      />

      <CustomInput
        label="Description (optional)"
        placeholder="What is this routine for?"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={200}
        containerStyle={styles.spacer}
      />

      <View style={styles.spacer}>
        <CategorySelector selected={category} onSelect={setCategory} />
      </View>

      <PrimaryButton
        title={mode === 'create' ? 'Create Routine' : 'Save Changes'}
        onPress={handleSubmit}
        style={styles.submit}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  spacer: {
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
