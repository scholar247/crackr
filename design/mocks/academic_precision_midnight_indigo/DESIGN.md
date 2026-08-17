---
name: Academic Precision & Midnight Indigo
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
  on-surface-variant: '#464554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#553300'
  on-tertiary: '#ffffff'
  tertiary-container: '#744800'
  on-tertiary-container: '#ffb759'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1120px
  focus-padding: 48px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
This design system is engineered for high-stakes academic environments, prioritizing cognitive clarity, focus, and rhythmic progression. It utilizes a **Corporate / Modern** foundation with **Minimalist** leanings to eliminate peripheral distractions during examination phases. 

The aesthetic is characterized by structured information density, precise alignment, and a clear visual hierarchy that distinguishes between navigational controls and critical test content. The "Midnight Indigo" variant provides a deep-space dark mode for prolonged focus, while the light mode offers a high-legibility, paper-like experience. The emotional response is one of calm authority, reliability, and academic rigor.

## Colors
The palette is centered around **Indigo** for primary actions and active states. For examination states, a specific functional palette is employed:
- **Primary (Indigo):** Used for "Active/Current" questions and primary calls to action.
- **Success (Emerald):** Denotes "Attempted" status, providing a positive visual confirmation.
- **Muted (Slate):** Used for "Not Attempted" items to recede in the visual field.
- **Warning (Amber):** Highlights "Marked for Review," requiring higher visual prominence without signaling an error.

The design system supports two modes:
- **Light Mode:** High-contrast text (#0F172A) on a neutral-cool background (#F8FAFC).
- **Dark Mode:** Indigo-tinted dark surfaces (#020617) with soft white text (#F8FAFC) to reduce eye strain.

## Typography
The typographic system utilizes **Manrope** for structural headings to provide a modern, technical feel, while **Inter** is used for body text to ensure maximum legibility for long-form exam questions. **JetBrains Mono** is introduced for labels, question numbering, and metadata (timer, progress counts) to emphasize precision and technical accuracy.

For the "Focus Mode," body text sizes are slightly increased (body-lg) to maintain a comfortable reading rhythm and prevent cognitive fatigue. High contrast ratios are strictly maintained (minimum 7:1 for body text) in both color modes.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for the central content area to prevent line lengths from becoming too long for comfortable reading. 

- **Focus-Mode Surface:** In examination view, the content is centered within a 1120px container.
- **Vertical Rhythm:** A strict 4px/8px baseline grid is used to align all components.
- **Margins:** Generous white space (48px internal padding in question cards) is used to isolate the question from the navigation interface.
- **Responsive Behavior:** On mobile, margins reduce to 16px, and the "Question Navigator" shifts from a side-bar to a bottom-sheet or top-toggle to maximize vertical space for the question content.

## Elevation & Depth
This design system uses **Tonal Layers** rather than heavy shadows to indicate depth, maintaining a "flat" professional aesthetic.

- **Level 0 (Base):** The main background (Light: #F8FAFC / Dark: #020617).
- **Level 1 (Surface):** Question cards and content containers. In light mode, these use a subtle 1px border (#E2E8F0). In dark mode, they use a slightly lighter indigo-tinted surface (#0F172A).
- **Active State:** The current question being viewed utilizes a **Low-contrast outline** (2px solid Indigo) to signify focus without adding bulk.
- **Shadows:** Only used for floating action buttons or temporary modals, utilizing extra-diffused, low-opacity shadows (e.g., `box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)`).

## Shapes
A **Soft (1)** shape language is applied to convey modern professionalism without appearing overly casual. 
- **Standard UI elements:** 4px (0.25rem) corner radius (buttons, input fields).
- **Container elements:** 8px (0.5rem) corner radius (question cards, navigation panels).
- **Status Indicators:** Question numbers in the navigator use the `rounded-lg` (8px) setting for a distinct, button-like appearance.

## Components
- **Question Navigator Chips:** 
  - *Attempted:* Emerald background with white text.
  - *Not Attempted:* Slate-200 (Light) / Slate-800 (Dark) background.
  - *Marked for Review:* Amber background with dark slate text.
  - *Active:* 2px Indigo border with Indigo text and a subtle 10% Indigo background tint.
- **Primary Buttons:** High-contrast Indigo background, 4px roundedness, JetBrains Mono labels in uppercase for a "functional" feel.
- **Input Fields (Radio/Checkbox):** Large tap targets (min 44px height). Selected states use the Active/Indigo token for the stroke and a 2px offset white/dark-blue ring for high-visibility focus.
- **Progress Bar:** A thin (4px) track at the very top of the viewport. The track is Slate, and the fill is Indigo.
- **Focus Mode Surface:** A dedicated container style that hides all global navigation, leaving only the "Exit Focus" and "Submit" actions visible in a secondary utility bar.