/**
 * Master constants — app-wide static values.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  THEME: 'app_theme',
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy hh:mm a',
  API: 'yyyy-MM-dd',
} as const;
