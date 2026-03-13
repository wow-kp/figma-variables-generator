# Figma Variables Generator

A **designer-ready** web tool for creating, managing, and exporting design tokens — built for teams that use Figma as their source of truth. Define your entire design system in one place, then export production-ready files that plug straight into Figma, CSS, or Tailwind.

No command-line knowledge required. No design-token spec to memorize. Just open the app, tweak your values, and download.

---

## What It Does

You get a full visual editor for every token type a modern design system needs:

| Tab | What you define | Default starter set |
|-----|----------------|---------------------|
| **Primitives** | Base color palettes (Blue, Purple, Green, Red, Amber, Gray) with shade scales (50–950) | 6 palettes, 61 swatches |
| **Colors** | Semantic color tokens with **light + dark mode** values that reference your primitives | 30 tokens across brand, surface, text, border, feedback, overlay |
| **Spacing** | Spacing scale (padding, margin, gap) | 18 steps from 0 to 128 px |
| **Typography** | Font families, sizes, weights, and line heights as individual tokens | 2 families, 10 sizes, 4 weights, 5 line heights |
| **Text Styles** | Composite text styles (font + size + weight + line-height + letter-spacing + decoration) grouped by role | 14 styles across display, heading, body, label, caption, code |
| **Radius** | Border radius tokens with visual preview cards | 8 values from none to full |
| **Border** | Border width tokens | 4 widths |
| **Shadows** | Box shadows with a visual picker (offset, blur, spread, color, inset) | 6 elevations (xs – 2xl) |
| **Z-Index** | Stacking order reference | 8 layers (base – tooltip) |
| **Breakpoints** | Min-width responsive breakpoints with linked min/max values | 4 breakpoints (xs – lg) |
| **Custom** | Create your own token collections with custom types, units, and grouping | — |

### Key features

- **Light / dark mode** — semantic color tokens have separate light and dark values; preview either mode in the UI
- **Primitive references** — color tokens can reference `{primitives.blue.600}` instead of hard-coded hex, keeping your system linked
- **Drag-to-reorder** — every token list supports drag-and-drop sorting
- **Duplicate detection** — duplicate token names are highlighted in real time
- **Search / filter** — quickly find tokens across large sets
- **Bulk select & delete** — checkbox selection across rows
- **Undo / redo** — full undo history (Ctrl+Z / Ctrl+Shift+Z) with up to 100 steps
- **Auto-save** — all work is persisted to localStorage automatically
- **Import / export** — load a previously exported JSON snapshot to continue editing, or share with teammates
- **Dark / light UI theme** — independent of your token theme; switch via the header toggle
- **Sidebar toggle** — enable or disable individual tabs and their exports from the sidebar
- **30+ font families** — built-in font family picker with popular Google Fonts, system fonts, and monospace options
- **Custom collections** — create unlimited additional token groups with configurable DTCG types and units

---

## Export Formats

Click the **Download** button in the header to open the export panel. Choose a format, pick the files you need, and download.

### DTCG JSON (Design Token Community Group)

