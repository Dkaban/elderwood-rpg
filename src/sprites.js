// Painterly Elderwood sprite atlas. Keep the original game-facing sprite API
// so movement, combat, inventory, paper doll and wildlife continue to work.
import {storySprite, storyCharacter, storyAnimal} from './storybook.js';

const terrain = new Map();
const characters = new Map();
const wildlife = new Map();

export const sprites = {
  get(kind, variant=0) {
    const key = kind + ':' + variant;
    if (!terrain.has(key)) terrain.set(key, storySprite(kind, variant));
    return terrain.get(key);
  },
  character(equipment, direction='south', walking=false, swingPhase=false) {
    // Limit animated variants, but keep enough frames for a smooth slash.
    const phase = swingPhase===false ? false : Math.round(Math.max(0, Math.min(1, swingPhase))*12)/12;
    const key = JSON.stringify([equipment, direction, !!walking, phase]);
    if (!characters.has(key)) characters.set(key, storyCharacter(equipment, direction, walking, phase));
    return characters.get(key);
  },
  wildlife(type, step=0, facing='right') {
    const key = type + ':' + (step?1:0) + ':' + facing;
    if (!wildlife.has(key)) wildlife.set(key, storyAnimal(type, step?1:0, facing));
    return wildlife.get(key);
  }
};