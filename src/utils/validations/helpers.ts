import { z } from 'zod';

/** Reusable email field */
export const emailField = z.string().min(1, 'Email is required').email('Invalid email address');

/** Reusable password field (min 6 chars) */
export const passwordField = z.string().min(6, 'Password must be at least 6 characters');

/** Reusable required string field */
export const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} is required`);
