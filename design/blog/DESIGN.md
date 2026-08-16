---
name: Midnight Indigo
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#5de6ff'
  on-secondary: '#00363e'
  secondary-container: '#00cbe6'
  on-secondary-container: '#00515d'
  tertiary: '#c0c6db'
  on-tertiary: '#293040'
  tertiary-container: '#8a90a4'
  on-tertiary-container: '#232a39'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#a2eeff'
  secondary-fixed-dim: '#2fd9f4'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#dce2f7'
  tertiary-fixed-dim: '#c0c6db'
  on-tertiary-fixed: '#141b2b'
  on-tertiary-fixed-variant: '#404758'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system for this exam prep platform is built on a "Midnight Indigo" aesthetic—a sophisticated blend of high-performance technical precision and deep, immersive focus. The target audience consists of students and professionals who require a distraction-free, high-contrast environment for long study sessions.

The design style is **Glassmorphic-Technic**. It utilizes deep obsidian surfaces layered with translucent glass effects to create a sense of depth without visual clutter. The emotional response is one of calm authority and "flow state" productivity. High-contrast accents in Electric Cobalt and Neon Cyan act as digital beacons, guiding the user toward critical actions and progress milestones.

## Colors
The palette is rooted in a deep-space foundation to reduce eye strain.

- **Background**: `#090D16` (Obsidian) provides the infinite canvas for study.
- **Surface**: `#111827` (Deep Slate) is used for cards and containers, creating a clear distinction from the background.
- **Primary Accent**: `#3B82F6` (Electric Cobalt) is reserved exclusively for high-priority CTAs and primary navigation markers.
- **Secondary Accent**: `#22D3EE` (Neon Cyan) is used for "Active" states, progress indicators, and specialized badges to provide a sharp, technical contrast.
- **Feedback States**: 
    - Success: Neon Cyan / Emerald Green mix.
    - Error: Vivid Crimson.
    - Warning: Amber Glow.

## Typography
The system uses **Geist** for its exceptional legibility in technical contexts. 

Headings should always use the `Pure White (#F8FAFC)` color to ensure they pop against the dark background. Body text uses `Slate Gray (#94A3B8)` to create a comfortable hierarchy that doesn't overwhelm the reader during long-form question passages. For monospaced data (like code snippets in exam questions), use the Mono variant of the font family at a 0.9x scale of the current body size.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop, collapsing to 4 columns on mobile devices. 

The rhythm is based on a **4px baseline grid**. Consistent 24px (lg) margins are required for all main containers to maintain a "breathable" high-end feel. For exam interfaces, content should be centered in a restricted 800px column to improve reading speed and focus. Components should use `md` (16px) internal padding as a standard, increasing to `lg` (24px) for featured cards.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.

- **Level 0 (Background)**: `#090D16`.
- **Level 1 (Cards)**: `#111827` with a 1px solid border of `rgba(255, 255, 255, 0.08)`.
- **Level 2 (Active/Hover State)**: Elevate cards with a subtle `Neon Cyan` outer glow (0px 0px 15px rgba(34, 211, 238, 0.15)).
- **Overlays**: Use a background-blur of `12px` on modals and dropdowns to maintain the glass effect while ensuring text remains legible over content.

## Shapes
The shape language is "Modern Geometric." Standard UI elements like buttons and input fields use a `0.5rem` (8px) radius. Larger containers (cards, modals) should use the `rounded-lg` (1rem) or `rounded-xl` (1.5rem) tokens to soften the technical edge of the dark theme. 

Selection indicators (like radio buttons in a quiz) should remain perfectly circular to differentiate them from the rectangular layout of the questions.

## Components
- **Glassmorphic Cards**: Use surface color `#111827` with the specified `0.08` white border. For "Featured" or "Current Lesson" cards, add a subtle top-border gradient from Electric Cobalt to Neon Cyan.
- **Buttons**:
    - **Primary**: Solid Electric Cobalt with white text. On hover, add a 10px spread Cyan glow.
    - **Secondary/Quiz Option**: Ghost style with white border. On selection, fill with a 10% opacity Cyan wash and a solid Cyan border.
- **Badges**: Use Neon Cyan text on a 10% opacity Cyan background with a uppercase label-sm font style.
- **Quiz Feedback**: 
    - **Correct**: Solid Neon Cyan border with a "Pulse" animation.
    - **Incorrect**: Deep Red background wash with a shake transition.
- **Input Fields**: Dark backgrounds with a 1px Slate Gray border. When focused, the border transitions to Electric Cobalt with a high-contrast cursor.