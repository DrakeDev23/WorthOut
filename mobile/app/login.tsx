import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Button';
import { CustomInput } from '@/components/ui/CustomInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { TextLink } from '@/components/ui/TextLink';
import { spacing } from '@/constants/theme';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { FormNotice, type FormNoticeState } from '@/features/auth/components/FormNotice';
import { validateLogin, type LoginValues } from '@/features/auth/validation';
import { useForm } from '@/hooks/useForm';
import { useSession } from '@/store/session';

const INITIAL_VALUES: LoginValues = { email: '', password: '' };

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<FormNoticeState | null>(null);

  const { values, errors, setValue, touch, submit } = useForm<LoginValues>({
    initialValues: INITIAL_VALUES,
    validate: validateLogin,
  });

  const handleChange = (field: keyof LoginValues) => (text: string) => {
    setValue(field, text);
    if (notice?.tone === 'error') setNotice(null);
  };

  const handleSubmit = submit(
    async ({ email, password }) => {
      setNotice(null);
      setLoading(true);
      try {
        const result = await signIn(email.trim(), password);
        if (result.status === 'success') {
          router.replace('/(tabs)');
        } else {
          setNotice({ tone: 'error', title: "Couldn't log you in", message: result.message });
        }
      } finally {
        setLoading(false);
      }
    },
    (firstInvalid) => (firstInvalid === 'email' ? emailRef : passwordRef).current?.focus()
  );

  const handleForgotPassword = () => {
    setNotice({
      tone: 'info',
      title: 'Password reset is coming soon',
      message: 'Resetting a password will be available once real accounts are connected.',
    });
  };

  const fillDemoCredentials = () => {
    setValue('email', 'drake@gmail.com');
    setValue('password', 'drakegwapo123');
    setNotice({
      tone: 'info',
      title: 'Demo credentials applied',
      message: 'Tap Log In to enter the dashboard as Drake.',
    });
  };

  return (
    <AuthScreenLayout
      centered
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          <AppText variant="label" tone="muted">
            New to Worthout?
          </AppText>
          <TextLink
            label="Create an account"
            accessibilityHint="Opens the registration screen"
            onPress={() => router.replace('/register')}
          />
        </>
      }
    >
      <FormNotice notice={notice} />

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
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        editable={!loading}
      />

      <View>
        <PasswordInput
          label="Password"
          placeholder="Your password"
          value={values.password}
          error={errors.password}
          inputRef={passwordRef}
          onChangeText={handleChange('password')}
          onBlur={() => touch('password')}
          onSubmitEditing={handleSubmit}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          editable={!loading}
        />
        <View style={styles.forgotRow}>
          <TextLink label="Forgot password?" onPress={handleForgotPassword} />
        </View>
      </View>

      <PrimaryButton title="Log In" onPress={handleSubmit} loading={loading} />

      <View style={styles.demoRow}>
        <AppText variant="caption" tone="subtle">
          Testing?
        </AppText>
        <TextLink
          label="Fill demo credentials"
          accessibilityHint="Fills test account credentials"
          onPress={fillDemoCredentials}
        />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
