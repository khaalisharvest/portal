# Khaalis Harvest — Critical Design Review & Redesign Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire user-facing UI from ground up — fixing the brand system, color palette, typography, spacing, and every user screen to create a professional, premium, culturally resonant organic marketplace experience for the Pakistani market.

**Architecture:** Fix the global design system first (tailwind config, globals.css, layout.tsx), then rebuild each screen on top of the corrected foundation. Every screen redesign is a self-contained task.

**Tech Stack:** Next.js 14 App Router · Tailwind CSS · Framer Motion · Heroicons · Poppins (single font) · CSS custom properties

---

## PART 1 — CRITICAL DESIGN AUDIT

> This section is the evidence base. Every redesign decision in Part 2 traces back here.

---

### 1.1 — Brand Identity Analysis

**What the brand is:**
- "Khaalis" (خالص) means *pure / genuine / unadulterated* in Urdu — an extremely strong, meaningful name
- "Harvest" pairs the Urdu authenticity with an English agricultural word — bilingual, modern, accessible
- Taglines in use: "Pure Organic Products", "The Pure Embrace", "Pure • Organic • Authentic"
- Domain: Pakistan-first organic food marketplace (fruits, dairy, spices, vegetables, plants)
- Target user: Urban Pakistani families wanting trustworthy, natural food

**What the brand should feel like:**
Premium but accessible. Earthy but modern. Pakistani but globally professional. Think of where Whole Foods meets a Lahore bazaar — warm, trustworthy, authentic, clean.

**What the brand currently feels like:**
A generic Western green-organic template. Nothing in the current design signals Pakistan, warmth, or premium positioning. It could be any organic grocery app from any country. The brand name is excellent; the design doesn't honour it.

---

### 1.2 — Color System: CRITICAL FAILURES

#### Current Palette (tailwind.config.ts)

| Token | Value | Role |
|---|---|---|
| `primary-500` | `#4B8B3B` | Leaf Green — main brand |
| `secondary-500` | `#8B5E3C` | Earth Brown — secondary |
| `accent-500` | `#22c55e` | Fresh Mint Green — accent |
| `neutral-*` | Gray scale | Text/backgrounds |

#### Problem 1: Two greens, no contrast

