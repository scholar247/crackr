---
name: Academic Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#414847'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#717977'
  outline-variant: '#c0c8c7'
  surface-tint: '#416562'
  primary: '#001d1c'
  on-primary: '#ffffff'
  primary-container: '#0d3331'
  on-primary-container: '#789c99'
  inverse-primary: '#a8ceca'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#3c0002'
  on-tertiary: '#ffffff'
  tertiary-container: '#620208'
  on-tertiary-container: '#ef6c63'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4eae6'
  primary-fixed-dim: '#a8ceca'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#294d4a'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#87201e'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  code-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for high-stakes academic environments, blending the reliability of an established educational institution with the streamlined efficiency of a modern SaaS platform. The aesthetic is built on **Modern Minimalism**, prioritizing cognitive ease for students processing dense information.

The interface focuses on clarity, using generous whitespace to separate complex concepts and a disciplined color application to guide the user's focus. The emotional response is one of calm, professional intelligence—moving away from the "gamified" look of casual learning apps toward a serious, focused tool for achievement. Visual depth is achieved through structural hierarchy rather than decorative elements, ensuring the content remains the primary protagonist.

## Colors

This design system utilizes a sophisticated, high-contrast palette optimized for long study sessions.

- **Primary (Deep Teal - #0D3331):** Used for primary typography, navigation backgrounds, and high-emphasis brand moments. It provides a grounded, authoritative feel.
- **Secondary (Emerald - #14B8A6):** Represents progress, success, and active states. This color is used for "Correct" indicators in MCQs and primary call-to-action buttons.
- **Tertiary (Soft Coral - #F47067):** Reserved strictly for errors, warnings, and critical alerts to ensure immediate recognition without causing visual anxiety.
- **Neutral (Slate Gray - #64748B):** Used for secondary text, metadata, and iconography to maintain a clean visual hierarchy.
- **Surface:** The background is a crisp white (#FFFFFF) with subtle off-white (#F8FAFC) used for section nesting and card containers to prevent eye strain.

## Typography

The typography strategy employs a dual-font system to balance personality with utility. **Plus Jakarta Sans** is used for headlines to provide a friendly yet modern character, while **Inter** is utilized for all body copy and UI labels to ensure maximum legibility at small sizes and in dense data environments.

Hierarchy is enforced through tight weight control. Primary headings are always bold and set in the Primary Teal color. Body text uses a slightly increased line height (1.5x) to facilitate "active reading" and scanning of academic passages. For mobile, headline sizes are scaled down to ensure content density remains appropriate for the screen width.

## Layout & Spacing

The design system follows a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The layout philosophy is "Content-First," meaning margins and gutters are generous enough to prevent the UI from feeling cluttered, even when displaying complex tables or multi-step questions.

- **Grid:** Columns are separated by a 24px gutter. On desktop, the maximum container width is 1280px to maintain comfortable line lengths for reading.
- **Rhythm:** An 8px linear scale is used for all internal component spacing (padding, gaps).
- **Adaptation:** On mobile devices, side margins compress to 16px. Vertical spacing between content blocks (e.g., between an MCQ question and its options) remains consistent across devices to maintain the logical grouping of information.

## Elevation & Depth

To maintain a clean, SaaS-like aesthetic, this design system avoids heavy drop shadows. Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**:

- **Level 0 (Base):** Standard page background (#FFFFFF).
- **Level 1 (Surface):** Cards and content containers use a subtle 1px border (#E2E8F0) and a soft, barely visible shadow (0px 1px 3px rgba(13, 51, 49, 0.05)).
- **Level 2 (Interaction):** Hover states for interactive elements use a slight background tint shift or a slightly more defined border (#CBD5E1) rather than a shadow increase.
- **Level 3 (Overlay):** Modals and dropdowns use a crisp 1px border with a medium-diffusion shadow to separate them from the primary interface.

## Shapes

The shape language is "Soft," utilizing a 4px (0.25rem) base radius. This provides a professional, structured look that feels modern without being overly casual or "bubbly."

- **Standard Elements:** Buttons, inputs, and small widgets use `rounded-sm` (4px).
- **Large Containers:** Content cards and module wrappers use `rounded-lg` (8px).
- **Full Rounded:** Progress bars and status tags (pills) use a fully rounded value to distinguish them as non-interactive or purely informational elements.

## Components

### Buttons
- **Primary:** Solid #0D3331 background with White text. Used for "Start Test" or "Submit."
- **Secondary:** Outlined with #0D3331 border and text. Used for "Save for Later" or "Cancel."
- **Ghost:** No border/background, used for secondary navigation or utility actions.

### MCQ Widgets
Interactive question blocks use a vertical stack on mobile and a 2-column grid on desktop. Options use a 1px border; when selected, the border changes to the Secondary Emerald with a 10% opacity Emerald fill.

### Data Tables
Tables for performance metrics use a minimal style with no vertical lines. Row separators are a subtle 1px gray. The header row is set in the Primary Teal with `label-md` typography.

### Progress Indicators
Progress is shown using thin (4px) bars in Emerald. For multi-subject tracking, use a light gray track with an Emerald fill to represent completion percentages.

### Cards
All content is grouped in white cards with `rounded-lg` (8px) corners and a 1px #E2E8F0 border. Cards should not have shadows when used inside a parent container that already has a border.

### Input Fields
Inputs use a white background with a 1px border. On focus, the border shifts to Primary Teal with a subtle 2px outer glow (ring) in a 10% opacity Teal.