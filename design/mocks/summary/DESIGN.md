---
name: Scholar247 Communities
colors:
  surface: '#FFFFFF'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414847'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717977'
  outline-variant: '#c0c8c7'
  surface-tint: '#416562'
  primary: '#001d1c'
  on-primary: '#ffffff'
  primary-container: '#0d3331'
  on-primary-container: '#789c99'
  inverse-primary: '#a8ceca'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#00173c'
  on-tertiary: '#ffffff'
  tertiary-container: '#002b64'
  on-tertiary-container: '#5692ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c4eae6'
  primary-fixed-dim: '#a8ceca'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#294d4a'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  text-primary: '#0D3331'
  text-muted: '#64748B'
  border-subtle: '#E2E8F0'
  official-emerald: '#10B981'
  interaction-indigo: '#3B82F6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
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
    letterSpacing: 0.02em
  label-sm-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter-md: 24px
  margin-page: 32px
  margin-mobile: 16px
  stack-sm: 12px
  stack-md: 20px
---

## Brand & Style

The design system for Scholar247 Communities is built on the principle of **Academic Precision**. It rejects the overly playful "gamification" of modern education apps in favor of a sophisticated, high-performance environment that bridges the gap between a high-end research tool and a modern professional network. 

The style is **Modern Corporate**, utilizing a light-mode first approach with crisp surfaces and high-contrast typography to ensure maximum legibility during intense study sessions. The aesthetic is defined by its discipline: heavy use of whitespace, structured information density, and a reliance on color for functional signaling rather than decoration. The goal is to evoke a sense of intellectual authority, focus, and peer-to-peer trust.

## Colors

The palette is anchored by **Dark Teal (#0D3331)**, used primarily for headings and core structural elements to provide a scholarly weight to the UI. **Emerald (#10B981)** acts as the primary accent, reserved for success states, verification, and "Joined" community status. **Indigo (#3B82F6)** is used strategically for interactive links and secondary actions, signaling "utility" and "connectivity."

- **Primary:** Dark Teal for typography and brand presence.
- **Accent:** Emerald for validation, "Official" markers, and positive progress.
- **Secondary:** Indigo for functional interactions and clickable elements.
- **Surface:** Pure White (#FFFFFF) for cards and content areas to maximize contrast.
- **Background:** Soft Gray (#F8F9FA) to provide a gentle backing that reduces screen glare.

## Typography

This system uses a dual-typeface strategy to separate brand identity from information consumption. **Plus Jakarta Sans** provides a modern, geometric clarity for headlines, lending a friendly but professional character to community titles and section headers. 

**Inter** is the workhorse for all body content, discussion threads, and labels. It is chosen for its exceptional legibility in long-form text. 
- **Readability:** Body text uses a 1.5x line-height to prevent eye fatigue during long discussions.
- **Hierarchy:** Use `label-sm-caps` for metadata (timestamps, category tags) to distinguish them clearly from the primary narrative.
- **Mobile:** Headlines scale down on mobile to prevent awkward line breaks while maintaining the 700-weight "Academic" authority.

## Layout & Spacing

The layout utilizes a **Fixed Grid** system for desktop (max-width 1200px) to keep line lengths for academic discussions within the optimal reading range (60-80 characters). 

- **Threaded Logic:** Comment threads use a nested indentation of 24px on desktop and 12px on mobile to show relationship without sacrificing horizontal space.
- **Rhythm:** An 8px spacing scale governs all components. Vertical stacks within post feeds use 20px gaps to ensure individual posts are distinct.
- **Breakpoints:**
  - **Desktop (1024px+):** 12-column grid with a fixed sidebar for community navigation.
  - **Tablet (768px - 1023px):** 8-column fluid grid; sidebars collapse into a drawer.
  - **Mobile (<767px):** Single-column fluid layout with 16px side margins.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows, maintaining a clean, systematic look.

- **Surface Tiers:** The main background is Soft Gray. Primary content cards are Pure White with a 1px border (#E2E8F0).
- **Interactive Depth:** On hover, cards transition to a slightly darker border (#CBD5E1) and an ultra-subtle, diffused shadow (0px 4px 12px rgba(13, 51, 49, 0.04)). 
- **Modal Elevation:** Overlays and dropdown menus use a more pronounced 1px border in Dark Teal (at 10% opacity) and a backdrop blur to maintain focus on the task at hand.

## Shapes

The design uses a **Rounded (0.5rem)** logic to balance professional structure with modern approachability.

- **Cards & Inputs:** Use the base `rounded-md` (0.5rem) for a stable, architectural feel.
- **Badges & Tags:** Use `rounded-full` (pill-shaped) to distinguish them as non-structural, metadata elements.
- **Primary Buttons:** Utilize `rounded-md` (0.5rem) to align with the layout grid, reinforcing a sense of "systematic" interaction.

## Components

### Badges
- **Official:** Emerald fill (10% opacity) with a solid Emerald 1px border. Includes a small Emerald checkmark icon. Text is `label-sm-caps` in Dark Teal.
- **Community Created:** Transparent background with a dashed 1px Slate Gray border. Displays the creator's handle (e.g., "by @user123") in `body-sm`.

### Community Cards
- **Official Communities:** Feature a subtle Emerald top-border (4px) and prominent display of the "Official" badge.
- **User Communities:** Clean White card with standard Slate Gray borders and the "Community Created" badge.

### Post Feeds & Comments
- **Post Feed:** Reddit-style vertical clarity (Upvote/Downvote/Score on the left) merged with LinkedIn-style professional spacing and typography. Titles use `headline-md` in Dark Teal.
- **Threaded Comments:** Use a "Thread Line"—a 2px solid vertical line in Soft Gray that turns Emerald on hover—to visually guide the user through the discussion hierarchy.

### Interactive States
- **Buttons:**
  - **Primary:** Dark Teal background. Hover: Background shifts to a deeper shade; Active: Slight 2px scale down.
  - **Joined State:** Transitions from a solid button to an outlined Emerald button with a checkmark, signaling a persistent active status.
- **Inputs:** Pure White background with 1px Slate Gray border. On focus, the border becomes Indigo with a 3px soft Indigo outer glow.