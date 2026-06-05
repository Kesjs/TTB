// Design Tokens - Top Talent Bénin
// Ce fichier centralise tous les tokens de design pour assurer la cohérence

export const colors = {
  // Primary colors
  primary: {
    gold: '#e5c47f',
    goldHover: '#d4b36e',
    goldLight: '#f0d99a',
  },
  
  // Neutral colors
  neutral: {
    black: '#09090b',
    dark: '#18181b',
    gray: '#27272a',
    light: '#a1a1aa',
    lighter: '#d4d4d8',
    white: '#fafafa',
  },
  
  // Semantic colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Background colors
  background: {
    primary: '#09090b',
    secondary: '#18181b',
    tertiary: '#27272a',
    card: '#18181b',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
  
  // Text colors
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    tertiary: '#71717a',
    muted: '#52525b',
  },
  
  // Border colors
  border: {
    primary: '#27272a',
    secondary: '#3f3f46',
    tertiary: '#52525b',
    gold: '#e5c47f',
  },
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    heading: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.025em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  gold: '0 4px 14px 0 rgba(229, 196, 127, 0.3)',
};

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
};

export const animation = {
  duration: {
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.5s',
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// Export des tokens par catégorie pour un accès facile
export const designTokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  animation,
};
