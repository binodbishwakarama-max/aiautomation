export type PasswordStrength = 'weak' | 'fair' | 'strong' | 'excellent';

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordValidation {
  isValid: boolean;
  strength: PasswordStrength;
  score: number; // 0-5
  rules: PasswordRule[];
}

export function validatePassword(password: string): PasswordValidation {
  const rules: PasswordRule[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'One number (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'One special character (!@#$%^&*)',
      met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
    },
  ];

  const score = rules.filter((r) => r.met).length;
  const isValid = score === rules.length;

  let strength: PasswordStrength;
  if (score <= 1) {
    strength = 'weak';
  } else if (score <= 2) {
    strength = 'fair';
  } else if (score <= 4) {
    strength = 'strong';
  } else {
    strength = 'excellent';
  }

  return { isValid, strength, score, rules };
}

export const strengthConfig: Record<PasswordStrength, { color: string; bgColor: string; label: string; width: string }> = {
  weak: { color: 'text-red-400', bgColor: 'bg-red-500', label: 'Weak', width: 'w-1/5' },
  fair: { color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Fair', width: 'w-2/5' },
  strong: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Strong', width: 'w-4/5' },
  excellent: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Excellent', width: 'w-full' },
};
