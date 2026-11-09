# Elderwood Combat Lab — implementation specification

## Goal
A self-contained, single-player combat-testing meadow. The lab intentionally excludes inventory, quests, NPCs, animals, map generation, and scenery clutter. It establishes a readable 4-direction attack system and a tuning workflow before combat is integrated into the wider RPG.

## Files and responsibilities
| Path | Responsibility |
| --- | --- |
| `index.html` / `play.html` | Main browser entry, HUD, mobile controls, debug panel |
| `combat-lab.css` | Responsive, minimal meadow and debug UI |
| `src/combat-lab.js` | RequestAnimationFrame loop, movement, state transitions, rendering, input, dummy, hitstop, damage numbers |
| `src/combat-data.js` | Sprite atlas metadata, four-direction vectors, animation phase and hitbox calculations |
| `assets/hero-sheet.svg` | 32 directional animation cells extracted from the approved original PNG concept sheet |
| `tests/combat-data.test.mjs` | Pure tests for directional hitbox and sprite-frame calculations |
| `legacy.html` | Previous exploration build (not loaded by the Combat Lab) |

## Visual assets
The character is rendered using the actual frame atlas rather than composing body parts at runtime.
- **Sheet:** WebP, 1200 × 600 pixels, optimized from the user-approved transparent PNG. Served as one browser image and cropped through Canvas 2D `drawImage`..
- **Per frame:** 150 × 150 pixels, 8 columns and 4 rows.
- **Rows:** 0 south, 1 east, 2 north, 3 west (flipped horizontally to face left).
- **Columns:** 0–7 sword attack; frame 0 doubles as a static idle/movement placeholder.
- **Total:** 32 authored attack cells = 8 × 4 rows.
- **Idle:** 1 guarded frame.
- **Walk:** Not yet authored; holds the guard frame.
- **Attack:** 8 frames; 0–1 wind-up, 2–4 active, 5–7 recovery.
- **Rendering:** smooth image interpolation, no tile-size pixel-art scaling. Characters are drawn at native proportions with an adjustable camera scale.

Illustrated SVG frames are suitable for testing timing and coherent poses. For a final production look, individually illustrated raster frame sheets (or skeletal animation with properly authored key poses) may provide more consistent motion and equipment customization. No third-party unlicensed sprites are required.

## Combat model
The player has three movement/animation modes: `idle`, `walk`, `attack`. The `attack` mode is divided into phases:
1. **Wind-up:** default 105 ms, frames 0–2. No damaging hitbox.
2. **Active:** default 135 ms, frames 3–5. Directional weapon hitbox is live.
3. **Recovery:** default 165 ms, frames 6–7. No damaging hitbox.

Default total attack duration is 405 ms. A swing can deal damage only once per attack ID, and queued input near the end of recovery can initiate the next attack. On hit, the game applies 48 ms of hitstop, a dummy wobble/flash, and a floating number. Each dummy hit inflicts 8–15 damage; the dummy has 100 HP and resets after defeat.

## Hitbox data
The player/dummy hurtboxes are circles at ground level; the sword is a sector facing in one of four directions. Debug visualization uses the same reach and arc values as collision detection.

Example tuning object:

```json
{
  "speed": 190,
  "playerRadius": 17,
  "windup": 105,
  "active": 135,
  "recovery": 165,
  "reach": 104,
  "arc": 98,
  "hitstop": 48
}
```

- Distances: logical world pixels, subject to viewport scale.
- Time: milliseconds.
- `arc`: full angular width in degrees, centered on the facing vector.
- Player collision radius: 17 px; dummy radius: 28 px.
- A hit occurs if the distance between centers is no more than `reach + dummy.radius` **and** the target lies within the chosen arc. Dummy HP must be positive.
- Damage becomes active at the first active-frame transition, independent of frame rate.

## Debug menu
Open with **F3** or **Debug**. Toggle the attack hitbox (gold during active frames), player/dummy hurtboxes, arena bounds, facing arrow, and live readouts. Readouts show state, frame index, direction and elapsed attack time. Sliders tune wind-up, active duration, recovery, reach, arc width and hitstop. Reset restores the arena/player/dummy; a checkbox enables subtle synthesized impact audio.

## Input
- Desktop: WASD / arrow keys, Space / F / J to attack, Shift to move faster, mouse-click ground to travel, F3 for debugger.
- Mobile: left virtual joystick, right attack button, top Debug button.

## Acceptance and next polish targets
- Four directions can hit/miss the dummy correctly.
- Active attack frames align with damage and hitbox overlay.
- No duplicated hits within a swing.
- Dummy flashes, displays damage, and resets.
- Combat remains understandable on narrow mobile screens.
- The original exploration prototype is not imported by the Combat Lab.

Additional animation polishing should come from hand-refining sprite frames and adjusting wind-up/active/recovery, not adding rotating swords or random foliage.

## Approved illustrated attack sheet (v0.2)
The original character PNG has been optimized and committed as `assets/hero-attack-sheet.webp`. The renderer consumes eight attack cells in each row, without procedural sword rotation. West-facing cells are flipped in the render so the weapon follows a leftward attack. The source artwork is a concept sheet: arcs sometimes extend outside their cell, and this build therefore uses conservative cell cropping. A production sprite sheet should be authored with fixed margins and consistently aligned character feet. No new gameplay features were added.

