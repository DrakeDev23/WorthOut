import { useRouter } from 'expo-router';
import React, { useRef, useState, type RefObject } from 'react';
import { StyleSheet, type TextInputInstance } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Button';
import { CustomInput } from '@/components/ui/CustomInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { TextLink } from '@/components/ui/TextLink';
import { spacing } from '@/constants/theme';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { FormNotice, type FormNoticeState } from '@/features/auth/components/FormNotice';
import {
  PASSWORD_MIN_LENGTH,
  validateRegister,
  type RegisterValues,
} from '@/features/auth/validation';
import { useForm } from '@/hooks/useForm';
import { useSession } from '@/store/session';

const NO_AUTOFILL = { autoComplete: 'off', importantForAutofill: 'no' } as const;

const INITIAL_VALUES: RegisterValues = { name: '', email: '', password: '', confirmPassword: '' };

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useSession();
  const nameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const fieldRefs: Record<keyof RegisterValues, RefObject<TextInputInstance | null>> = {
    name: nameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmRef,
  };

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<FormNoticeState | null>(null);

  const { values, errors, setValue, touch, submit } = useForm<RegisterValues>({
    initialValues: INITIAL_VALUES,
    validate: validateRegister,
  });

  const handleChange = (field: keyof RegisterValues) => (text: string) => {
    setValue(field, text);
    if (notice?.tone === 'error') setNotice(null);
  };

  const handleSubmit = submit(
    async ({ name, email, password }) => {
      setNotice(null);
      setLoading(true);
      try {
        const result = await signUp(name.trim(), email.trim(), password);
        if (result.status === 'success') {
          router.replace('/(tabs)');
        } else {
          setNotice({
            tone: 'error',
            title: "Couldn't create your account",
            message: result.message,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    (firstInvalid) => fieldRefs[firstInvalid].current?.focus()
  );

  return (
    <AuthScreenLayout
      title="Create your account"
      subtitle="Set up in under a minute and start tracking."
      footer={
        <>
          <AppText variant="label" tone="muted">
            Already have an account?
          </AppText>
          <TextLink
            label="Log in"
            accessibilityHint="Opens the login screen"
            onPress={() => router.replace('/login')}
          />
        </>
      }
    >
      <FormNotice notice={notice} />

      <CustomInput
        label="Name"
        placeholder="What should we call you?"
        value={values.name}
        error={errors.name}
        inputRef={nameRef}
        onChangeText={handleChange('name')}
        onBlur={() => touch('name')}
        onSubmitEditing={() => emailRef.current?.focus()}
        autoCapitalize="words"
        {...NO_AUTOFILL}
        textContentType="none"
        returnKeyType="next"
        submitBehavior="submit"
        editable={!loading}
      />

      <CustomInput
        label="Email"
        placeholder="name@example.com"
        value={values.email}
        error={errors.email}
        inputRef={emailRef}
        onChangeText={handleChange('email')}
        onBlur={() => touch('email')}
        onSubmitEditing={() => passwordRef.current?.focus()}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        {...NO_AUTOFILL}
        textContentType="none"
        returnKeyType="next"
        submitBehavior="submit"
        editable={!loading}
      />

      <PasswordInput
        label="Password"
        placeholder="Create a password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number.`}
        value={values.password}
        error={errors.password}
        inputRef={passwordRef}
        onChangeText={handleChange('password')}
        onBlur={() => touch('password')}
        onSubmitEditing={() => confirmRef.current?.focus()}
        {...NO_AUTOFILL}
        textContentType="oneTimeCode"
        returnKeyType="next"
        submitBehavior="submit"
        editable={!loading}
      />

      <PasswordInput
        label="Confirm password"
        placeholder="Re-enter your password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        inputRef={confirmRef}
        onChangeText={handleChange('confirmPassword')}
        onBlur={() => touch('confirmPassword')}
        onSubmitEditing={handleSubmit}
        {...NO_AUTOFILL}
        textContentType="oneTimeCode"
        returnKeyType="go"
        editable={!loading}
      />

      <PrimaryButton
        title="Create Account"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submit}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: spacing.xs,
  },
});
