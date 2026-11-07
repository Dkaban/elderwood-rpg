# Elderwood

**Elderwood** is a single-player, isometric medieval fantasy RPG prototype for the browser, inspired by the atmosphere and paper-doll equipment systems of classic 1990s computer RPGs.

Explore the quiet **Whispering Vale**, discover a supply cache, and outfit your wanderer with medieval equipment. Weapons, armor, cloak, shield, and headgear appear on both the character paper doll and the character walking through the world.

## Features

- Isometric forest with winding trails, trees, rocks, flowers, a campsite, and a hidden cache.
- Peaceful, independently roaming rabbits, deer, foxes, squirrels, and birds.
- A straw training dummy to practice directional attacks and see floating damage numbers.
- Directional sword and staff swings with character-body motion, braced feet, and animated arms.
- Toggleable collision and attack-hitbox visualization in the in-game debug menu (Help → Debug, or F3).
- Sprite-based terrain, scenery, and characters built from original procedural pixel art.
- WASD and arrow-key walking, click-to-move with obstacle-aware pathfinding, and Shift to run.
- Character paper doll with seven equipment slots; wear and remove gear with a click, or drag inventory items onto slots.
- Backpack with category filters, lootable equipment, stamina, armor statistic, and practice weapon swings.
- Touch-friendly controls for mobile browsers, including a virtual joystick.
- Automatic local save of equipment, chest loot, and player position.
- No hostile enemies yet. Combat, quests, and additional regions can be added later.

## Play

Open the [GitHub Pages site](https://dkaban.github.io/elderwood-rpg/) once Pages is enabled for this repository.

### Controls

| Control | Action |
| --- | --- |
| WASD / Arrow keys | Move |
| Click / tap terrain | Travel to a point |
| Shift | Run (consumes stamina) |
| I | Open / close backpack |
| P | Open / close paper doll |
| E | Inspect nearby supply cache |
| F / Space | Practice a weapon swing |
| Esc | Close panels |

Click items in the backpack to equip them. Click the paper-doll equipment slots to unequip them. Desktop players can drag items from the backpack into the corresponding slot.

## Technology

Built with HTML, CSS, and modern JavaScript modules using the Canvas 2D API. There are **no runtime dependencies, API keys, accounts, or backend services**. Pixel sprites are generated at runtime and cached; all code and assets are original to this project.

The project can be hosted as a static site on GitHub Pages, or locally using any HTTP static-file server. Browser `file://` URLs may block JavaScript modules, so serve the folder over HTTP for local play (for example, `python -m http.server 8000`).

## Current status

Playable exploration and equipment prototype. It deliberately starts in a peaceful forest without combatants. Future directions include animation sheets, towns, dialogue, quests, creature AI, medieval combat, skills, and a larger interconnected world.

## License

MIT · See [LICENSE](LICENSE).
