/** Suit order in sprite sheet: row index (row 0 = hearts, 1 = diamonds, 2 = clubs) */
export const CardSuitRow = {
  Hearts: 0,
  Diamonds: 1,
  Spades: 2,
  Clubs: 3,
} as const;
export type CardSuitRow = (typeof CardSuitRow)[keyof typeof CardSuitRow];

/** Card backs: row index in sprite sheet (row 4 = 8 разных стилей рубашек) */
export const CARD_BACKS_ROW = 4;

/** Колонки рубашек в cards.png (row 4): 8 стилей, можно менять под выбор пользователя */
export const CARD_BACK_COL_0 = 0;
export const CARD_BACK_COL_1 = 1;
export const CARD_BACK_COL_2 = 2;
export const CARD_BACK_COL_3 = 3;
export const CARD_BACK_COL_4 = 4;
export const CARD_BACK_COL_5 = 5;
export const CARD_BACK_COL_6 = 6;
export const CARD_BACK_COL_7 = 7;

/** Какую рубашку использовать по умолчанию (можно заменить на CARD_BACK_COL_1..7) */
export const CARD_BACK_DEFAULT = CARD_BACK_COL_0;

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
