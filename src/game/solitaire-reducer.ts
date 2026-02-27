import type { SolitaireCard, SolitaireState } from './solitaire-types';
import {
  canPlaceOnColumn,
  canPlaceOnFoundation,
  createInitialState,
  getSelectableRange,
} from './solitaire-logic';

type Action =
  | { type: 'draw' }
  | { type: 'selectColumn'; col: number; fromIndex: number }
  | { type: 'selectWaste' }
  | { type: 'moveToColumn'; col: number }
  | { type: 'moveToFoundation'; foundationIndex: number }
  | { type: 'deselect' }
  | { type: 'newGame' };

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

function takeFromWaste(
  waste: SolitaireCard[]
): { card: SolitaireCard; waste: SolitaireCard[] } {
  const card = waste[waste.length - 1];
  return { card, waste: waste.slice(0, -1) };
}

export function solitaireReducer(
  state: SolitaireState,
  action: Action
): SolitaireState {
  switch (action.type) {
    case 'newGame':
      return createInitialState();

    case 'draw': {
      if (state.stock.length === 0) {
        const newStock = [...state.waste].reverse();
        return { ...state, stock: newStock, waste: [] };
      }
      const [top, ...rest] = state.stock;
      const waste = [...state.waste, { ...top, faceUp: true }];
      return { ...state, stock: rest, waste, selected: null };
    }

    case 'selectColumn':
      return { ...state, selected: { type: 'column', col: action.col, fromIndex: action.fromIndex } };

    case 'selectWaste':
      return state.waste.length > 0
        ? { ...state, selected: { type: 'waste' } }
        : state;

    case 'deselect':
      return { ...state, selected: null };

    case 'moveToColumn': {
      if (!state.selected) return state;
      const destCol = state.columns[action.col];

      if (state.selected.type === 'column') {
        if (state.selected.col === action.col) return { ...state, selected: null };
        const { card, columns } = takeFromColumn(
          state.columns,
          state.selected.col,
          state.selected.fromIndex
        );
        if (!canPlaceOnColumn(card, destCol)) return state;
        const newColumns = columns.map((c, i) =>
          i === action.col ? [...c, card] : c
        ) as SolitaireState['columns'];
        return { ...state, columns: newColumns, selected: null };
      }

      if (state.selected.type === 'waste') {
        const { card, waste } = takeFromWaste(state.waste);
        if (!canPlaceOnColumn(card, destCol)) return state;
        const newColumns = state.columns.map((c, i) =>
          i === action.col ? [...c, card] : c
        ) as SolitaireState['columns'];
        return { ...state, columns: newColumns, waste, selected: null };
      }

      return state;
    }

    case 'moveToFoundation': {
      if (!state.selected) return state;
      const found = state.foundations[action.foundationIndex];

      if (state.selected.type === 'column') {
        const { card, columns } = takeFromColumn(
          state.columns,
          state.selected.col,
          state.selected.fromIndex
        );
        if (!canPlaceOnFoundation(card, found)) return state;
        const newFoundations = state.foundations.map((f, i) =>
          i === action.foundationIndex ? [...f, card] : f
        ) as SolitaireState['foundations'];
        return { ...state, columns, foundations: newFoundations, selected: null };
      }

      if (state.selected.type === 'waste') {
        const { card, waste } = takeFromWaste(state.waste);
        if (!canPlaceOnFoundation(card, found)) return state;
        const newFoundations = state.foundations.map((f, i) =>
          i === action.foundationIndex ? [...f, card] : f
        ) as SolitaireState['foundations'];
        return { ...state, waste, foundations: newFoundations, selected: null };
      }

      return state;
    }

    default:
      return state;
  }
}

export function getSelectedCard(state: SolitaireState): SolitaireCard | null {
  if (!state.selected) return null;
  if (state.selected.type === 'waste') {
    return state.waste.length > 0 ? state.waste[state.waste.length - 1] : null;
  }
  const col = state.columns[state.selected.col];
  return col[state.selected.fromIndex] ?? null;
}

export function canMoveToColumn(
  state: SolitaireState,
  colIndex: number
): boolean {
  const card = getSelectedCard(state);
  if (!card) return false;
  return canPlaceOnColumn(card, state.columns[colIndex]);
}

export function canMoveToFoundation(
  state: SolitaireState,
  foundIndex: number
): boolean {
  const card = getSelectedCard(state);
  if (!card) return false;
  return canPlaceOnFoundation(card, state.foundations[foundIndex]);
}

export function isColumnClickValid(
  state: SolitaireState,
  col: number,
  fromIndex: number
): boolean {
  const column = state.columns[col];
  const start = getSelectableRange(column);
  return fromIndex >= start && fromIndex < column.length && column[fromIndex].faceUp;
}
