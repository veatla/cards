/** Suit order in sprite sheet: row index (row 0 = hearts, 1 = diamonds, 2 = clubs) */
export const CardSuitRow = {
  Hearts: 0,
  Diamonds: 1,
  Clubs: 2,
} as const;
export type CardSuitRow = (typeof CardSuitRow)[keyof typeof CardSuitRow];

/** Card backs row index in sprite sheet */
export const CARD_BACKS_ROW = 3;

/** Ranks: column index in sprite sheet (0 = Ace, 12 = King) */
export type CardRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Jokers: columns after King in first row */
export const JOKER_COL_1 = 13;
export const JOKER_COL_2 = 14;

export interface TileFrame {
  row: number;
  col: number;
}

export interface CardTileId {
  suit: CardSuitRow;
  rank: CardRank;
}

export type CardBackIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
