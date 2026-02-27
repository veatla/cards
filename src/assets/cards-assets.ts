import { Assets, Rectangle, Texture } from 'pixi.js';
import {
  CARDS_SPRITE_SHEET_ID,
  CARDS_SPRITE_SHEET_PATH,
  CARDS_TILE_HEIGHT,
  CARDS_TILE_WIDTH,
} from '../constants';
import type { TileFrame } from '../types/cards';

/** Cache key for a tile: "row,col" */
function getTileCacheKey(frame: TileFrame): string {
  return `${frame.row},${frame.col}`;
}

let sheetTexture: Texture | null = null;
const tileTextureCache = new Map<string, Texture>();

/**
 * Loads the cards sprite sheet once. Caching:
 * - In-memory: Pixi Assets caches by alias (CARDS_SPRITE_SHEET_ID); loadCardsSheet() and
 *   Assets.get(CARDS_SPRITE_SHEET_ID) return the same texture.
 * - In production: serve cards.png from public/ with cache headers, or import the image
 *   in code so Vite emits a hashed filename for long-term browser cache.
 */
export async function loadCardsSheet(): Promise<Texture> {
  if (sheetTexture && !sheetTexture.destroyed) {
    return sheetTexture;
  }
  const existing = Assets.get(CARDS_SPRITE_SHEET_ID);
  if (existing && !existing.destroyed) {
    sheetTexture = existing as Texture;
    return sheetTexture;
  }
  const texture = (await Assets.load({
    alias: CARDS_SPRITE_SHEET_ID,
    src: CARDS_SPRITE_SHEET_PATH,
  })) as Texture;
  sheetTexture = texture;
  return texture;
}

/**
 * Returns a texture for a single tile by row/col. Frames are cached in memory.
 */
export function getCardTileTexture(
  baseTexture: Texture,
  frame: TileFrame
): Texture {
  const key = getTileCacheKey(frame);
  let tile = tileTextureCache.get(key);
  if (tile && !tile.destroyed) {
    return tile;
  }
  const x = frame.col * CARDS_TILE_WIDTH;
  const y = frame.row * CARDS_TILE_HEIGHT;
  const rect = new Rectangle(x, y, CARDS_TILE_WIDTH, CARDS_TILE_HEIGHT);
  tile = new Texture({
    source: baseTexture.source,
    frame: rect,
    label: `card-${key}`,
  });
  tileTextureCache.set(key, tile);
  return tile;
}

/**
 * Ensures the cards sheet is loaded, then returns texture for the given frame.
 */
export async function getCardTileTextureAsync(frame: TileFrame): Promise<Texture> {
  const base = await loadCardsSheet();
  return getCardTileTexture(base, frame);
}