`primary-500` (#4B8B3B) and `accent-500` (#22c55e) are BOTH green. The button gradient `from-primary-500 to-accent-500` goes from dark forest green to bright lime green. It's barely perceptible and creates no visual interest. A gradient should use colours on opposite ends of the temperature scale to be effective.

**Effect:** Buttons look flat. Nothing pops. The brand has no visual tension.

#### Problem 2: Earth Brown is invisible

`secondary-500` (#8B5E3C) — the most interesting, culturally resonant colour in the palette — appears in almost zero visible components. It's defined but never used intentionally. This is a design system that was designed and then ignored.

#### Problem 3: Orange intrusion — a ghost colour in the codebase

`orange-500` / `orange-600` (Tailwind built-in, NOT in the design system) appears in **at least 14 places**:

- `Header.tsx` — nav link hover colour: `hover:text-orange-600 hover:bg-orange-50`
- `Header.tsx` — cart icon hover: `group-hover:text-orange-600`
- `Header.tsx` — user avatar gradient: `from-orange-500 to-green-500`
- `Header.tsx` — mobile user avatar: `from-orange-500 to-green-500`
- `CTA.tsx` — entire section background: `from-orange-500 to-green-500`
- `CTA.tsx` — button text: `text-orange-600`
- `HowItWorks.tsx` — icon colour: `text-orange-600`
- `HowItWorks.tsx` — icon bg: `from-orange-100 to-green-100`
- `ProductCard.tsx` — "Add to Cart" button: `bg-orange-500 hover:bg-orange-600`
- `CartPage.tsx` — "Proceed to Checkout" button: `from-orange-500 to-green-500`
- `CartPage.tsx` — loading spinner: `border-orange-500`
- `AboutPage.tsx` — stats numbers: `text-orange-600`
- `AboutPage.tsx` — stats background: `from-orange-100 to-green-100`
- `Footer.tsx` — hover colours: `hover:text-orange-400`

This orange exists because someone found it warmer and more attractive than the brand green. They were right about the instinct (orange = warmth = food = appetite) but wrong about the execution (introduce it without defining it in the design system). The result is a visual identity crisis: the brand says "green organic" but the UI keeps reaching for "orange warmth."

**Effect:** The app has two competing visual personalities. Neither wins. Nothing coheres.

#### Problem 4: Gradient direction on buttons is wrong

`btn-primary` is `from-primary-500 to-accent-500` — two greens, left to right. On a horizontal button this creates almost zero visual impact. Premium buttons either use a single strong colour, or a gradient from a warm colour to a cool colour.

#### Verdict: The colour system needs a complete rethink.

---

### 1.3 — Typography: CRITICAL BUG

**Declared intent** (tailwind.config.ts):
- Headings: Poppins via `font-display`
- Body: Open Sans via `font-body`
- globals.css imports both from Google Fonts

**Actual reality** (layout.tsx line 11, 70):
```tsx
const inter = Import({ subsets: ['latin'] });
// ...
<body className={`${inter.className} organic-gradient`}>
```

`inter.className` is applied directly to `<body>`. Next.js `next/font` injects a CSS variable AND a class that sets `font-family` inline. This **overrides** the `font-body` Tailwind class because it has higher specificity. **Every user sees Inter.** Poppins and Open Sans are downloaded but never rendered — pure bandwidth waste.

**Additional issues:**
- Heading sizes in globals.css (`h1 { @apply text-4xl lg:text-5xl }`) conflict with the in-component overrides that use much larger sizes (`text-5xl md:text-7xl` on homepage)
- No consistent type scale used across screens — every page picks its own font sizes
- Noto Nastaliq Urdu is configured in Tailwind but zero Urdu text exists in the UI. This is a missed cultural opportunity and wasted config.

**Effect:** The entire type system is a fiction. The app renders in Inter system-wide. Poppins — which is perfect for this brand — is never seen.

---

### 1.4 — Background Images: WRONG APPROACH FOR THIS DOMAIN

Three full-page background images are in use:
1. `hero.png` — used as background for **entire homepage** (hero + products grid)
2. `products-section.png` — used as background for **entire products page**
3. `about-us.png` — used as background for **entire about page**

**Why this is wrong for a marketplace:**

When a customer is browsing products, their attention must go entirely to the product images. A background image competes for that attention. Every `overlay` applied (`overlayType="products"`, `overlayType="hero"`) proves this — you're spending loading time on an image only to obscure it with a semi-transparent layer.

The background images also:
- Add ~200-500KB per page load
- Create text readability problems (hence the overlays)
- Make the product card images look inconsistent (product photos on top of a background photo = visual chaos)
- Signal "template" rather than "crafted product"

**What to keep:** A single, contained hero image section on the homepage only — properly bounded, not spanning the products section.

---

### 1.5 — Component-Level Issues

#### Header
- Logo is `h-28` (112px) on desktop, making the header ~96px tall — premium sites use 60–72px
- Nav hover colours are orange (not in brand system)
- The search functionality doesn't exist in the header — users must navigate to the products page to search
- Two separate mobile-menu rendering systems causing z-index conflicts

#### ProductCard (ProductsSection grid)
- `px-2 py-2` padding — brutally tight, feels cheap
- Product name `line-clamp-1` on `text-xs sm:text-sm` — tiny text on small cards
- No hover animation/elevation on the card
- No category badge visible on card
- The "Add to Cart" is missing from the grid cards entirely — you must click through to detail page
- On mobile (2 columns), cards are ~50vw wide with h-36 images — acceptable but could be much richer

#### ProductCard standalone component
- Separate from ProductsSection grid — used only on homepage featured section
- Has `bg-orange-500` "Add to Cart" button
- Star ratings always show 0/0 (no review data piped through)
- Two ProductCard implementations creating inconsistency

#### About Page — Logo as Icon Bullet Points
- The values section uses `<Image src="/images/logo.png" />` as the bullet point icon for every value item
- This is the most unprofessional element in the entire app — the company logo is being used as a generic list marker

#### HowItWorks
- Icon circles use `from-orange-100 to-green-100` gradient — neither in brand system
- The connector line between steps is broken (uses `left-1/2` + `w-full` which overflows)
- Content is generic — identical to dozens of organic delivery templates

#### CTA Section
- `bg-gradient-to-r from-orange-500 to-green-500` — the orange-green gradient that haunts the entire app
- Looks like a banner ad, not a brand moment
- "Join thousands of satisfied customers" — statistically false for a startup, feels hollow

#### Cart Page
- Functional but visual design is completely different from the rest of the app
- Mixed `text-orange-600` and `border-orange-500` spinner
- "Proceed to Checkout" button: `from-orange-500 to-green-500` gradient again
- Order summary card uses `rounded-lg` while the rest of the app uses `rounded-2xl`

#### Auth Pages (Login/Signup)
- Functionally solid, cleanest pages in the app
- Logo at 144×144px above the form — oversized
- The `organic-gradient` background (light green-to-cream) works well here
- `card-elevated` style is appropriate
- Needs more warmth and brand character — currently feels like a generic SaaS login

#### Footer
- `bg-neutral-900` dark footer — works
- Social icons link to `#` — placeholder
- Copyright says "2024" — already stale

---

### 1.6 — Spacing & Layout Audit

| Area | Current | Verdict |
|---|---|---|
| Container | `max-w-7xl px-4 sm:px-6 lg:px-8` | Fine |
| Section vertical rhythm | `py-16` | Adequate, could be `py-20 lg:py-24` for premium feel |
| Card internal padding | `p-6` / `px-2 py-2` on product cards | Product cards are way too tight |
| Product image height | `h-36 sm:h-40 md:h-44 lg:h-48` | Too short — premium food marketplaces use taller images |
| Grid gap | `gap-3 sm:gap-6` | Gap-3 on mobile is too tight |
| Header height | `h-16 sm:h-20 lg:h-24` | `h-24` (96px) is too tall |
| Type scale consistency | None — every page overrides | Broken |
| Button padding | `py-3 px-6` in globals.css | Fine |

---

### 1.7 — Domain-Specific Failures (Pakistan Organic Marketplace)

1. **No cultural warmth** — A Pakistani marketplace should feel warm, trustworthy, and familiar. Cold white backgrounds and generic orange-green do not achieve this.

2. **Saffron/Gold is missing** — In Pakistani culture, golden/saffron tones signal quality, richness, and organic authenticity (think of kesar, golden turmeric, wheat). This is a natural accent colour that the brand is entirely ignoring.

3. **Urdu is absent** — The app is 100% English. Even a bilingual tagline ("خالص • قدرتی • اصل") on the hero, or Urdu product labels, would add cultural depth and trust for the target market.

4. **"Khaalis" isn't visualised** — The Urdu word that IS the brand name never appears in Nastaliq calligraphy. This is a major missed identity opportunity.

5. **Price display** — `₨` (Pakistani Rupee symbol) is correct but the formatting uses decimal places (`₨120.00`) — Pakistani consumers don't expect `.00` decimal notation.

---

## PART 2 — NEW DESIGN SYSTEM SPECIFICATION

> This is the authoritative reference for all redesign tasks. Do not deviate.

---

### 2.1 — New Color Palette

The redesign removes the two-greens problem by introducing warm amber/saffron as the true accent — complementing the forest green and giving the brand the warmth and food-appetite quality it was reaching for with those rogue `orange-500` classes.

```js
// tailwind.config.ts — complete replacement
colors: {
  // PRIMARY — Forest Green (trust, organic, nature)
  primary: {
    50:  '#f0f7ee',
    100: '#d8ecD4',
    200: '#b4d9ab',
    300: '#8bc280',
    400: '#62a955',
    500: '#3d7a2e',  // Deeper, richer forest green (was #4B8B3B — now more premium)
    600: '#2f6022',
    700: '#234718',
    800: '#172e10',
    900: '#0c1808',
  },
  // SECONDARY — Warm Saffron/Amber (appetite, warmth, Pakistani cultural resonance)
  secondary: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#d97706',  // Rich amber — warm, food-evoking, premium
    600: '#b45309',
    700: '#92400e',
    800: '#78350f',
    900: '#451a03',
  },
  // EARTH — Brown (authenticity, soil, farm-to-table)
  earth: {
    50:  '#faf6f2',
    100: '#f0e6d8',
    200: '#dfc9b0',
    300: '#c9a882',
    400: '#b08558',
    500: '#8B5E3C',  // Keep existing Earth Brown — finally used properly
    600: '#704b30',
    700: '#553824',
    800: '#3a2518',
    900: '#1f120c',
  },
  // NEUTRAL — Warm not cold (cream-tinted whites, not gray)
  neutral: {
    50:  '#FAFAF7',  // Warm off-white (replaces cold #fafafa)
    100: '#F5F4EE',  // Warm cream
    200: '#E8E6DC',  // Warm light
    300: '#D1CEC0',  // Warm mid
    400: '#A8A497',  // Warm gray
    500: '#77736A',  // Base warm gray
    600: '#55524A',  // Dark warm
    700: '#3D3B35',  // Darker warm
    800: '#28271F',  // Very dark
    900: '#16150F',  // Almost black
  },
  // SEMANTIC — unchanged
  success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
  warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
  error:   { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
}
```

**Usage rules:**
- `primary` = all brand green elements (logo colour, active states, badges, borders)
- `secondary` = CTA buttons, highlight prices, "Add to Cart", urgency elements
- `earth` = text headings, subtle dividers, footer, secondary text
- `neutral` = backgrounds (warm cream base), body text, borders
- **Never use Tailwind's built-in `orange-*` anywhere.** Replace all `orange-500` with `secondary-500`.

---

### 2.2 — Typography System

**Single font family: Poppins only**

Remove Open Sans (redundant complexity). Remove Inter (wrong font). Load Poppins via `next/font/google` at all weights needed.

```tsx
// layout.tsx
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

// Apply as CSS variable, not className directly
<body className={`${poppins.variable} font-sans`}>
```

```js
// tailwind.config.ts — fontFamily
fontFamily: {
  sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
  display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
  urdu: ['Noto Nastaliq Urdu', 'serif'],
},
```

**Type scale (globals.css — locked, components must not override):**

```css
h1 { @apply text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight; }
h2 { @apply text-3xl lg:text-4xl font-bold leading-tight; }
h3 { @apply text-2xl lg:text-3xl font-semibold; }
h4 { @apply text-xl lg:text-2xl font-semibold; }
h5 { @apply text-lg lg:text-xl font-medium; }
h6 { @apply text-base lg:text-lg font-medium; }
p  { @apply text-base leading-relaxed text-neutral-600; }
```

---

### 2.3 — Spacing & Elevation System

**Section vertical rhythm:**
```
py-16        →  py-20 lg:py-28   (standard sections)
py-12        →  py-16 lg:py-20   (tighter sections)
```

**Card elevation tokens (box-shadow):**
```js
boxShadow: {
  'xs':     '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  'sm':     '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
  'md':     '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
  'lg':     '0 8px 30px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.04)',
  'xl':     '0 20px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)',
  'glow-primary':   '0 0 20px rgba(61, 122, 46, 0.25)',
  'glow-secondary': '0 0 20px rgba(217, 119, 6, 0.25)',
}
```

**Border radius — keep as is:** `rounded-xl`, `rounded-2xl`, `rounded-3xl`

**Product card image height — new standard:**
```
Mobile (2-col): h-44  (176px)
Tablet:         h-52  (208px)
Desktop:        h-56  (224px)
```

---

### 2.4 — Component Design Tokens (globals.css replacements)

```css
/* Buttons */
.btn-primary {
  /* Forest green base — used for navigation, secondary CTAs */
  @apply bg-primary-500 hover:bg-primary-600 text-white font-semibold 
         py-3 px-6 rounded-xl transition-all duration-200 
         shadow-sm hover:shadow-md active:scale-95
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
}

.btn-cta {
  /* Warm amber — THE main call-to-action (Add to Cart, Checkout, Shop Now) */
  @apply bg-secondary-500 hover:bg-secondary-600 text-white font-semibold 
         py-3 px-6 rounded-xl transition-all duration-200 
         shadow-sm hover:shadow-md active:scale-95
         focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2;
}

.btn-outline {
  @apply border-2 border-primary-500 text-primary-600 hover:bg-primary-500 
         hover:text-white font-semibold py-3 px-6 rounded-xl 
         transition-all duration-200 shadow-sm active:scale-95;
}

.btn-ghost {
  @apply text-primary-600 hover:bg-primary-50 font-medium 
         py-3 px-6 rounded-xl transition-all duration-200;
}

/* Inputs */
.input-field {
  @apply w-full px-4 py-3 border border-neutral-200 rounded-xl 
         bg-white text-neutral-800 placeholder-neutral-400
         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
         transition-all duration-200;
}

/* Cards */
.card {
  @apply bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 
         transition-all duration-200;
}
.card-hover {
  @apply hover:shadow-md hover:-translate-y-0.5;
}
.card-elevated {
  @apply bg-white rounded-2xl shadow-md border border-neutral-100 p-8;
}

/* Product Card */
.product-card {
  @apply bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden
         transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer;
}

/* Backgrounds */
.bg-warm-base   { @apply bg-neutral-50; }     /* Page backgrounds */
.bg-warm-cream  { @apply bg-neutral-100; }    /* Section alternates */
.bg-brand-light { @apply bg-primary-50; }     /* Highlighted sections */
```

---

### 2.5 — Screen Redesign Map

| Screen | Priority | Key Changes |
|---|---|---|
| **Global (design system)** | P0 | Font fix, color fix, CSS tokens |
| **Header** | P0 | Height, colors, search bar |
| **Homepage Hero** | P1 | Contained image, strong typography, warm design |
| **Homepage — ProductsSection** | P1 | Product card redesign, grid spacing |
| **Homepage — HowItWorks** | P2 | Brand colors, better icons, visual depth |
| **Homepage — CTA** | P2 | Replace orange-green with brand CTA design |
| **Footer** | P2 | Keep dark but warm it up |
| **Products Page** | P1 | Search UX, category tabs, card redesign |
| **Product Detail** | P1 | Image gallery, price display, add-to-cart |
| **Cart** | P2 | Order summary redesign, consistent colors |
| **Checkout** | P2 | Form redesign, trust signals |
| **Login/Signup** | P2 | Brand warmth, Khaalis identity |
| **Orders** | P3 | Status timeline, clean list |
| **Account** | P3 | Profile card, edit forms |
| **Wishlist** | P3 | Empty state, grid |
| **About** | P3 | Remove logo-as-icon, brand story |
| **Contact** | P3 | Form + map/location |

---

## PART 3 — IMPLEMENTATION TASKS

---

### Task 1: Fix the Global Design System Foundation

**Files:**
- Modify: `apps/web/tailwind.config.ts`
- Modify: `apps/web/src/app/globals.css`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1.1: Replace tailwind.config.ts color palette**

Open `apps/web/tailwind.config.ts`. Replace the entire `colors` block with the new palette from section 2.1. Replace the `fontFamily` block with the new single-font system from section 2.2. Replace `boxShadow` block with the elevation tokens from section 2.3.

Also add to `theme.extend`:
```js
backgroundImage: {
  'organic-texture': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233d7a2e' fill-opacity='0.04'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10S0 14.5 0 20s4.5 10 10 10 10-4.5 10-10zm0 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E\")",
},
```

- [ ] **Step 1.2: Fix layout.tsx — replace Inter with Poppins**

Replace the font import and body application:

```tsx
// apps/web/src/app/layout.tsx
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});
```

Change `<body className={`${inter.className} organic-gradient`}>` to:
```tsx
<body className={`${poppins.variable} font-sans bg-neutral-50 text-neutral-800`}>
```

- [ ] **Step 1.3: Rewrite globals.css**

Replace globals.css entirely with:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { scroll-behavior: smooth; }

  body {
    @apply bg-neutral-50 text-neutral-800 font-sans antialiased;
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  }

  * { @apply border-neutral-200; }

  h1 { @apply text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight text-neutral-900; }
  h2 { @apply text-3xl lg:text-4xl font-bold leading-tight text-neutral-900; }
  h3 { @apply text-2xl lg:text-3xl font-semibold text-neutral-900; }
  h4 { @apply text-xl lg:text-2xl font-semibold text-neutral-900; }
  h5 { @apply text-lg lg:text-xl font-medium text-neutral-900; }
  h6 { @apply text-base lg:text-lg font-medium text-neutral-900; }
  p  { @apply leading-relaxed; }
}

@layer components {
  /* === BUTTONS === */
  .btn-primary {
    @apply bg-primary-500 hover:bg-primary-600 text-white font-semibold
           py-3 px-6 rounded-xl transition-all duration-200
           shadow-sm hover:shadow-md active:scale-95
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
           inline-flex items-center justify-center gap-2;
  }
  .btn-cta {
    @apply bg-secondary-500 hover:bg-secondary-600 text-white font-semibold
           py-3 px-6 rounded-xl transition-all duration-200
           shadow-sm hover:shadow-md active:scale-95
           focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2
           inline-flex items-center justify-center gap-2;
  }
  .btn-outline {
    @apply border-2 border-primary-500 text-primary-600 hover:bg-primary-500
           hover:text-white font-semibold py-3 px-6 rounded-xl
           transition-all duration-200 shadow-sm active:scale-95
           inline-flex items-center justify-center gap-2;
  }
  .btn-ghost {
    @apply text-primary-600 hover:bg-primary-50 font-medium
           py-3 px-6 rounded-xl transition-all duration-200
           inline-flex items-center justify-center gap-2;
  }
  .btn-amber-outline {
    @apply border-2 border-secondary-500 text-secondary-600 hover:bg-secondary-500
           hover:text-white font-semibold py-3 px-6 rounded-xl
           transition-all duration-200 shadow-sm active:scale-95
           inline-flex items-center justify-center gap-2;
  }

  /* === INPUTS === */
  .input-field {
    @apply w-full px-4 py-3 border border-neutral-200 rounded-xl
           bg-white text-neutral-800 placeholder-neutral-400
           focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400
           transition-all duration-200;
  }
  .input-error {
    @apply border-error-500 focus:ring-error-400 focus:border-error-400;
  }
  .select-field {
    @apply w-full px-4 py-3 border border-neutral-200 rounded-xl
           bg-white text-neutral-800 appearance-none
           focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400
           transition-all duration-200;
  }
  .textarea-field {
    @apply w-full px-4 py-3 border border-neutral-200 rounded-xl
           bg-white text-neutral-800 placeholder-neutral-400 resize-none
           focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400
           transition-all duration-200;
  }

  /* === CARDS === */
  .card {
    @apply bg-white rounded-2xl shadow-sm border border-neutral-100 p-6
           transition-all duration-200;
  }
  .card-hover {
    @apply hover:shadow-md hover:-translate-y-0.5;
  }
  .card-elevated {
    @apply bg-white rounded-2xl shadow-md border border-neutral-100 p-8;
  }
  .product-card {
    @apply bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden
           transition-all duration-300 hover:shadow-lg hover:-translate-y-1;
  }

  /* === LAYOUT === */
  .container-custom {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }
  .section-padding {
    @apply py-20 lg:py-28;
  }
  .section-padding-sm {
    @apply py-14 lg:py-20;
  }

  /* === BADGES === */
  .badge {
    @apply inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold;
  }
  .badge-primary  { @apply bg-primary-100 text-primary-700; }
  .badge-secondary { @apply bg-secondary-100 text-secondary-700; }
  .badge-earth    { @apply bg-earth-100 text-earth-700; }
  .badge-fresh    { @apply bg-green-100 text-green-700; }
  .badge-organic  { @apply bg-primary-50 text-primary-600 border border-primary-200; }

  /* === NAV === */
  .nav-link {
    @apply text-neutral-600 hover:text-primary-600 font-medium
           py-2 px-3 rounded-lg transition-colors duration-200
           relative;
  }
  .nav-link-active {
    @apply text-primary-600 font-semibold;
  }

  /* === URDU === */
  .urdu-text {
    font-family: 'Noto Nastaliq Urdu', serif;
    direction: rtl;
    text-align: right;
  }

  /* === MISC === */
  .organic-bg {
    @apply bg-neutral-50 bg-organic-texture;
  }
  .warm-section {
    @apply bg-neutral-100;
  }
  .brand-section {
    @apply bg-primary-50;
  }
}

@layer utilities {
  .text-balance { text-wrap: balance; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .line-clamp-1 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
  .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .line-clamp-3 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #f0f7ee; }
::-webkit-scrollbar-thumb { background: #3d7a2e; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2f6022; }

/* Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}
.animate-fadeInUp { animation: fadeInUp 0.5s ease-out; }
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

- [ ] **Step 1.4: Verify fonts load correctly**

Run `yarn dev` in `apps/web`. Open browser → DevTools → Network tab → filter by "poppins". Confirm Poppins woff2 files are loading. Inspect any `<h1>` element in Elements tab → Computed → font-family should show `Poppins`.

- [ ] **Step 1.5: Commit design system foundation**

```bash
git add apps/web/tailwind.config.ts apps/web/src/app/globals.css apps/web/src/app/layout.tsx
git commit -m "design: replace color system, fix Poppins font, rewrite CSS tokens"
```

---

### Task 2: Redesign Header & Navigation

**Files:**
- Modify: `apps/web/src/components/layout/Header.tsx`

Goals: reduce height to 64px desktop, fix all orange references, add clean underline active state, clean up mobile menu.

- [ ] **Step 2.1: Replace Header.tsx**

Key changes:
- Remove all `orange-*` colour references → replace with `primary-*` and `secondary-*`
- Desktop height: `h-16` (64px) at all breakpoints — remove the escalating `sm:h-20 lg:h-24`
- Logo: `h-14 w-14` (56px) — compact but visible
- Nav links: remove the animated underline component (over-engineered), use a simple bottom-border on hover/active via CSS
- User avatar gradient: `from-primary-500 to-primary-600` (no more orange-to-green)
- Cart badge: `bg-secondary-500` when >0, `bg-neutral-300` when empty
- Wishlist icon: `text-primary-600 hover:text-primary-700`
- Mobile menu: clean white panel, no gradient background

- [ ] **Step 2.2: Commit**

```bash
git add apps/web/src/components/layout/Header.tsx
git commit -m "design: header height, brand colors, remove orange references"
```

---

### Task 3: Redesign Homepage

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/components/sections/Hero.tsx`
- Modify: `apps/web/src/components/sections/HowItWorks.tsx`
- Modify: `apps/web/src/components/sections/CTA.tsx`

- [ ] **Step 3.1: Restructure page.tsx**

The homepage should no longer use a full-page background image. Structure:
```tsx
<main>
  <HeroSection />           {/* Contained hero — image bounded to 70vh */}
  <ProductsSection />       {/* White/warm background, clean */}
  <HowItWorks />            {/* Warm cream background */}
  <CTA />                   {/* Brand green solid background */}
</main>
```

Remove the `ResponsiveBackgroundImage` wrapper from the homepage root. The hero image belongs only inside `HeroSection`, bounded.

- [ ] **Step 3.2: Redesign Hero.tsx**

The hero should have a two-column layout on desktop:
- Left: Brand text content (headline, tagline, CTA buttons)
- Right: Contained organic food image (aspect-ratio box, not full-bleed background)
- Mobile: Single column, text above, image below (or image as subtle backdrop at reduced opacity)

Key text elements:
```
Urdu calligraphy line: "خالص • قدرتی • اصل" (small, elegant, above headline)
Headline: "Khaalis Harvest"  (split — "Khaalis" in primary-500, "Harvest" in neutral-900)
Sub: "The Pure Embrace of Nature"
Body: "Pakistan's premier organic marketplace..."
Buttons: [btn-cta "Shop Fresh Products"] [btn-outline "Our Story"]
Trust chips: "✓ Farm Fresh  ✓ No Chemicals  ✓ Same-Day Delivery"
```

- [ ] **Step 3.3: Redesign HowItWorks.tsx**

Replace orange with secondary-500 (amber) for icons. Add a numbered step indicator. Add connecting line with proper CSS (no overflow issues). Background: `bg-neutral-100` (warm cream).

- [ ] **Step 3.4: Redesign CTA.tsx**

Replace `from-orange-500 to-green-500` gradient with `bg-primary-600` (solid deep green). Change text copy to be more specific and honest for a startup. Add a subtle organic texture overlay using the CSS background-image pattern.

- [ ] **Step 3.5: Commit**

```bash
git add apps/web/src/app/page.tsx apps/web/src/components/sections/
git commit -m "design: homepage hero two-column layout, fix HowItWorks and CTA colors"
```

---

### Task 4: Redesign Product Card & Products Grid

**Files:**
- Modify: `apps/web/src/components/ui/ProductCard.tsx`
- Modify: `apps/web/src/components/sections/ProductsSection.tsx`

- [ ] **Step 4.1: Redesign ProductCard.tsx**

Replace `bg-orange-500` button with `btn-cta`. Increase image height to `h-44`. Add hover animation (`product-card` class). Show category badge with `badge-primary`. Fix star rating display.

- [ ] **Step 4.2: Redesign grid cards in ProductsSection.tsx**

The inline Link-as-card in ProductsSection.tsx is a separate component from ProductCard.tsx (technical debt — these should be merged eventually, but for now update both). Apply `product-card` class. Increase image height. Add `px-3 py-3` padding instead of `px-2 py-2`. Add hover state.

Replace `bg-orange-500` pagination button with `bg-secondary-500`.

- [ ] **Step 4.3: Remove full-page background image from Products page**

`apps/web/src/app/products/page.tsx` — remove `ResponsiveBackgroundImage` wrapper. Replace with:
```tsx
<div className="min-h-screen bg-neutral-50">
  <div className="container-custom py-8">
    <ProductsSection showPagination={true} />
  </div>
</div>
```

- [ ] **Step 4.4: Commit**

```bash
git add apps/web/src/components/ui/ProductCard.tsx apps/web/src/components/sections/ProductsSection.tsx apps/web/src/app/products/page.tsx
git commit -m "design: product cards hover animation, amber CTA button, clean products page"
```

---

### Task 5: Redesign Auth Pages (Login, Signup, Forgot Password)

**Files:**
- Modify: `apps/web/src/app/auth/login/page.tsx`
- Modify: `apps/web/src/app/auth/signup/page.tsx`
- Modify: `apps/web/src/app/auth/forgot-password/page.tsx`
- Modify: `apps/web/src/app/auth/reset-password/page.tsx`

- [ ] **Step 5.1: Auth page layout redesign**

Split-panel layout on desktop:
- Left panel (40%): Brand panel — deep green (`bg-primary-600`), logo, Urdu tagline, organic value props
- Right panel (60%): Form — clean white card, no background image

Mobile: single column, just the form with logo at top.

Logo size: reduce to `h-20 w-20` (80px) from current 144px.

All `btn-primary` submit buttons → `btn-cta` (amber) since this is the primary user CTA.

- [ ] **Step 5.2: Commit**

```bash
git add apps/web/src/app/auth/
git commit -m "design: auth pages split-panel layout, brand left panel, amber submit"
```

---

### Task 6: Redesign Cart Page

**Files:**
- Modify: `apps/web/src/app/cart/page.tsx`

- [ ] **Step 6.1: Replace all orange references in cart**

- `from-orange-500 to-green-500` → `btn-cta` class on checkout button
- `border-orange-500` loading spinner → `border-secondary-500`
- `hover:text-orange-600` product name link → `hover:text-primary-600`
- `text-orange-600` variant label → `text-secondary-600`
- Order summary card: change `rounded-lg` to `rounded-2xl` for consistency
- "Continue Shopping" button: use `btn-outline` class

- [ ] **Step 6.2: Commit**

```bash
git add apps/web/src/app/cart/page.tsx
git commit -m "design: cart page color consistency, amber CTA, rounded-2xl summary"
```

---

### Task 7: Fix About Page

**Files:**
- Modify: `apps/web/src/app/about/page.tsx`

- [ ] **Step 7.1: Remove logo-as-icon anti-pattern**

Replace every instance of `<Image src="/images/logo.png" />` used as a list/values icon with a proper SVG icon or an emoji-free Heroicon. Each value should get a relevant icon:
- Freshness First → `SparklesIcon`
- Supporting Farmers → `SunIcon`
- Convenient Delivery → `TruckIcon`
- Environmental Sustainability → `GlobeAltIcon`

- [ ] **Step 7.2: Remove full-page background image**

Replace `ResponsiveBackgroundImage` with a clean hero section: `bg-primary-600` solid green with the headline in white. Keep it elegant, remove the background-image dependency.

- [ ] **Step 7.3: Fix duplicate content (mission appears twice)**

Mission statement appears in both the hero section AND the section below it. Remove the duplicate.

- [ ] **Step 7.4: Fix stat colours**

Replace `text-orange-600` stats with `text-secondary-500` (amber) — 2 stats, and `text-primary-500` (green) — other 2. Alternate for visual rhythm.

- [ ] **Step 7.5: Commit**

```bash
git add apps/web/src/app/about/page.tsx
git commit -m "design: about page — remove logo icon anti-pattern, fix bg image, fix colors"
```

---

### Task 8: Fix Footer & Notification Bar

**Files:**
- Modify: `apps/web/src/components/layout/Footer.tsx`
- Modify: `apps/web/src/components/ui/NotificationBar.tsx`

- [ ] **Step 8.1: Footer warmth**

Change `bg-neutral-900` → `bg-earth-900` (warm dark, not cold gray). Change social icon hovers from `hover:text-orange-400` to `hover:text-secondary-400`. Update copyright year to 2025.

- [ ] **Step 8.2: Commit**

```bash
git add apps/web/src/components/layout/Footer.tsx apps/web/src/components/ui/NotificationBar.tsx
git commit -m "design: footer warm dark background, amber social hovers"
```

---

### Task 9: Fix Remaining Pages (Checkout, Orders, Account, Wishlist, Contact)

**Files:**
- Modify: `apps/web/src/app/checkout/page.tsx`
- Modify: `apps/web/src/app/orders/page.tsx`
- Modify: `apps/web/src/app/orders/[id]/page.tsx`
- Modify: `apps/web/src/app/account/page.tsx`
- Modify: `apps/web/src/app/wishlist/page.tsx`
- Modify: `apps/web/src/app/contact/page.tsx`

- [ ] **Step 9.1: Audit and fix each page for orange references**

In each file, find and replace:
- Any `orange-*` → appropriate `primary-*` or `secondary-*`
- Any `from-orange-500 to-green-500` → `btn-cta` or `bg-secondary-500`
- Any `rounded-lg` on cards → `rounded-2xl`
- Any `bg-gradient-to-r from-orange-*` section → `bg-primary-600` or `bg-neutral-100`

- [ ] **Step 9.2: Fix price formatting across all pages**

Remove `.toFixed(2)` on PKR prices — Pakistani convention doesn't use decimals for whole amounts. Replace `₨${amount.toFixed(2)}` with `₨${Math.round(amount).toLocaleString('en-PK')}` for proper comma-separated thousands.

- [ ] **Step 9.3: Commit**

```bash
git add apps/web/src/app/checkout/ apps/web/src/app/orders/ apps/web/src/app/account/ apps/web/src/app/wishlist/ apps/web/src/app/contact/
git commit -m "design: audit remaining pages — orange references, price formatting, card radius"
```

---

## PART 4 — DESIGN RULES (Permanent Reference)

> Every future PR touching UI must comply with these rules.

1. **Never use Tailwind's built-in `orange-*` colours.** Use `secondary-*` (amber) instead.
2. **Never use two different colours for the same hover state.** Nav links hover to `primary-600`. Always.
3. **CTA buttons (Add to Cart, Proceed to Checkout, Sign Up) use `btn-cta` (amber).** Navigation/secondary actions use `btn-primary` (green).
4. **Background images only inside bounded, height-constrained containers.** Never as a page-level full-bleed wrapper.
5. **Product images are the visual heroes.** No decorative background should compete with product photography.
6. **All cards use `rounded-2xl`.** Never `rounded-lg` on a card container.
7. **Shadow scale:** `shadow-sm` at rest → `shadow-md` or `shadow-lg` on hover. Never skip levels.
8. **Spacing:** use `section-padding` and `section-padding-sm` utility classes. Never ad-hoc `py-16` in page code.
9. **Price display:** `₨${Math.round(price).toLocaleString('en-PK')}` — no decimals, comma separators.
10. **Font sizes:** never override the heading scale in components. If h1 through h6 don't fit, reconsider the information hierarchy instead.

---

*Plan created: 2026-06-07*
*Status: Ready for execution*
