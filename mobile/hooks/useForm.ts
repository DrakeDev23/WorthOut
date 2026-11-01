import { useCallback, useMemo, useState } from 'react';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
  initialValues: T;
  validate: (values: T) => FormErrors<T>;
}

export function useForm<T extends Record<string, string>>({
  initialValues,
  validate,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const allErrors = useMemo(() => validate(values), [validate, values]);

  const errors = useMemo(() => {
    const visible: FormErrors<T> = {};
    (Object.keys(allErrors) as (keyof T)[]).forEach((field) => {
      if (submitAttempted || touched[field]) visible[field] = allErrors[field];
    });
    return visible;
  }, [allErrors, submitAttempted, touched]);

  const setValue = useCallback((field: keyof T, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const touch = useCallback((field: keyof T) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const submit = useCallback(
    (onValid: (values: T) => void | Promise<void>, onInvalid?: (firstField: keyof T) => void) =>
      async () => {
        setSubmitAttempted(true);
        const invalidFields = Object.keys(allErrors) as (keyof T)[];
        if (invalidFields.length > 0) {
          onInvalid?.(invalidFields[0]);
          return;
        }
        await onValid(values);
      },
    [allErrors, values]
  );

  return { values, errors, setValue, touch, submit };
}
