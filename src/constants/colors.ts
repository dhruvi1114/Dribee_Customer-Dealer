export const LightColors = {
  bgApp: '#F4F6F9',
  bgCard: '#FFFFFF',
  bgCard2: '#F8FAFC',
  bgInput: '#F0F2F5',
  bgSection: '#EEF2F7',
  bgHeader: '#FFFFFF',
  bgTabBar: '#FFFFFF',
  bgSheet: '#FFFFFF',
  bgOverlay: 'rgba(0,0,0,0.40)',

  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  brandNavy: '#1A3353',
  brandAmber: '#E8820C',
  brandBlue: '#2563EB',
  brandTeal: '#0D9488',

  statusPlaced: '#F59E0B',
  statusConfirmed: '#2563EB',
  statusProcessing: '#7C3AED',
  statusDispatched: '#EA580C',
  statusDelivered: '#16A34A',
  statusReturned: '#E11D48',

  borderCard: '#E5E7EB',
  borderInput: '#D1D5DB',
  borderFocus: '#2563EB',
  borderDivider: '#F3F4F6',

  shimmerBase: '#E5E7EB',
  shimmerShine: '#F3F4F6',
} as const;

export const DarkColors = {
  bgApp: '#0D1117',
  bgCard: '#161B22',
  bgCard2: '#1C2431',
  bgInput: '#0D1117',
  bgSection: '#1C2431',
  bgHeader: '#161B22',
  bgTabBar: '#161B22',
  bgSheet: '#161B22',
  bgOverlay: 'rgba(0,0,0,0.70)',

  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textInverse: '#FFFFFF',

  brandNavy: '#60A5FA',
  brandAmber: '#E8820C',
  brandBlue: '#2563EB',
  brandTeal: '#0D9488',

  statusPlaced: '#F59E0B',
  statusConfirmed: '#2563EB',
  statusProcessing: '#7C3AED',
  statusDispatched: '#EA580C',
  statusDelivered: '#16A34A',
  statusReturned: '#E11D48',

  borderCard: '#21262D',
  borderInput: '#30363D',
  borderFocus: '#2563EB',
  borderDivider: '#21262D',

  shimmerBase: '#21262D',
  shimmerShine: '#30363D',
} as const;

export type ThemeColors = {
  readonly [K in keyof typeof LightColors]: string;
};
