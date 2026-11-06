import { useAuth, useSignUp } from '@clerk/expo';
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
import { getClerkErrorMessage } from '@/services/auth/clerkErrors';

const NO_AUTOFILL = { autoComplete: 'off', importantForAutofill: 'no' } as const;

const INITIAL_VALUES: RegisterValues = { name: '', email: '', password: '', confirmPassword: '' };

export default function RegisterScreen() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { signUp } = useSignUp();
  const nameRef = useRef<TextInputInstance>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);
  const codeRef = useRef<TextInputInstance>(null);
  const fieldRefs: Record<keyof RegisterValues, RefObject<TextInputInstance | null>> = {
    name: nameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmRef,
  };

  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
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
      if (!isLoaded || !signUp) {
        setNotice({
          tone: 'error',
          title: "Couldn't create your account",
          message: 'Authentication is still loading. Try again in a moment.',
        });
        return;
      }

      setNotice(null);
      setLoading(true);
      try {
        const { error } = await signUp.password({
          emailAddress: email.trim().toLowerCase(),
          password,
          firstName: name.trim(),
        });
        if (error) {
          setNotice({
            tone: 'error',
            title: "Couldn't create your account",
            message: getClerkErrorMessage(error, 'Unable to create your account.'),
          });
          return;
        }

        const { error: sendError } = await signUp.verifications.sendEmailCode();
        if (sendError) {
          setNotice({
            tone: 'error',
            title: "Couldn't send verification code",
            message: getClerkErrorMessage(sendError, 'Check your email settings and try again.'),
          });
          return;
        }

        setPendingVerification(true);
        setNotice({
          tone: 'info',
          title: 'Check your email',
          message: 'Enter the verification code we sent to finish creating your account.',
        });
      } catch (error) {
        setNotice({
          tone: 'error',
          title: "Couldn't create your account",
          message: getClerkErrorMessage(error, 'Something went wrong. Please try again.'),
        });
      } finally {
        setLoading(false);
      }
    },
    (firstInvalid) => fieldRefs[firstInvalid].current?.focus()
  );

  const handleVerify = async () => {
    if (!isLoaded || !signUp) {
      return;
    }
    if (!verificationCode.trim()) {
      setNotice({
        tone: 'error',
        title: 'Code required',
        message: 'Enter the verification code from your email.',
      });
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode.trim(),
      });
      if (error) {
        setNotice({
          tone: 'error',
          title: "Couldn't verify email",
          message: getClerkErrorMessage(error, 'Invalid or expired verification code.'),
        });
        return;
      }

      const { error: finalizeError } = await signUp.finalize({
        navigate: () => {
          router.replace('/(tabs)');
        },
      });
      if (finalizeError) {
        setNotice({
          tone: 'error',
          title: "Couldn't finish sign-up",
          message: getClerkErrorMessage(finalizeError, 'Please try signing in.'),
        });
      }
    } catch (error) {
      setNotice({
        tone: 'error',
        title: "Couldn't verify email",
        message: getClerkErrorMessage(error, 'Something went wrong. Please try again.'),
      });
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <AuthScreenLayout
        title="Verify your email"
        subtitle="Enter the code Clerk sent to your inbox."
        footer={
          <>
            <AppText variant="label" tone="muted">
              Wrong email?
            </AppText>
            <TextLink
              label="Start over"
              onPress={() => {
                setPendingVerification(false);
                setVerificationCode('');
                setNotice(null);
              }}
            />
          </>
        }
      >
        <FormNotice notice={notice} />
        <CustomInput
          label="Verification code"
          placeholder="123456"
          value={verificationCode}
          inputRef={codeRef}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={handleVerify}
          editable={!loading}
        />
        <PrimaryButton title="Verify and continue" onPress={handleVerify} loading={loading} />
      </AuthScreenLayout>
    );
  }

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
