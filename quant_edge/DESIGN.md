# Design System Strategy: The Institutional Pulse

## 1. Overview & Creative North Star
**Creative North Star: "The Sovereign Analyst"**

This design system is engineered to move beyond the "SaaS-standard" dashboard. It adopts an **Institutional Editorial** aesthetic—blending the cold, calculated precision of a Bloomberg terminal with the fluid, high-end sophistication of a luxury timepiece. 

To break the "template" look, we reject the rigid 12-column grid in favor of **Intentional Asymmetry**. Large-scale macroeconomic data should breathe, utilizing expansive "negative space" as a functional tool rather than a void. By overlapping glass containers and utilizing sharp, high-contrast typography scales, we create a UI that feels like a live intelligence briefing: authoritative, bespoke, and relentlessly focused on the signal over the noise.

---

## 2. Colors & Surface Logic

Our palette is anchored in a monochromatic void (`#0B0E11`), allowing our "Traffic Light" data accents to pierce through with clinical clarity.

### The "No-Line" Rule
**Borders are a failure of hierarchy.** Within this system, 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined through:
*   **Background Shifts:** Use `surface-container-low` for secondary modules sitting on the `surface` background.
*   **Tonal Transitions:** Define areas by shifting from `surface-container` to `surface-container-high`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of obsidian and frosted glass:
1.  **Base Layer:** `surface` (#0B0E11) – The bedrock.
2.  **Structural Sections:** `surface-container-low` – For broad sidebar or navigation regions.
3.  **Active Cards:** `surface-container` – For the primary data modules.
4.  **Floating Insights:** `surface-container-highest` – For temporary overlays or "pinned" metrics.

### The "Glass & Gradient" Rule
To achieve a premium "soul," main Action Buttons and Hero Trends should utilize a subtle linear gradient: `primary` (#84ADFF) to `primary-container` (#6C9FFF). For floating panels (e.g., detail flyouts), use a `backdrop-blur` of 12px-20px combined with a 40% opacity `surface-variant`.

---

## 3. Typography

The typography strategy employs a "Dual-Tone" approach: **Manrope** for authoritative, editorial headers and **Inter** for high-density, tabular financial data.

*   **Display & Headlines (Manrope):** These are your "Editorial Anchors." Use `display-lg` (3.5rem) for singular, high-impact macro metrics (e.g., GDP % or Interest Rates). The wide tracking and geometric builds of Manrope convey modern institutional trust.
*   **Body & Labels (Inter):** Inter is the workhorse. Use `body-sm` (0.75rem) with `on-surface-variant` (#A9ABAF) for secondary data labels. Its tall x-height ensures readability when users are scanning dense rows of ticker symbols.
*   **Data Highlighting:** Use `title-md` (1.125rem) in `secondary` (#69F6B8) for positive growth and `error` (#FF716C) for decline. Color here is not decorative; it is a semantic layer of information.

---

## 4. Elevation & Depth

We eschew traditional drop shadows for **Tonal Layering** and **Ambient Glows.**

*   **The Layering Principle:** A `surface-container-lowest` card placed on a `surface-container-low` section creates a natural "recessed" look. This "carved" aesthetic feels more integrated and professional than "pasted-on" shadows.
*   **Ambient Shadows:** If an element must float (e.g., a Modal), use a shadow with a 40px blur, 0% spread, and an opacity of 6% using a tinted `primary` color. This simulates light refracting through glass rather than a generic grey smudge.
*   **The "Ghost Border" Fallback:** Where accessibility requires a container boundary, use a "Ghost Border." Use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use `surface-bright` at 10% opacity with a `backdrop-filter: blur(10px)` for global navigation bars to allow chart data to bleed through as the user scrolls, maintaining a sense of depth and context.

---

## 5. Components

### Cards & Data Modules
*   **Style:** No borders. No dividers. Use `surface-container` backgrounds.
*   **Spacing:** Use 24px (1.5rem) internal padding to ensure the "Editorial" feel.
*   **Separation:** Separate list items within cards using vertical whitespace (12px) rather than lines.

### Action Buttons
*   **Primary:** A gradient of `primary` to `primary-container`. `border-radius: 0.375rem (md)`. 
*   **Secondary:** Ghost style. `outline-variant` at 20% opacity. No fill. Text in `on-surface`.
*   **States:** On hover, the `surface-tint` should increase by 10% brightness to create a "pulsing" glass effect.

### Macro-Status Chips
*   **Visual:** Pill-shaped (`full` roundedness).
*   **Logic:** Small 6px "Status Dot" using the traffic light system: `secondary` (Bullish), `error` (Bearish), `tertiary` (Neutral). Use `on-surface-variant` for the text to keep the focus on the color indicator.

### Data Inputs
*   **Style:** Submerged look. Use `surface-container-lowest` with a "Ghost Border." On focus, the border transitions to a `primary_dim` (#0070EA) glow.

---

## 6. Do’s and Don'ts

### Do:
*   **DO** use whitespace as a separator. If you think you need a line, try adding 16px of space first.
*   **DO** use `secondary_fixed` (#69F6B8) for all positive financial deltas.
*   **DO** align text-heavy headers to the left but keep large numerical displays tabular (Monospaced) for easy vertical comparison.

### Don’t:
*   **DON'T** use pure white (#FFFFFF) for text. Use `on-surface` (#F8F9FE) to prevent eye strain in dark mode.
*   **DON'T** use 100% opaque borders. They clutter the UI and break the "Glassmorphism" immersion.
*   **DON'T** use standard "drop shadows." If a layer needs depth, use a background color shift or a blur effect.
*   **DON'T** crowd the data. If the screen feels dense, increase the surface-area of the `surface-container-low` backing.