# Design System Strategy: The Elevated Path

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Curator"**

This design system is engineered to move away from the static, "grid-locked" nature of standard booking platforms. Instead of a rigid table of options, we are building a bespoke concierge experience. The aesthetic leans into **"The Kinetic Curator"**—a philosophy where the interface feels like it is unfolding for the user. 

We break the "template" look through **Intentional Asymmetry** and **Tonal Depth**. By utilizing overlapping elements—such as a `surface-container-highest` card slightly offsetting a background image—we create a sense of physical space. High-contrast typography scales (pairing `display-lg` with `label-sm`) create an editorial rhythm that feels more like a high-end travel magazine than a utility tool.

---

## 2. Colors & Surface Architecture
The color strategy utilizes a "Deep Tech" palette. We use deep navy for grounding and electric blue for kinetic energy, but the secret lies in the neutrals.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Traditional borders create visual noise that breaks the premium feel. 
- **Sectioning:** Define boundaries solely through background shifts. A `surface-container-low` section should sit directly against a `surface` background to define its start and end.
- **Visual Soul:** Use a subtle linear gradient (e.g., `primary` to `primary_container`) for Hero backgrounds or primary CTAs to avoid the "flat" look of generic SaaS tools.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers. 
- **Layer 0 (Base):** `surface` (#f8f9fa)
- **Layer 1 (Recessed):** `surface_container_low` for large content areas.
- **Layer 2 (Elevated):** `surface_container_lowest` (#ffffff) for primary cards to create a "lifted" effect.
- **Layer 3 (Feature):** `surface_container_high` for interactive sidebars or nested utility panels.

### The "Glass & Gradient" Rule
For floating elements (modals, dropdowns, or navigation bars), use **Glassmorphism**. Apply a semi-transparent `surface_container_lowest` with a `backdrop-blur` of 12px–20px. This allows the vibrant `primary` or `tertiary` accents to bleed through, softening the interface and making it feel integrated rather than "pasted on."

---

## 3. Typography
We utilize **Inter** to lean into a precision-engineered, Swiss-inspired aesthetic. The hierarchy is designed to convey authority and ease of navigation.

*   **Display & Headline (The Editorial Voice):** Use `display-lg` and `headline-lg` sparingly for hero statements. These should always use `on_surface` with a tracking (letter-spacing) of `-0.02em` to feel "tight" and premium.
*   **Title (The Navigator):** `title-lg` and `title-md` are your primary anchors. They guide the user through the booking flow.
*   **Body (The Information):** `body-lg` is for readability. We use `on_surface_variant` (#444655) for secondary body text to reduce eye strain and increase the perceived "softness" of the UI.
*   **Labels (The Utility):** `label-md` should be used for all caps metadata, often paired with increased tracking (`+0.05em`) to provide a high-end "tag" feel.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** and physics-based shadows, never through structural lines.

*   **The Layering Principle:** Avoid shadows for static cards. Instead, place a `surface_container_lowest` card on a `surface_container_low` background. The subtle shift from #ffffff to #f3f4f5 provides all the separation needed.
*   **Ambient Shadows:** For interactive "floating" elements, use a "Double-Drop" shadow:
    - Shadow 1: 0px 4px 20px rgba(26, 26, 46, 0.04)
    - Shadow 2: 0px 8px 40px rgba(26, 26, 46, 0.08)
    - *The shadow color is a tint of our `on_secondary_fixed` (#1a1a2e), ensuring it looks like a natural occlusion of light.*
*   **The "Ghost Border" Fallback:** If a container sits on an identical color background, use a `outline_variant` at **15% opacity**. Total opacity borders are strictly forbidden.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`). Border-radius: `md` (0.75rem). No shadow on rest; subtle `ambient shadow` on hover.
- **Secondary:** `secondary_container` fill with `on_secondary_container` text.
- **Tertiary:** No background. Text-only with an underline that appears on hover using the `surface_tint`.

### Input Fields
- **High-End Styling:** Forgo the "box" look. Use a `surface_container_low` background with no border. On focus, transition the background to `surface_container_lowest` and add a 1px "Ghost Border" using `primary`.

### Cards & Lists
- **The "No-Divider" Rule:** Forbid the use of horizontal lines between list items. Use vertical white space (1.5rem to 2rem) and `body-sm` labels to distinguish sections.
- **Nesting:** Ensure cards use `roundness.lg` (1rem) for a friendly yet sophisticated feel.

### Custom Component: The "Progressive Calendar"
In a booking context, the calendar shouldn't be a grid of boxes. Use `surface_container_lowest` for the container and `primary_fixed` for selected date ranges, creating a soft, continuous "pill" shape across the dates.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., 80px left, 120px right) in hero sections to create a custom, editorial feel.
*   **Do** lean heavily on `surface_container` tiers to create hierarchy.
*   **Do** use `primary` (#2346d5) as a high-intent signal only (CTAs, Active States).

### Don't:
*   **Don't** use 100% black (#000000) for text. Always use `on_surface` or `on_secondary_fixed`.
*   **Don't** use standard 4px or 8px "Drop Shadows" from software defaults. Use the Ambient Shadow spec.
*   **Don't** use dividers. If the content feels cluttered, increase the white space or shift the background tone.