# Athar Branding Guide

## Brand Core

**Name:** Athar

**Meaning in-product:** A playable journey through the preservation and transmission of hadith across the classical Islamic world.

**Brand promise:** Serious, reverent, readable, and game-native. Athar should feel historical without becoming museum-like, and playful without becoming trivial.

## Brand Personality

- Scholarly, not academic-jargon heavy
- Atmospheric, not gloomy
- Reverent, not ornamental for its own sake
- Geographic and journey-led, not fantasy-led
- Clear and modern in UI interaction, even when the visual language is historical

## Positioning

Athar is an educational historical traversal game. The map is the stage, knowledge is the resource, and scholars are the protagonists. The product should read as:

- historical traversal
- preservation of knowledge
- route-based challenge
- reflective, strategic play

It should not read as:

- generic fantasy RPG
- military conquest game by default
- museum slideshow
- abstract productivity app with a history skin

## Naming Conventions

Use these terms consistently:

- `Athar` for the product name
- `scholar` for playable character choice
- `chapter` for a route/level in player-facing copy
- `hadith` for the collectible/progress resource
- `teacher` or `scholar encounter` for NPC milestones
- `route` for directional objective copy

Avoid mixing in older/internal naming like:

- `Journey`
- `character archetype`
- `mission` when `chapter` or `route` is clearer

## Visual Direction

The implemented UI already points to a strong direction:

- dark ink backgrounds
- sand and parchment typography
- gold as the primary emphasis color
- teal as the environmental accent
- rounded, glassy HUD surfaces over the geographic backdrop

This should continue to feel like:

- ink
- parchment
- brass
- caravan-night atmosphere

Not like:

- neon sci-fi
- purple fantasy
- flat productivity SaaS

## Color System

Current brand tokens from [src/app/styles/index.css](../src/app/styles/index.css):

- `ink-950` `#071118`
- `ink-900` `#0c1c26`
- `ink-800` `#102734`
- `sand-50` `#f5ebd8`
- `sand-100` `#e9d8b4`
- `sand-300` `#d3b171`
- `teal-500` `#1f9d95`
- `gold-400` `#e9c46a`

Recommended semantic use:

- Background base: `ink-950`, `ink-900`
- Elevated panels: `ink-900` with controlled transparency
- Primary text: `sand-50`
- Secondary text: `sand-100`
- Muted metadata: `sand-100/55` to `sand-100/75`
- Primary CTA/accent: `gold-400`
- Secondary system accent: `teal-500`
- Success/completion states: teal-led with gold reserved for reward

Usage rules:

- Gold should signal value, progress, or sacred emphasis. Do not overuse it as a general fill color.
- Teal should support direction, atmosphere, and secondary distinction.
- Sand should remain the primary reading color over dark surfaces.
- Large flat white panels should be avoided.

## Typography

Current brand fonts from [src/app/styles/index.css](../src/app/styles/index.css):

- `font-display`: `Cinzel`
- `font-body`: `Inter`
- `font-dialogue`: `Scheherazade New`
- `font-mono`: `JetBrains Mono`

Recommended roles:

- Display headings: `font-display`
- General UI/body copy: `font-body`
- Scholar names, hadith, dialogue emphasis: `font-dialogue`
- Metrics, counters, compact labels: `font-mono`

Typography rules:

- Use `font-display` for page and chapter headings only.
- Use `font-dialogue` sparingly for moments that should feel textual, scholarly, or reflective.
- Keep long descriptive copy in `font-body` for readability.
- Use tracked uppercase monospace only for labels, chips, HUD metadata, and telemetry-like surfaces.

## Shape Language

The current UI uses soft, large radii and capsule surfaces. That should remain the system default.

Shape rules:

- Main panels: large radii, usually `1.5rem` to `2.5rem`
- Pills/chips: full radius
- Borders: thin, low-contrast, often white with low alpha
- Shadows: deep but soft
- Overlays: translucent ink layers, not opaque black slabs

## Motion

Athar should animate like a calm route interface, not an arcade HUD.

Motion rules:

- Use eased fades and short lateral slides for drawers and panels
- Keep micro-interactions restrained
- Reserve stronger emphasis for chapter start/completion and scholar encounter moments
- Avoid bouncy or playful easing for core navigation

## Map and World Presentation

The map is a geographic backdrop, not the main decorative canvas.

Guidelines:

- Keep map labels secondary to game labels
- Prefer cleaner raster/no-label travel views
- World entities, markers, and chapter landmarks should use the Athar palette
- UI chrome should frame the map without competing with it

## Scholar Presentation

Playable scholars should feel like named historical figures, not class kits.

Current roster:

- Al-Bukhari
- Muslim b. al-Hajjaj
- Abu Dawud al-Sijistani
- Abu Isa al-Tirmidhi

Guidelines:

- Lead with the scholar name first
- Titles should be short and functional
- Mechanical differences can exist, but copy should still feel scholarly
- Avoid overly gamey labels like “tank”, “mage”, or “rogue”

## UI Component Patterns

These patterns are already present and should become the default system:

- Hero panels with atmospheric gradient backgrounds
- Rounded glass drawers for side information
- Full-width top status bar during gameplay
- Gold primary CTAs on dark surfaces
- Low-contrast border-separated metric cards

Components that should share a consistent language:

- buttons
- chips
- section shells
- stat cards
- drawers
- dialogue overlays

## Voice and Copy

Tone:

- concise
- respectful
- grounded
- clear

Prefer:

- “Preserve”
- “Verify”
- “Meet”
- “Reach”
- “Chapter”
- “Route”

Avoid:

- ironic language
- modern slang
- exaggerated fantasy framing
- overly sermon-like copy

## Asset Direction

Assets should match the brand:

- realistic-to-stylized historical readability
- modest material treatment
- grounded costume silhouettes
- warm highlights over dark neutrals

Avoid:

- hyper-saturated fantasy colors
- comic exaggeration
- plastic-looking shaders
- UI icons that feel modern-corporate

## Accessibility and Legibility

Brand consistency should not override readability.

Rules:

- preserve strong contrast between sand text and ink surfaces
- avoid gold-on-white or teal-on-white combinations
- do not use display fonts for body text
- keep tracked uppercase text short
- keep dialogue panels spacious and readable

## Future Brand Expansion

As new systems are added, the brand should scale into:

- combat or hostile encounters
- city-specific chapter identities
- scholar-specific UI signatures
- audio themes by region or chapter

Expansion should still stay within the Athar core palette and tone. Add local variation through secondary accents, textures, and motifs rather than inventing a new visual language for every chapter.

## Implementation Notes

The current brand foundation lives primarily in:

- [index.css](../src/app/styles/index.css)
- [characters.ts](../src/content/characters/characters.ts)
- [gameplay.ts](../src/shared/constants/gameplay.ts)
- [index.tsx](../src/app/routes/index.tsx)
- [HUD.tsx](../src/features/hud/components/HUD.tsx)
- [CharacterSelect.tsx](../src/features/characters/components/CharacterSelect.tsx)

The next cleanup pass should standardize repeated UI shells into reusable primitives so the brand is enforced by code, not just by convention.
