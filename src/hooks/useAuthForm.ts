/**
 * Shared authentication form state hook
 * Manages form state, validation, and errors for authentication forms
 * Used across LoginPage, LoginSideMenu, and RegisterSideMenu for consistency
 */

import { useState, useCallback } from 'react';
import { validateLoginForm, validateRegisterForm, type ValidationResult } from '../utils/authValidation';
import { getAuthErrorMessage, getGeneralErrorMessage } from '../utils/authErrors';

export interface AuthFormState {
  email: string;
  password: string;
  nickname?: string;
  rememberMe?: boolean;
}

export interface UseAuthFormOptions {
  onSubmit: (data: AuthFormState) => Promise<void>;
  isRegister?: boolean;
}

export interface UseAuthFormReturn {
  formData: AuthFormState;
  errors: Record<string, string>;
  generalError: string | null;
  isSubmitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
}

export function useAuthForm({ onSubmit, isRegister = false }: UseAuthFormOptions): UseAuthFormReturn {
  const [formData, setFormData] = useState<AuthFormState>({
    email: '',
    password: '',
    nickname: '',
    rememberMe: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError(null);
    }
  }, [errors, generalError]);

  const validateForm = useCallback((): boolean => {
    let validationResult: ValidationResult;
    
    if (isRegister) {
      validationResult = validateRegisterForm(formData.email, formData.password, formData.nickname);
    } else {
      validationResult = validateLoginForm(formData.email, formData.password);
    }
    
    setErrors(validationResult.errors);
    return validationResult.isValid;
  }, [formData, isRegister]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      const errorMessage = getGeneralErrorMessage(error);
      setGeneralError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setGeneralError(null);
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    formData,
    errors,
    generalError,
    isSubmitting,
    handleChange,
    handleSubmit,
    clearErrors,
    clearFieldError,
  };
}
