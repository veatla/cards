import { CardSuitRow, CARD_BACKS_ROW, CARD_BACK_DEFAULT } from '../types/cards';
import type { CardRank } from '../types/cards';
import type { SolitaireCard, SolitaireState } from './solitaire-types';

let cardIdCounter = 0;
function nextId(): string {
  return `c${++cardIdCounter}`;
}

function createDeck(): SolitaireCard[] {
  const deck: SolitaireCard[] = [];
  const suits: CardSuitRow[] = [
    CardSuitRow.Hearts,
    CardSuitRow.Diamonds,
    CardSuitRow.Clubs,
  ];
  for (const suit of suits) {
    for (let rank = 0; rank < 13; rank++) {
      deck.push({
        suit,
        rank: rank as CardRank,
        faceUp: false,
        id: nextId(),
      });
    }
  }
  return deck;
}

function shuffle<T>(array: T[]): T[] {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createInitialState(): SolitaireState {
  cardIdCounter = 0;
  const deck = shuffle(createDeck());

  const columns: SolitaireState['columns'] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let i = 0; i <= col; i++) {
      const card = deck[idx++];
      card.faceUp = i === col;
      columns[col].push(card);
    }
  }

  const stock = deck.slice(idx);

  return {
    columns,
    foundations: [[], [], [], []],
    stock,
    waste: [],
    selected: null,
  };
}

export function cardFrame(card: SolitaireCard): { row: number; col: number } {
  if (!card.faceUp) {
    return { row: CARD_BACKS_ROW, col: CARD_BACK_DEFAULT };
  }
  return { row: card.suit, col: card.rank };
}

/** Can we put card on top of column (empty column accepts only K/rank 12; else build down) */
export function canPlaceOnColumn(
  card: SolitaireCard,
  column: SolitaireCard[]
): boolean {
  if (column.length === 0) {
    return card.rank === 12;
  }
  const top = column[column.length - 1];
  if (!top.faceUp) return false;
  return card.rank === top.rank - 1;
}

/** Can we put card on foundation (empty = A; else next of same suit) */
export function canPlaceOnFoundation(
  card: SolitaireCard,
  foundation: SolitaireCard[]
): boolean {
  if (foundation.length === 0) {
    return card.rank === 0;
  }
  const top = foundation[foundation.length - 1];
  return top.suit === card.suit && card.rank === top.rank + 1;
}

export function getSelectableRange(column: SolitaireCard[]): number {
  let i = column.length;
  while (i > 0 && column[i - 1].faceUp) i--;
  return i;
}
