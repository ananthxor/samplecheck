---
name: creative
description: Create a new standard banner format from a reference image
argument-hint: "<Name> [description]"
---

Create a new standard banner creative format. The user provides:
- **Name** (required) — the format name (e.g., "Wide Skyscraper", "Half Page")
- **Description** (optional) — extra context about the creative
- **Reference image** — attached in the same message (screenshot/mockup showing the desired ad layout)

## Steps

1. **Parse the input**: Extract the creative name from "$ARGUMENTS". If a description follows the name, note it.

2. **Analyze the reference image**: Study the attached image carefully and identify:
   - Dimensions (width × height) from the image or from standard IAB sizes based on the name
   - Layout pattern (vertical stack, horizontal split, bg-image overlay, etc.)
   - Visual elements present (logo, brand name, headline, subtitle, promo text, product image, CTA button/bar, etc.)
   - Color scheme (background color, text color, accent/CTA colors)
   - CTA style (filled bar, outlined button, pill button, etc.)

3. **Design fields specific to this creative**: Based on what the reference image shows, decide:
   - Which **content fields** are needed (only fields that match elements visible in the reference)
   - Which **style fields** are needed (colors that the user should be able to customize)
   - Do NOT blindly copy fields from existing formats — each creative has its own needs
   - Think from a non-technical user's perspective: every visible element should have a user-controllable field

4. **Determine the next engagement prefix**: Check existing formats to find the next available prefix number. Look at the most recently created format's engagements file.

5. **Determine device support**: Based on the ad dimensions:
   - Width ≤ 336px → all devices: `["mobile", "tablet", "desktop"]`
   - Width 337-467px → tablet + desktop: `["tablet", "desktop"]`
   - Width ≥ 468px → desktop only: `["desktop"]`

6. **Check for existing stub**: Look in `apps/web/src/features/templates/formats/standard-banners/<slug>/` for existing stub files (config.ts, index.ts).

7. **Create the format files**:
   - `renderer.ts` — CSS (with unique `.st-XX-` prefix) + JS render function. Use `sanitize()` for all user values. Match the reference image's layout pattern.
   - `config.ts` — Type set to the kebab-case slug (NOT `standard-banners-<name>`). Import renderer + engagements. Content fields + style fields (with `tab: 'style'`). 3 template presets with different industry themes. **All image fields MUST have default placeholder URLs** (see Default Images rule below).
   - `engagements.ts` — 3 engagements with the next sequential prefix (CTA Click, Ad Hover, primary visual element view).
   - `index.ts` — barrel export for format + engagements.

8. **Register the format**:
   - Add import + entry in `apps/web/src/features/templates/formats/registry.ts`
   - Add dimension + device support in `apps/web/src/features/templates/data/fmtData.ts`

9. **Verify**: Read back all created files to confirm:
   - Type matches between config, templates, and registry
   - All field IDs in config are used in renderer
   - CSS class prefix is unique
   - Engagement selectors match CSS classes
   - fmtData has correct dimension and previewModes

## Important Rules
- Do NOT add `ctaUrl` to format fields — it's handled by the common Interaction Type section
- Do NOT add `Co-Authored-By` trailers to any commits
- CSS class prefix convention: `.st-XX-` where XX is a unique 2-letter abbreviation
- Engagement prefix numbers are sequential across all standard banner formats
- Think from the END USER's perspective — if something is visible in the ad, the user needs a field to control it
- Default brand name in the first template preset MUST be "ScrollToday" (our platform name). Never use "airtory" or other competitor names as defaults — reference images are for layout only
- Image fields (logo, background image, product image, etc.) MUST use `type: 'image'` (renders upload widget), NOT `type: 'url'`. Only use `type: 'url'` for actual URLs like click-through links
- **Default Images** — NEVER leave image field defaults as empty strings `''`. Every image field MUST have a placeholder URL using Picsum **seeded URLs** (deterministic — same URL always returns the same image):
  - **URL format**: `https://picsum.photos/seed/{seed}/{width}/{height}` — NEVER use `?random=N` (non-deterministic, causes form/preview mismatch)
  - **Background / main images**: `https://picsum.photos/seed/{slug}{N}/{adWidth}/{adHeight}` (e.g., `https://picsum.photos/seed/leaderboard1/728/90`)
  - **Logo images**: `https://picsum.photos/seed/{slug}-logo{N}/100/36`
  - **Product images**: `https://picsum.photos/seed/{slug}-product{N}/{width}/{height}` sized for the product area
  - **Seed naming**: use the format slug + preset number. E.g., for `inline-rectangle` preset 1: `seed/inline-rectangle1/300/250`, preset 2: `seed/inline-rectangle2/300/250`, preset 3: `seed/inline-rectangle3/300/250`
  - The `default` value in the field definition uses seed without number: `seed/{slug}/...`
  - This applies to BOTH the field `default` AND every `defaultConfig` in the template presets
