import { create } from 'zustand';
import type { SolitaireCard, SolitaireState } from './solitaire-types';
import {
  canPlaceOnColumn,
  canPlaceOnFoundation,
  createInitialState,
  getSelectableRange,
} from './solitaire-logic';
import { hitTestColumn, hitTestFoundation } from './solitaire-constants';

export type DragSource =
  | { type: 'column'; col: number; fromIndex: number }
  | { type: 'waste' };

interface SolitaireStore extends SolitaireState {
  /** Перетаскиваемая группа карт (из колонки — от fromIndex до конца, из сброса — одна) */
  dragging: { cards: SolitaireCard[]; source: DragSource } | null;
  /** Позиция курсора для отрисовки группы */
  dragPosition: { x: number; y: number };
  /** Actions */
  newGame: () => void;
  draw: () => void;
  startDrag: (card: SolitaireCard, source: DragSource) => void;
  setDragPosition: (x: number, y: number) => void;
  dropAt: (globalX: number, globalY: number) => void;
  cancelDrag: () => void;
  /** Перенос одной карты в свободную ячейку (двойной клик). */
  moveCardToFoundation: (card: SolitaireCard, source: DragSource) => boolean;
}

/** Индекс фундамента = масть карты (0 червы, 1 бубны, 2 трефы) */
function foundationIndexForSuit(suit: number): number {
  return suit;
}

/** Забирает одну карту из колонки (для фундамента). */
function takeOneFromColumn(
  columns: SolitaireState['columns'],
  col: number,
  fromIndex: number
): { card: SolitaireCard; columns: SolitaireState['columns'] } {
  const column = columns[col];
  const card = column[fromIndex];
  const newCols = columns.map((c, i) =>
    i === col ? c.slice(0, fromIndex) : c
  ) as SolitaireState['columns'];
  if (newCols[col].length > 0 && !newCols[col][newCols[col].length - 1].faceUp) {
    const top = { ...newCols[col][newCols[col].length - 1], faceUp: true };
    newCols[col] = [...newCols[col].slice(0, -1), top];
  }
  return { card, columns: newCols };
}

/** Забирает группу карт от fromIndex до конца колонки (для переноса в другую колонку). */
function takeGroupFromColumn(
  columns: SolitaireState['columns'],
  col: number,
  fromIndex: number
): { cards: SolitaireCard[]; columns: SolitaireState['columns'] } {
  const column = columns[col];
  const cards = column.slice(fromIndex);
  const newCols = columns.map((c, i) =>
    i === col ? c.slice(0, fromIndex) : c
  ) as SolitaireState['columns'];
  if (newCols[col].length > 0 && !newCols[col][newCols[col].length - 1].faceUp) {
    const top = { ...newCols[col][newCols[col].length - 1], faceUp: true };
    newCols[col] = [...newCols[col].slice(0, -1), top];
  }
  return { cards, columns: newCols };
}

function takeFromWaste(waste: SolitaireCard[]): { card: SolitaireCard; waste: SolitaireCard[] } {
  const card = waste[waste.length - 1];
  return { card, waste: waste.slice(0, -1) };
}

export const useSolitaireStore = create<SolitaireStore>((set, get) => ({
  ...createInitialState(),
  dragging: null,
  dragPosition: { x: 0, y: 0 },

  newGame: () => set({ ...createInitialState(), dragging: null, dragPosition: { x: 0, y: 0 } }),

  draw: () => {
    const { stock, waste } = get();
    if (stock.length === 0) {
      set({ stock: [...waste].reverse(), waste: [], dragging: null });
      return;
    }
    const [top, ...rest] = stock;
    set({
      stock: rest,
      waste: [...waste, { ...top, faceUp: true }],
      dragging: null,
    });
  },

  startDrag: (card, source) => {
    const state = get();
    const cards =
      source.type === 'column'
        ? state.columns[source.col].slice(source.fromIndex)
        : [card];
    set({ dragging: { cards, source }, dragPosition: get().dragPosition });
  },

  setDragPosition: (x, y) => {
    set({ dragPosition: { x, y } });
  },

  cancelDrag: () => set({ dragging: null }),

  dropAt: (globalX, globalY) => {
    const state = get();
    const { dragging, columns, foundations, waste } = state;
    if (!dragging) return;

    const topCard = dragging.cards[0];
    const col = hitTestColumn(globalX, globalY);
    const fi = hitTestFoundation(globalX, globalY);

    if (col !== null && canPlaceOnColumn(topCard, columns[col])) {
      if (dragging.source.type === 'column') {
        if (dragging.source.col === col) {
          set({ dragging: null });
          return;
        }
        const { columns: newColumns, cards } = takeGroupFromColumn(
          columns,
          dragging.source.col,
          dragging.source.fromIndex
        );
        const finalColumns = newColumns.map((c, i) =>
          i === col ? [...c, ...cards] : c
        ) as SolitaireState['columns'];
        set({ columns: finalColumns, dragging: null });
        return;
      }
      if (dragging.source.type === 'waste') {
        const { waste: newWaste } = takeFromWaste(waste);
        const finalColumns = columns.map((c, i) =>
          i === col ? [...c, topCard] : c
        ) as SolitaireState['columns'];
        set({ columns: finalColumns, waste: newWaste, dragging: null });
        return;
      }
    }

    if (fi !== null && canPlaceOnFoundation(topCard, foundations[fi])) {
      if (dragging.source.type === 'column') {
        const { columns: newColumns } = takeOneFromColumn(
          columns,
          dragging.source.col,
          dragging.source.fromIndex
        );
        const newFoundations = foundations.map((f, i) =>
          i === fi ? [...f, topCard] : f
        ) as SolitaireState['foundations'];
        set({ columns: newColumns, foundations: newFoundations, dragging: null });
        return;
      }
      if (dragging.source.type === 'waste') {
        const { waste: newWaste } = takeFromWaste(waste);
        const newFoundations = foundations.map((f, i) =>
          i === fi ? [...f, topCard] : f
        ) as SolitaireState['foundations'];
        set({ waste: newWaste, foundations: newFoundations, dragging: null });
        return;
      }
    }

    set({ dragging: null });
  },

  moveCardToFoundation: (card, source) => {
    const state = get();
    const { columns, foundations, waste } = state;
    const fi = foundationIndexForSuit(card.suit);
    if (fi >= foundations.length || !canPlaceOnFoundation(card, foundations[fi])) {
      return false;
    }
    if (source.type === 'column') {
      const { columns: newColumns } = takeOneFromColumn(columns, source.col, source.fromIndex);
      const newFoundations = foundations.map((f, i) =>
        i === fi ? [...f, card] : f
      ) as SolitaireState['foundations'];
      set({ columns: newColumns, foundations: newFoundations, dragging: null });
      return true;
    }
    if (source.type === 'waste') {
      const { waste: newWaste } = takeFromWaste(waste);
      const newFoundations = foundations.map((f, i) =>
        i === fi ? [...f, card] : f
      ) as SolitaireState['foundations'];
      set({ waste: newWaste, foundations: newFoundations, dragging: null });
      return true;
    }
    return false;
  },
}));

/** Can this card be picked for drag? (top of waste, or in selectable range in column) */
export function canStartDragCard(
  card: SolitaireCard,
  source: DragSource,
  state: SolitaireState
): boolean {
  if (source.type === 'waste') {
    return state.waste.length > 0 && state.waste[state.waste.length - 1].id === card.id;
  }
  const column = state.columns[source.col];
  const start = getSelectableRange(column);
  return (
    source.fromIndex >= start &&
    source.fromIndex < column.length &&
    column[source.fromIndex].id === card.id
  );
}
