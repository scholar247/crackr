---
name: Kinetic Horizon
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-sm: 1rem
  margin-lg: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a high-performance, structured EdTech environment optimized for momentum and mastery. It serves ambitious adult learners, engineers, and certification candidates transitioning through three rigorous phases: **Learn**, **Practice**, and **Benchmark**. 

The aesthetic is modern, disciplined, and luminous. It rejects gamified childishness in favor of precision, momentum, and cognitive clarity. The interface relies on crisp white canvases, structural hairline dividers, and high-energy optical gradients that signal forward trajectory. Micro-interactions are snappy (150ms–200ms) with purposeful kinetic feedback, ensuring focus remains on deep work rather than visual distraction.

## Colors

The palette leverages an authoritative neutral foundation elevated by intentional chromatic milestones tied directly to the learning cycle:

- **Primary Canvas & Neutrals**: Grounded on `#FFFFFF` base canvas with layered neutral tiers: `#0F172A` (Slate 900) for authoritative typography, `#475569` (Slate 600) for contextual body text, and `#E2E8F0` / `#F1F5F9` (Slate 200/100) for crisp hairlines and nested panels.
- **Learn Phase (Core Engine)**: Driven by Electric Blue (`#2563EB`) shifting dynamically into Vivid Violet (`#7C3AED`) via 135-degree linear gradients (`linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)`). Used for primary CTAs, active study modules, and core navigation.
- **Practice Phase (Active Effort)**: Represented by Warm Amber (`#F59E0B`). Reserved for practice sessions, flashcard decks, streak indicators, and mid-tier difficulty tiers.
- **Benchmark Phase (Mastery & Validation)**: Anchored by Emerald (`#10B981`). Strictly deployed for verified assessments, percentile gains, passing marks, and diagnostic telemetry.
- **Surface Tones**: Interactive card backgrounds employ pure white `#FFFFFF` layered over subtle page canvas `#F8FAFC`, ringed with translucent borders (`rgba(15, 23, 42, 0.06)`).

## Typography

The typographic hierarchy pairs **Plus Jakarta Sans** for structural headlines with **Inter** for technical body and numerical data. 

- **Display & Headings**: Rendered in Plus Jakarta Sans with geometric balance and tight letter spacing. Heavy weights (700/800) anchor modules, while medium-to-semibold weights organize subordinate content.
- **Body & Metrics**: Rendered in Inter with proportional tabular figures enabled (`font-feature-settings: 'tnum' on, 'cv05' on`). This ensures assessment scores, countdown timers, and analytical tables align without horizontal jitter.
- **Labels & Micro-Tags**: Styled in uppercase or condensed tracking for phase categorizations (`LEARN`, `PRACTICE`, `BENCHMARK`), enforcing strict structural categorization throughout the interface.

## Layout & Spacing

The layout is built on an adaptive 12-column responsive grid centered within a maximum width of `1360px`.

- **Breakpoints**: 
  - Mobile (`< 768px`): 4 columns, 16px (`gutter-sm`) gutters, 16px (`margin-sm`) margins.
  - Tablet (`768px – 1024px`): 8 columns, 24px (`gutter`) gutters, 32px margins.
  - Desktop (`> 1024px`): 12 columns, 24px–32px (`gutter-lg`) gutters, dynamic margins maxing at 64px (`margin-lg`).
- **Tri-Phasic Architecture**: The three-step cycle (Learn $\rightarrow$ Practice $\rightarrow$ Benchmark) is mapped to equal 4-column groupings on desktop grids or sequential vertical carousels on mobile views.
- **Vertical Rhythm**: Built using an 8pt base grid for spacing tokens. Component interiors scale systematically using `space-md` for standard density and `space-lg` for primary diagnostic dashboards.

## Elevation & Depth

Visual hierarchy combines low-opacity ambient shadows with delicate 1px perimeter outlines, avoiding heavy skeuomorphic shading in favor of luminous spatial layers.

