import { CARDS_TILE_HEIGHT, CARDS_TILE_WIDTH } from "../constants";

export const TABLE_HEIGHT = 600;

export const SOLITAIRE_CARD_SCALE = 1.5;
export const CARD_W = CARDS_TILE_WIDTH * SOLITAIRE_CARD_SCALE;
export const CARD_H = CARDS_TILE_HEIGHT * SOLITAIRE_CARD_SCALE;
/** Зазор между картами по горизонтали и шаг колонок */
export const CARD_GAP = 12;
export const COLUMN_DX = CARD_W + CARD_GAP;
/** Вертикальный шаг карт в колонке (чем больше — тем меньше перекрытие) */
export const COLUMN_OVERLAP_Y = 38;
export const TABLE_PADDING = 24;
export const FOUNDATION_Y = TABLE_PADDING;
export const COLUMNS_TOP_Y = FOUNDATION_Y + CARD_H + 16;
export const STOCK_X = TABLE_PADDING;
export const WASTE_X = STOCK_X + CARD_W + CARD_GAP;
/** Смещение карт в веере сброса: 0 = стопка без веера, чтобы не выходить за слот */
export const WASTE_FAN_OFFSET = 0;
/** Отступ между сбросом и фундаментом как слева (TABLE_PADDING) */
export const FIRST_FOUNDATION_X = WASTE_X + CARD_W + CARD_GAP + TABLE_PADDING;
/** 4 foundation slots, then 7 columns */
export const FIRST_COLUMN_X = FIRST_FOUNDATION_X + COLUMN_DX * 4;
/** Ширина стола: колонки + отступ справа как слева (TABLE_PADDING) */
export const TABLE_WIDTH =
  FIRST_COLUMN_X + 6 * COLUMN_DX + CARD_W + TABLE_PADDING;

const COLUMN_DROP_HEIGHT = TABLE_HEIGHT - COLUMNS_TOP_Y - TABLE_PADDING;

/** Hit/drop zone: one column (full height, включает зазор справа) */
export function getColumnBounds(col: number) {
  return {
    x: FIRST_COLUMN_X + col * COLUMN_DX,
    y: COLUMNS_TOP_Y,
    width: COLUMN_DX,
    height: COLUMN_DROP_HEIGHT,
  };
}

/** Hit/drop zone: one foundation (of 4) */
export function getFoundationBounds(fi: number) {
  return {
    x: FIRST_FOUNDATION_X + fi * COLUMN_DX,
    y: FOUNDATION_Y,
    width: COLUMN_DX,
    height: CARD_H,
  };
}

export function hitTestColumn(globalX: number, globalY: number): number | null {
  if (globalY < COLUMNS_TOP_Y || globalY > COLUMNS_TOP_Y + COLUMN_DROP_HEIGHT) return null;
  for (let col = 0; col < 7; col++) {
    const b = getColumnBounds(col);
    if (globalX >= b.x && globalX < b.x + b.width) return col;
  }
  return null;
}

export function hitTestFoundation(globalX: number, globalY: number): number | null {
  if (globalY < FOUNDATION_Y || globalY >= FOUNDATION_Y + CARD_H) return null;
  for (let fi = 0; fi < 4; fi++) {
    const b = getFoundationBounds(fi);
    if (globalX >= b.x && globalX < b.x + b.width) return fi;
  }
  return null;
}
