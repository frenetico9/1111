import { useState, ChangeEvent, FormEvent, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export const useForm = <T extends Record<string, any>>(options: UseFormOptions<T>) => {
  const [values, setValues] = useState<T>(options.initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
        processedValue = value === '' ? '' : parseFloat(value); // Allow empty string for temporary input state
    }

    setValues(prevValues => ({
      ...prevValues,
      [name]: processedValue,
    }));

    // Clear error for the field being changed
    if (errors[name]) {
        setErrors(prevErrors => {
            const newErrors = {...prevErrors};
            delete newErrors[name];
            return newErrors;
        });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    let formIsValid = true;
    if (options.validate) {
      const validationErrors = options.validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        formIsValid = false;
      }
    }
    
    if (formIsValid) {
      await options.onSubmit(values);
    }
    setIsSubmitting(false);
  }, [options, values]);

  const resetForm = useCallback(() => {
    setValues(options.initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [options.initialValues]);

  // Allow manually setting values, e.g., after fetching data or for complex fields
  const updateValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);
  
  const updateSingleValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues(prev => ({...prev, [name]: value}));
     if (errors[name]) {
        setErrors(prevErrors => {
            const newErrors = {...prevErrors};
            delete newErrors[name];
            return newErrors;
        });
    }
  }, [errors]);


  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setValues: updateValues, // Expose a way to set all values if needed
    updateSingleValue, // Expose a way to set single values more directly
    setErrors, // Allow manual error setting if needed
    resetForm
  };
};