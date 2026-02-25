---
name: ui-ux-pro-max-skill
description: "Provides UI/UX design rules, priority guidelines, and delivery checklists for web and mobile. Use when designing components, choosing colors/typography, reviewing UX, building landing pages or dashboards, or implementing accessibility. Covers accessibility, touch targets, performance, layout, typography, animation, style consistency, and charts. Stacks: React, Next.js, Vue, Svelte, Tailwind, shadcn/ui."
---

# UI/UX Pro Max

Design rules and checklists for web and mobile. Apply when doing plan, build, create, design, implement, review, fix, or improve UI/UX.

## When to Apply

- Designing new UI components or pages
- Choosing color palettes and typography
- Reviewing code for UX issues
- Building landing pages, dashboards, or forms
- Implementing accessibility

## Rule Priority

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Accessibility | CRITICAL |
| 2 | Touch & Interaction | CRITICAL |
| 3 | Performance | HIGH |
| 4 | Layout & Responsive | HIGH |
| 5 | Typography & Color | MEDIUM |
| 6 | Animation | MEDIUM |
| 7 | Style & Consistency | MEDIUM |
| 8 | Charts & Data | LOW |

## Quick Reference

### 1. Accessibility (CRITICAL)
- **color-contrast** — Min 4.5:1 for normal text
- **focus-states** — Visible focus rings on interactive elements
- **alt-text** — Descriptive alt for meaningful images
- **aria-labels** — aria-label for icon-only buttons
- **keyboard-nav** — Tab order matches visual order
- **form-labels** — Use `<label for="...">`

### 2. Touch & Interaction (CRITICAL)
- **touch-target-size** — Min 44×44px
- **hover-vs-tap** — Use click/tap for primary actions
- **loading-buttons** — Disable during async
- **error-feedback** — Clear errors near the problem
- **cursor-pointer** — On all clickable elements

### 3. Performance (HIGH)
- **image-optimization** — WebP, srcset, lazy loading
- **reduced-motion** — Honor `prefers-reduced-motion`
- **content-jumping** — Reserve space for async content

### 4. Layout & Responsive (HIGH)
- **viewport-meta** — `width=device-width, initial-scale=1`
- **readable-font-size** — Min 16px body on mobile
- **horizontal-scroll** — No overflow-x on viewport
- **z-index-management** — Use a scale (e.g. 10, 20, 30, 50)

### 5. Typography & Color (MEDIUM)
- **line-height** — 1.5–1.75 for body
- **line-length** — 65–75 characters per line
- **font-pairing** — Match heading/body personality

### 6. Animation (MEDIUM)
- **duration-timing** — 150–300ms for micro-interactions
- **transform-performance** — Prefer transform/opacity over width/height
- **loading-states** — Skeleton or spinner

### 7. Style & Consistency (MEDIUM)
- **style-match** — Match style to product type
- **consistency** — Same style across pages
- **no-emoji-icons** — Use SVG icons (Heroicons, Lucide), not emojis

### 8. Charts & Data (LOW)
- **chart-type** — Match chart to data type
- **color-guidance** — Accessible palettes
- **data-table** — Table alternative for a11y

## Workflow

1. **Analyze** — Product type (SaaS, e-commerce, dashboard, etc.), style keywords, stack (default html-tailwind).
2. **Apply rules** — Use the priority table above; address CRITICAL and HIGH first.
3. **Implement** — Follow stack conventions (Tailwind, Vue, React, etc.).
4. **Check** — Run the Pre-Delivery Checklist before handing off.

## Common Rules (Professional UI)

### Icons & Visual
| Do | Don't |
|----|-------|
| SVG icons (Heroicons, Lucide) | Emojis as UI icons |
| Color/opacity on hover | Scale that shifts layout |
| Official SVG from Simple Icons for logos | Guessed or wrong logos |
| Fixed viewBox (e.g. 24×24), consistent size | Random icon sizes |

### Interaction
| Do | Don't |
|----|-------|
| `cursor-pointer` on clickable cards | Default cursor on interactive |
| Visual feedback (color, shadow, border) on hover | No feedback |
| `transition-colors duration-200` | Instant or >500ms |

### Light/Dark Contrast
| Do | Don't |
|----|-------|
| `bg-white/80` or higher for glass in light | `bg-white/10` |
| `#0F172A` (slate-900) for body text | slate-400 for body |
| `#475569` (slate-600) for muted | gray-400 for muted |
| `border-gray-200` in light | `border-white/10` in light |

### Layout
| Do | Don't |
|----|-------|
| Floating nav: `top-4 left-4 right-4` | Nav at `top-0` with no spacing |
| Padding for fixed navbar height | Content under fixed elements |
| Same max-width (e.g. `max-w-6xl`) | Mixed container widths |

## Pre-Delivery Checklist

### Visual
- [ ] No emojis as icons; use SVG
- [ ] Icons from one set (Heroicons/Lucide)
- [ ] Brand logos from Simple Icons
- [ ] Hover states don’t shift layout
- [ ] Use theme colors directly (e.g. `bg-primary`)

### Interaction
- [ ] Clickable elements have `cursor-pointer`
- [ ] Hover feedback is clear
- [ ] Transitions 150–300ms
- [ ] Focus states visible (keyboard)

### Light/Dark
- [ ] Text contrast ≥ 4.5:1
- [ ] Glass/transparent visible in light mode
- [ ] Borders visible in both modes

### Layout
- [ ] Floating elements spaced from edges
- [ ] No content under fixed nav
- [ ] Responsive at 375, 768, 1024, 1440px
- [ ] No horizontal scroll on mobile

### Accessibility
- [ ] Images have alt text
- [ ] Inputs have labels
- [ ] Color not the only indicator
- [ ] `prefers-reduced-motion` respected
