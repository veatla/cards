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
  /** Currently dragged card and source (card stays in source until drop) */
  dragging: { card: SolitaireCard; source: DragSource } | null;
  /** Screen position of dragged card (for rendering) */
  dragPosition: { x: number; y: number };
  /** Actions */
  newGame: () => void;
  draw: () => void;
  startDrag: (card: SolitaireCard, source: DragSource) => void;
  setDragPosition: (x: number, y: number) => void;
  dropAt: (globalX: number, globalY: number) => void;
  cancelDrag: () => void;
}

function takeFromColumn(
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
    set({ dragging: { card, source }, dragPosition: get().dragPosition });
  },

  setDragPosition: (x, y) => {
    set({ dragPosition: { x, y } });
  },

  cancelDrag: () => set({ dragging: null }),

  dropAt: (globalX, globalY) => {
    const state = get();
    const { dragging, columns, foundations, waste } = state;
    if (!dragging) return;

    const card = dragging.card;
    const col = hitTestColumn(globalX, globalY);
    const fi = hitTestFoundation(globalX, globalY);

    if (col !== null && canPlaceOnColumn(card, columns[col])) {
      if (dragging.source.type === 'column') {
        if (dragging.source.col === col) {
          set({ dragging: null });
          return;
        }
        const { columns: newColumns } = takeFromColumn(
          columns,
          dragging.source.col,
          dragging.source.fromIndex
        );
        const finalColumns = newColumns.map((c, i) =>
          i === col ? [...c, card] : c
        ) as SolitaireState['columns'];
        set({ columns: finalColumns, dragging: null });
        return;
      }
      if (dragging.source.type === 'waste') {
        const { waste: newWaste } = takeFromWaste(waste);
        const finalColumns = columns.map((c, i) =>
          i === col ? [...c, card] : c
        ) as SolitaireState['columns'];
        set({ columns: finalColumns, waste: newWaste, dragging: null });
        return;
      }
    }

    if (fi !== null && canPlaceOnFoundation(card, foundations[fi])) {
      if (dragging.source.type === 'column') {
        const { columns: newColumns } = takeFromColumn(
          columns,
          dragging.source.col,
          dragging.source.fromIndex
        );
        const newFoundations = foundations.map((f, i) =>
          i === fi ? [...f, card] : f
        ) as SolitaireState['foundations'];
        set({ columns: newColumns, foundations: newFoundations, dragging: null });
        return;
      }
      if (dragging.source.type === 'waste') {
        const { waste: newWaste } = takeFromWaste(waste);
        const newFoundations = foundations.map((f, i) =>
          i === fi ? [...f, card] : f
        ) as SolitaireState['foundations'];
        set({ waste: newWaste, foundations: newFoundations, dragging: null });
        return;
      }
    }

    set({ dragging: null });
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