The standard format for importing into **Figma** and other design tools that support the [DTCG spec](https://tr.designtokens.org/format/).

**How to import into Figma:**
1. Open the **Local Variables** panel in your Figma file
2. Use a Variables Import plugin (e.g., *Import Variables*)
3. Drop in the downloaded `.json` files
4. For **Text Styles**: make sure the fonts are installed locally on your machine

Generated files: `primitives.json`, `colors-light.json`, `colors-dark.json`, `spacing.json`, `typography.json`, `text-styles.json`, `radius.json`, `border-width.json`, `shadows.json`, `z-index.json`, `breakpoints.json`, plus any custom collections.

### CSS Variables

Ready-to-use CSS custom properties (`:root` / `[data-theme="dark"]`) with utility classes:

```css
:root {
  --color-brand-primary: #2563EB;
  --spacing-4: 16px;
  --radius-lg: 8px;
}
.bg-brand-primary { background-color: var(--color-brand-primary); }
.p-4 { padding: var(--spacing-4); }
.rounded-lg { border-radius: var(--radius-lg); }
```

### Tailwind Config

JSON snippets for `theme.extend` — paste directly into your `tailwind.config.js`:

```json
{
  "theme": {
    "extend": {
      "spacing": { "0": "0px", "1": "4px", "2": "8px" },
      "borderRadius": { "sm": "4px", "md": "6px", "lg": "8px" }
    }
  }
}
```

---

## Installation

### Prerequisites

- **Node.js 22** or later — [download here](https://nodejs.org/) or use a version manager like nvm / fnm
- **npm** (comes bundled with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/wow-kp/figma-variables-generator.git
cd figma-variables-generator

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app opens at **http://localhost:5173** (Vite's default port).

### Other commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the test suite (49 unit tests) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |

---

## Usage Guide

### 1. Define your primitives

Start on the **Primitives** tab. This is your raw color palette — the foundation everything else references. Each palette group (Blue, Purple, etc.) has shade stops you can edit with the color picker or by typing hex values directly.

- Click a shade swatch to open the color picker
- Add or remove shade stops per palette
- Add entirely new palette groups
- The **base** group (white / black) is always available

### 2. Build semantic colors

Switch to the **Colors** tab. Here you define tokens like `brand / primary` or `surface / page` that have a **light** and **dark** mode value. Each value can be:

- A **primitive reference** like `{primitives.blue.600}` — select from the dropdown
- A **custom hex** value — choose "custom hex" from the dropdown and type your color

This keeps your semantic tokens linked to your primitives. Change a primitive, and every token referencing it updates automatically.

### 3. Add spacing, typography, and more

Work through the other tabs to define your full system. Each tab works the same way:

- **Add** tokens with the button at the bottom
- **Edit** names and values inline
- **Drag** rows to reorder
- **Duplicate** a token with the copy button (⧉)
- **Delete** with the × button
- **Search** to filter long lists

### 4. Create text styles

The **Text Styles** tab lets you build composite typography tokens. Each style combines font family, size, weight, line height, letter spacing, paragraph spacing, and text decoration into a single token — perfect for mapping to Figma text styles.

Styles are organized by group (display, heading, body, label, caption, code). You can rename groups, add new ones, drag to reorder, and remove empty groups.

### 5. Use shadows with the visual picker

The **Shadows** tab includes an interactive shadow picker. Click the swatch next to any shadow token to open it. You can adjust:

- X / Y offset
- Blur and spread radius
- Shadow color with opacity
- Inset toggle

The CSS value updates in real time.

### 6. Toggle what you need

Use the **sidebar** (left panel) to enable or disable tabs. Disabled tabs are hidden from the UI and excluded from exports. Start small and grow your system over time.

### 7. Export

Click **Download** in the header. The export panel lets you:

1. Choose a format: **DTCG JSON**, **CSS Variables**, or **Tailwind**
2. Check / uncheck individual files
3. Download selected files

Only enabled tabs produce output files.

### 8. Save and restore

Your work is **automatically saved** to your browser's localStorage. To share or back up:

- Click **Export All (JSON)** in the header to save a complete snapshot
- Click **Import** and select a previously exported `.json` file to restore

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` / `⌘+Z` | Undo |
| `Ctrl+Shift+Z` / `⌘+Shift+Z` | Redo |

---

## Project Structure

```
src/
  App.tsx              Main app shell, state management, undo/redo, save/load
  DownloadPanel.tsx    Export panel with format selection and file picker
  components.tsx       Shared UI components (DraggableRow, TabHeader, etc.)
  defaults.ts          Default token values and validation helpers
  generators.ts        DTCG JSON, CSS, and Tailwind output generators
  hooks.ts             Custom React hooks (drag-and-drop)
  types.ts             TypeScript interfaces for all token types
  index.css            Styles (dark/light theme, layout, components)
  tabs/
    PrimitivesTab.tsx  Color palette editor with shade scales
    ColorsTab.tsx      Semantic color tokens (light/dark mode)
    SpacingTab.tsx     Spacing scale
    TypographyTab.tsx  Font families, sizes, weights, line heights
    TextStylesTab.tsx  Composite text styles with groups
    RadiusTab.tsx      Border radius with visual preview cards
    BorderTab.tsx      Border widths
    ShadowsTab.tsx     Box shadows with interactive picker
    ZIndexTab.tsx      Z-index stacking layers
    BreakpointsTab.tsx Responsive breakpoints with linked min/max
    CustomTab.tsx      User-defined token collections
    index.ts           Barrel exports
```

---

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for dev server and production builds
- **Vitest 4** for unit testing
- Zero runtime dependencies beyond React

---

## License

MIT
