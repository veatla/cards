import { Assets, Rectangle, Texture } from "pixi.js";
import {
  FICHES_SPRITE_SHEET_ID,
  FICHES_SPRITE_SHEET_PATH,
  FICHE_TILE_WIDTH,
  FICHE_TILE_HEIGHT,
  FICHE_HORIZONTAL_GAP,
} from "../constants";

let sheetTexture: Texture | null = null;
const tileTextureCache = new Map<string, Texture>();

function getCacheKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Загружает спрайтшит фишек (fiches.png) один раз.
 * 8 цветов × 4 варианта стопки (1, 2, 4, 8 фишек).
 */
export async function loadFichesSheet(): Promise<Texture> {
  if (sheetTexture && !sheetTexture.destroyed) {
    return sheetTexture;
  }
  const existing = Assets.get(FICHES_SPRITE_SHEET_ID);
  if (existing && !existing.destroyed) {
    sheetTexture = existing as Texture;
    return sheetTexture;
  }
  const texture = (await Assets.load({
    alias: FICHES_SPRITE_SHEET_ID,
    src: FICHES_SPRITE_SHEET_PATH,
  })) as Texture;
  sheetTexture = texture;
  return texture;
}

/**
 * Возвращает текстуру одного тайла фишек по row/col.
 * row: 0 = 1 фишка, 1 = 2, 2 = 4, 3 = 8 фишек.
 * col: 0..7 — цвет.
 * В спрайтшите: gap только по горизонтали (16px по бокам и между колонками).
 */
export function getFicheTexture(baseTexture: Texture, row: number, col: number): Texture {
  const key = getCacheKey(row, col);
  let tile = tileTextureCache.get(key);
  if (tile && !tile.destroyed) {
    return tile;
  }
  const x = col * (FICHE_TILE_WIDTH + FICHE_HORIZONTAL_GAP);
  const y = row * FICHE_TILE_HEIGHT;
  const rect = new Rectangle(x, y, FICHE_TILE_WIDTH, FICHE_TILE_HEIGHT);
  tile = new Texture({
    source: baseTexture.source,
    frame: rect,
    label: `fiche-${key}`,
  });
  tileTextureCache.set(key, tile);
  return tile;
}
