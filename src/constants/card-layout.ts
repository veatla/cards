import type { TileFrame } from '../types/cards';
import { CardSuitRow, CARD_BACKS_ROW, JOKER_COL_1, JOKER_COL_2 } from '../types/cards';

/**
 * Order of tiles as they appear in the sprite sheet.
 * Row 5: 8 card back styles (CARD_BACKS_ROW, cols 0..7).
 */
export const CARD_TILE_ORDER: TileFrame[] = [
  // Row 0: Ace Heart .. King Heart, Joker, Joker
  ...Array.from({ length: 15 }, (_, col) => ({ row: CardSuitRow.Hearts, col })),
  // Row 1: Ace Diamonds .. King Diamonds
  ...Array.from({ length: 13 }, (_, col) => ({ row: CardSuitRow.Diamonds, col })),
  // Row 2: Ace Clubs .. King Clubs
  ...Array.from({ length: 13 }, (_, col) => ({ row: CardSuitRow.Clubs, col })),
  // Row 3: 8 card backs
  ...Array.from({ length: 8 }, (_, col) => ({ row: CARD_BACKS_ROW, col })),
];

/** Total number of card tiles (excluding jokers from count if needed for game logic) */
export const TOTAL_CARD_TILES = CARD_TILE_ORDER.length;

/** Column indices for jokers in row 0 */
export const JOKER_COLUMNS = [JOKER_COL_1, JOKER_COL_2] as const;
