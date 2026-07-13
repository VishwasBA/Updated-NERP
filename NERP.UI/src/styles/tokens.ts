/**
 * Design Tokens System
 * Centralized design values for consistent UI across the application
 * Usage: Import and reference in components instead of hardcoding values
 */

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================
export const typography = {
  // Font families
  fontFamily: {
    sans: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  },

  // Font sizes with line heights
  sizes: {
    h1: { size: '2.5rem', lineHeight: '1.2', weight: 700 }, // 40px
    h2: { size: '2rem', lineHeight: '1.3', weight: 700 }, // 32px
    h3: { size: '1.5rem', lineHeight: '1.4', weight: 600 }, // 24px
    h4: { size: '1.25rem', lineHeight: '1.4', weight: 600 }, // 20px
    h5: { size: '1.125rem', lineHeight: '1.5', weight: 600 }, // 18px
    h6: { size: '1rem', lineHeight: '1.5', weight: 600 }, // 16px
    
    body: { size: '1rem', lineHeight: '1.6', weight: 400 }, // 16px
    bodySmall: { size: '0.875rem', lineHeight: '1.5', weight: 400 }, // 14px
    
    caption: { size: '0.75rem', lineHeight: '1.4', weight: 500 }, // 12px
    xs: { size: '0.625rem', lineHeight: '1.4', weight: 500 }, // 10px
  },

  // Font weights
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

// ============================================================================
// SPACING TOKENS (4px grid system)
// ============================================================================
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  xxl: '2.5rem', // 40px
  xxxl: '3rem', // 48px
};

// ============================================================================
// COLOR TOKENS
// ============================================================================
export const colors = {
  // Primary brand color (Amber)
  primary: {
    light: '#FCD34D', // 50%
    DEFAULT: '#F59E0B', // 60%
    dark: '#D97706', // 75%
  },

  // Secondary colors
  secondary: {
    light: '#FEFCE8',
    DEFAULT: '#FEF3C7',
    dark: '#FCD34D',
  },

  // Accent colors (for category badges)
  accent: {
    purple: '#8B5CF6',
    purpleBg: '#F3E8FF',
    amber: '#F59E0B',
    amberBg: '#FFFBEB',
    lightPurple: '#A78BFA',
    lightPurpleBg: '#F5F3FF',
    emerald: '#10B981',
    emeraldBg: '#ECFDF5',
    pink: '#EC4899',
    pinkBg: '#FCE7F3',
    cyan: '#0EA5E9',
    cyanBg: '#F0F9FF',
    red: '#EF4444',
    redBg: '#FEE2E2',
  },

  // Semantic colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Leaderboard ranks
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',

  // Neutral colors (from CSS variables)
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

// ============================================================================
// SHADOW TOKENS
// ============================================================================
export const shadows = {
  // Shadow system with elevation levels
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Glassmorphism shadow (subtle elevation with backdrop)
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
};

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================
export const borderRadius = {
  xs: '0.25rem', // 4px
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  full: '9999px',
};

// ============================================================================
// ANIMATION TOKENS
// ============================================================================
export const animations = {
  // Transition durations
  durations: {
    instant: '0ms',
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
    slower: '500ms',
  },

  // Easing functions
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Predefined animations
  transitions: {
    default: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ============================================================================
// LAYOUT TOKENS
// ============================================================================
export const layout = {
  // Container sizes
  containerMax: '1600px', // 2xl
  sidebarWidth: '16rem', // 256px (w-64)
  
  // Standard padding
  pagePadding: '1.5rem', // 24px
  cardPadding: '1.5rem', // 24px
  
  // Z-index hierarchy
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 40,
    sticky: 50,
    fixed: 60,
    modal: 70,
    popover: 80,
    tooltip: 90,
  },
};

// ============================================================================
// COMPONENT THEME TOKENS
// ============================================================================
export const components = {
  // Button sizing
  button: {
    sm: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
    md: { padding: '0.5rem 1rem', fontSize: '1rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
  },

  // Badge sizing
  badge: {
    sm: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
    md: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
  },

  // Input sizing
  input: {
    height: '2.5rem', // 40px
    padding: '0.75rem 1rem',
    borderRadius: '0.375rem',
  },

  // Card configurations
  card: {
    default: {
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid',
    },
    elevated: {
      shadow: shadows.lg,
    },
  },
};

// ============================================================================
// CATEGORY PALETTE (for Appreciate page)
// ============================================================================
export const categoryColorPalette = [
  { color: '#8B5CF6', bg: '#F3E8FF' }, // Purple
  { color: '#F59E0B', bg: '#FFFBEB' }, // Amber
  { color: '#A78BFA', bg: '#F5F3FF' }, // Light Purple
  { color: '#10B981', bg: '#ECFDF5' }, // Emerald
  { color: '#EC4899', bg: '#FCE7F3' }, // Pink
  { color: '#0EA5E9', bg: '#F0F9FF' }, // Cyan
  { color: '#EF4444', bg: '#FEE2E2' }, // Red
];

// ============================================================================
// THEME CONFIGURATION
// ============================================================================
export const themes = {
  light: {
    background: 'hsl(100 100% 100%)',
    foreground: 'hsl(18 15% 6%)',
    card: 'hsl(100 100% 100%)',
    cardForeground: 'hsl(18 15% 6%)',
    muted: 'hsl(35 25% 93%)',
    mutedForeground: 'hsl(35 18% 45%)',
  },
  dark: {
    background: 'hsl(18 15% 6%)',
    foreground: 'hsl(40 25% 96%)',
    card: 'hsl(22 18% 10%)',
    cardForeground: 'hsl(40 25% 96%)',
    muted: 'hsl(35 20% 20%)',
    mutedForeground: 'hsl(35 25% 70%)',
  },
};
