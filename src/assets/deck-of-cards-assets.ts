import { Assets, Rectangle, Texture } from "pixi.js";
import {
  DECK_OF_CARDS_GAP,
  DECK_OF_CARDS_MARGIN,
  DECK_OF_CARDS_POKER_COUNT,
  DECK_OF_CARDS_POKER_HEIGHT,
  DECK_OF_CARDS_POKER_WIDTH,
  DECK_OF_CARDS_ROWS,
  DECK_OF_CARDS_SPRITE_SHEET_ID,
  DECK_OF_CARDS_SPRITE_SHEET_PATH,
  DECK_OF_CARDS_TILE_HEIGHT,
  DECK_OF_CARDS_TILE_WIDTH,
} from "../constants";

let sheetTexture: Texture | null = null;
const tileTextureCache = new Map<string, Texture>();
const pokerTextureCache = new Map<number, Texture>();

/**
 * Загружает спрайтшит deck-of-cards.png один раз.
 * 8 основных тайлов (4×2) 49×73, margin и gap 48px; снизу 2 покерных 51×76.
 */
export async function loadDeckOfCardsSheet(): Promise<Texture> {
  if (sheetTexture && !sheetTexture.destroyed) {
    return sheetTexture;
  }
  const existing = Assets.get(DECK_OF_CARDS_SPRITE_SHEET_ID);
  if (existing && !existing.destroyed) {
    sheetTexture = existing as Texture;
    return sheetTexture;
  }
  const texture = (await Assets.load({
    alias: DECK_OF_CARDS_SPRITE_SHEET_ID,
    src: DECK_OF_CARDS_SPRITE_SHEET_PATH,
  })) as Texture;
  if (texture.source && "scaleMode" in texture.source) {
    (texture.source as { scaleMode: string }).scaleMode = "nearest";
  }
  sheetTexture = texture;
  return texture;
}

/**
 * Позиция основного тайла в спрайтшите (8 тайлов: 4 в ряд, 2 ряда).
 */
function getMainTileRect(row: number, col: number): Rectangle {
  const x = DECK_OF_CARDS_MARGIN + col * (DECK_OF_CARDS_TILE_WIDTH + DECK_OF_CARDS_GAP);
  const y = DECK_OF_CARDS_MARGIN + 23 + row * (DECK_OF_CARDS_TILE_HEIGHT + DECK_OF_CARDS_GAP);
  return new Rectangle(x, y, DECK_OF_CARDS_TILE_WIDTH, DECK_OF_CARDS_TILE_HEIGHT);
}

/**
 * Основные тайлы колоды: row 0..1, col 0..3 (8 штук), размер 49×73.
 */
export function getDeckOfCardsTileTexture(baseTexture: Texture, row: number, col: number): Texture {
  const key = `main-${row},${col}`;
  let tile = tileTextureCache.get(key);
  if (tile && !tile.destroyed) {
    return tile;
  }
  const rect = getMainTileRect(row, col);
  tile = new Texture({
    source: baseTexture.source,
    frame: rect,
    label: `deck-${key}`,
  });
  tileTextureCache.set(key, tile);
  return tile;
}

/**
 * Два тайла снизу (покер, с разрезом сверху): 51×76.
 * index 0 или 1.
 */
export function getDeckOfCardsPokerTexture(baseTexture: Texture, index: number): Texture {
  if (index < 0 || index >= DECK_OF_CARDS_POKER_COUNT) {
    throw new RangeError(`Poker index must be 0 or 1, got ${index}`);
  }
  let tile = pokerTextureCache.get(index);
  if (tile && !tile.destroyed) {
    return tile;
  }
  const y =
    DECK_OF_CARDS_MARGIN +
    DECK_OF_CARDS_ROWS * DECK_OF_CARDS_TILE_HEIGHT +
    (DECK_OF_CARDS_ROWS - 1) * DECK_OF_CARDS_GAP +
    DECK_OF_CARDS_GAP;
  const x = DECK_OF_CARDS_MARGIN + index * (DECK_OF_CARDS_POKER_WIDTH + DECK_OF_CARDS_GAP);
  const rect = new Rectangle(x, y, DECK_OF_CARDS_POKER_WIDTH, DECK_OF_CARDS_POKER_HEIGHT);
  tile = new Texture({
    source: baseTexture.source,
    frame: rect,
    label: `deck-poker-${index}`,
  });
  pokerTextureCache.set(index, tile);
  return tile;
}
