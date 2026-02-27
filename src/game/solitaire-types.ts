import type { CardRank, CardSuitRow } from '../types/cards';

export interface SolitaireCard {
  suit: CardSuitRow;
  rank: CardRank;
  faceUp: boolean;
  id: string;
}

export type Column = SolitaireCard[];
export type Foundation = SolitaireCard[];

export interface SolitaireState {
  columns: [Column, Column, Column, Column, Column, Column, Column];
  foundations: [Foundation, Foundation, Foundation, Foundation];
  stock: SolitaireCard[];
  waste: SolitaireCard[];
  selected: { type: 'column'; col: number; fromIndex: number } | { type: 'waste' } | null;
}

export const CARD_BACK_INDEX = 0 as const;
