import { z } from 'zod';

const phoneField = z
  .string()
  .min(10, 'Enter a valid 10-digit mobile number')
  .max(10, 'Enter a valid 10-digit mobile number')
  .regex(/^\d{10}$/, 'Only digits allowed');

const emailField = z.string().email('Enter a valid email address');

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters');

// ── Auth Schemas ──

export const sendOtpSchema = z.object({
  phone: phoneField,
});
export type SendOtpFormValues = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit OTP'),
});
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export const setPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SetPasswordFormValues = z.infer<typeof setPasswordSchema>;

export const dealerRegisterSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: phoneField,
  email: emailField.optional().or(z.literal('')),
  businessName: z.string().min(1, 'Business name is required'),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
});
export type DealerRegisterFormValues = z.infer<typeof dealerRegisterSchema>;

export const customerRegisterSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: phoneField,
  email: emailField.optional().or(z.literal('')),
});
export type CustomerRegisterFormValues = z.infer<typeof customerRegisterSchema>;

// ── Profile Schemas ──

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: emailField.optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstin: z.string().optional(),
});
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

// ── Return Schemas ──

export const createReturnSchema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  notes: z.string().optional(),
});
export type CreateReturnFormValues = z.infer<typeof createReturnSchema>;

// ── Booking Schemas ──

export const createBookingSchema = z.object({
  catalogueId: z.number({ required_error: 'Please select a service' }),
  zoneId: z.number({ required_error: 'Zone required' }),
  areaId: z.number().optional(),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  slotDate: z.string().min(1, 'Please select a date'),
  slotStartTime: z.string().min(1, 'Please select a time'),
  customerAddress: z.string().min(5, 'Enter a valid address'),
  serviceLat: z.number().optional(),
  serviceLng: z.number().optional(),
  tcAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept T&C' }) }),
});
export type CreateBookingFormValues = z.infer<typeof createBookingSchema>;

// ── Rating Schema ──

export const rateJobSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});
export type RateJobFormValues = z.infer<typeof rateJobSchema>;

// ── Customer Address Schemas ──

const numericIdOptional = z
  .string()
  .regex(/^\d+$/, 'Invalid ID')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const createAddressSchema = z.object({
  label: z.string().trim().max(50).optional(),
  address_line: z.string().trim().min(1, 'Address is required').max(500),
  landmark: z.string().trim().max(200).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  city_id: numericIdOptional,
  zone_id: numericIdOptional,
  area_id: numericIdOptional,
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  is_default: z.boolean().optional(),
});
export type CreateAddressFormValues = z.infer<typeof createAddressSchema>;

export const updateAddressSchema = createAddressSchema.partial();
export type UpdateAddressFormValues = z.infer<typeof updateAddressSchema>;