- **Level 0 (Flat Canvas)**: `#F8FAFC` base application shell.
- **Level 1 (Card & Module Resting)**: Pure white `#FFFFFF` surface with a 1px boundary of `rgba(15, 23, 42, 0.08)` and an ambient drop shadow: `0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 16px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Active & Hovered Nodes)**: Elevated card states introduce an expanded soft blur accompanied by a localized color-glow halo: `0 12px 28px -4px rgba(37, 99, 235, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)`. Outlines shift from neutral slate to `rgba(37, 99, 235, 0.25)`.
- **Level 3 (Modals & Flyouts)**: Elevated control panels, exam runtimes, and diagnostic overlays use an ambient drop shadow: `0 24px 48px -12px rgba(15, 23, 42, 0.16)`.
- **Glow Accents**: High-priority interactive triggers and current-phase markers use a subtle colored under-glow (`box-shadow: 0 0 20px rgba(124, 58, 237, 0.15)`).

## Shapes

The interface embraces a refined curved architecture configured at roundedness level `2`:

- **Modular Panels & Cards**: Core functional containers use `rounded-2xl` (16px / 1rem radius) to frame modules cleanly while maintaining architectural order.
- **Buttons & Action Triggers**: Primary touchpoints use `rounded-xl` (12px / 0.75rem) to offer distinct press feedback.
- **Badges, Tags, & Status Pills**: Retain a continuous circular curvature (`rounded-full` / 9999px) to contrast against rectilinear card layouts.
- **Form Fields & Progress Wells**: Match button roundedness (`rounded-xl`) for consistency along interactive horizontal bands.

## Components

### Buttons
- **Primary Kinetic**: Filled with `linear-gradient(135deg, #2563EB, #7C3AED)`, white text, `rounded-xl`, padding `12px 24px`. Hover triggers a brightness increase and subtle directional glow (`box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25)`). Active state applies a scale transform (`transform: scale(0.98)`).
- **Secondary / Surface**: Pure white background, `1px solid #E2E8F0`, slate-900 text. Hover switches border color to `#CBD5E1` and background to `#F8FAFC`.
- **Ghost Action**: Transparent background with blue or violet text, used for low-friction controls like inline dismissals and secondary learning skips.

### Metric & Phase Cards
- Configured with `rounded-2xl`, `#FFFFFF` surface, and a 1px border (`#F1F5F9`).
- **Interactive State**: Top edge includes a 2px hidden highlight line that transitions to the corresponding phase color (Blue, Amber, or Emerald) on hover or active progress.
- Padding uses `space-lg` (24px) internally, maintaining distinct visual rhythm between titles, body stats, and completion bars.

### Chips & Phase Badges
- Compact pill elements (`rounded-full`) with uppercase typography (`label-sm`).
- **Learn Badge**: `#EFF6FF` background, `#1D4ED8` text, `#DBEAFE` border.
- **Practice Badge**: `#FFFBEB` background, `#B45309` text, `#FDE68A` border.
- **Benchmark Badge**: `#ECFDF5` background, `#047857` text, `#A7F3D0` border.

### Checkboxes & Radio Controls
- Base: 20px size with `rounded-md` (checkbox) or `rounded-full` (radio).
- **Unchecked**: Crisp white interior with `1.5px solid #CBD5E1`.
- **Selected**: Solid `#2563EB` fill displaying a sharp white geometric checkmark or central indicator dot, ringed by a 3px soft focus halo (`rgba(37, 99, 235, 0.15)`).

### Input Fields & Search Bars
- Background `#FFFFFF`, border `1.5px solid #E2E8F0`, text slate-900, placeholder slate-400.
- Padding: `12px 16px`, `rounded-xl`.
- **Focus State**: Border shifts smoothly to `#2563EB` paired with an ambient ring: `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)`.

### Benchmark Progress Rings & Rails
- Custom visual bars featuring an `#F1F5F9` track and a vibrant gradient fill (`#2563EB` to `#10B981`) denoting user position against target benchmark percentiles. High-performance milestones trigger pulse-glow micro-animations.