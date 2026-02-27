import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Rectangle, Texture } from 'pixi.js';
import { loadCardsSheet } from '../assets/cards-assets';
import {
  getDeckOfCardsTileTexture,
  loadDeckOfCardsSheet,
} from '../assets/deck-of-cards-assets';
import { CardTileSprite } from './card-tile-sprite';
import { CanvasRefContext } from '../contexts/canvas-ref';
import { cardFrame, getSelectableRange } from '../game/solitaire-logic';
import {
  canStartDragCard,
  useSolitaireStore,
} from '../game/solitaire-store';
import type { DragSource } from '../game/solitaire-store';
import type { SolitaireCard } from '../game/solitaire-types';
import {
  CARD_H,
  CARD_W,
  COLUMN_DX,
  COLUMN_OVERLAP_Y,
  COLUMNS_TOP_Y,
  FIRST_COLUMN_X,
  FIRST_FOUNDATION_X,
  FOUNDATION_Y,
  getColumnOverlap,
  SOLITAIRE_CARD_SCALE,
  STOCK_X,
  TABLE_HEIGHT,
  TABLE_WIDTH,
  WASTE_FAN_OFFSET,
  WASTE_X,
} from '../game/solitaire-constants';

/** Тайл колоды в deck-of-cards.png: первый из 8 (row 0, col 0) */
const DECK_TILE_ROW = 0;
const DECK_TILE_COL = 0;

/** Hit area карты (центр 0,0, anchor 0.5) */
const CARD_HIT_RECT = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);

export function SolitaireGame() {
  const canvasRef = useContext(CanvasRefContext);
  const [sheetTexture, setSheetTexture] = useState<Texture | null>(null);
  const [deckTexture, setDeckTexture] = useState<Texture | null>(null);

  const doubleClickRef = useRef<{ cardId: string; time: number } | null>(null);
  const DOUBLE_CLICK_MS = 400;

  const {
    columns,
    foundations,
    stock,
    waste,
    dragging,
    dragPosition,
    draw,
    startDrag,
    setDragPosition,
    dropAt,
    cancelDrag,
    moveCardToFoundation,
  } = useSolitaireStore();

  useEffect(() => {
    let cancelled = false;
    loadCardsSheet().then((tex) => {
      if (cancelled) return;
      setSheetTexture(tex);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalInFoundations =
    foundations[0].length +
    foundations[1].length +
    foundations[2].length +
    foundations[3].length;
  const isWin = totalInFoundations === 52; // 4 масти × 13 карт

  useEffect(() => {
    if (isWin) {
      const t = setTimeout(() => alert('Поздравляем! Вы собрали все карты в свободные ячейки.'), 100);
      return () => clearTimeout(t);
    }
  }, [isWin]);

  useEffect(() => {
    let cancelled = false;
    loadDeckOfCardsSheet().then((base) => {
      if (cancelled) return;
      setDeckTexture(getDeckOfCardsTileTexture(base, DECK_TILE_ROW, DECK_TILE_COL));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dragging || !canvasRef?.getCanvasRect) return;

    const clientToCanvas = (clientX: number, clientY: number) => {
      const rect = canvasRef.getCanvasRect();
      if (!rect || rect.width === 0 || rect.height === 0) return null;
      const scaleX = TABLE_WIDTH / rect.width;
      const scaleY = TABLE_HEIGHT / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const onMove = (e: PointerEvent) => {
      const pt = clientToCanvas(e.clientX, e.clientY);
      if (pt) setDragPosition(pt.x, pt.y);
    };

    const onUp = (e: PointerEvent) => {
      const canvas = canvasRef.getCanvasElement?.();
      if (canvas && typeof canvas.releasePointerCapture === 'function') {
        canvas.releasePointerCapture(e.pointerId);
      }
      const rect = canvasRef.getCanvasRect();
      if (!rect) {
        cancelDrag();
        return;
      }
      const pt = clientToCanvas(e.clientX, e.clientY);
      if (pt) dropAt(pt.x, pt.y);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove, { capture: true });
    window.addEventListener('pointerup', onUp, { capture: true });
    return () => {
      window.removeEventListener('pointermove', onMove, { capture: true });
      window.removeEventListener('pointerup', onUp, { capture: true });
    };
  }, [dragging, canvasRef, setDragPosition, dropAt, cancelDrag]);

  const handleStockClick = useCallback(() => {
    draw();
  }, [draw]);

  const handleCardPointerDown = useCallback(
    (
      card: SolitaireCard,
      source: DragSource,
      globalX: number,
      globalY: number,
      pointerId: number
    ) => {
      if (!canStartDragCard(card, source, useSolitaireStore.getState())) return;
      setDragPosition(globalX, globalY);
      startDrag(card, source);
      const canvas = canvasRef?.getCanvasElement?.();
      if (canvas && typeof canvas.setPointerCapture === 'function') {
        canvas.setPointerCapture(pointerId);
      }
    },
    [startDrag, setDragPosition, canvasRef]
  );

  /** Клик по карте в колонке: двойной — в свободную ячейку (по масти), иначе — начало перетаскивания */
  const handleColumnCardPointerDown = useCallback(
    (
      card: SolitaireCard,
      col: number,
      fromIndex: number,
      globalX: number,
      globalY: number,
      pointerId: number
    ) => {
      const source: DragSource = { type: 'column', col, fromIndex };
      if (!canStartDragCard(card, source, useSolitaireStore.getState())) return;
      const now = Date.now();
      const prev = doubleClickRef.current;
      if (prev?.cardId === card.id && now - prev.time < DOUBLE_CLICK_MS) {
        doubleClickRef.current = null;
        if (moveCardToFoundation(card, source)) return;
      }
      doubleClickRef.current = { cardId: card.id, time: now };
      setDragPosition(globalX, globalY);
      startDrag(card, source);
      const canvas = canvasRef?.getCanvasElement?.();
      if (canvas && typeof canvas.setPointerCapture === 'function') {
        canvas.setPointerCapture(pointerId);
      }
    },
    [startDrag, setDragPosition, canvasRef, moveCardToFoundation]
  );

  /** Клик по карте в сбросе: двойной — в свободную ячейку, иначе — начало перетаскивания */
  const handleWasteCardPointerDown = useCallback(
    (card: SolitaireCard, globalX: number, globalY: number, pointerId: number) => {
      const source: DragSource = { type: 'waste' };
      if (!canStartDragCard(card, source, useSolitaireStore.getState())) return;
      const now = Date.now();
      const prev = doubleClickRef.current;
      if (prev?.cardId === card.id && now - prev.time < DOUBLE_CLICK_MS) {
        doubleClickRef.current = null;
        if (moveCardToFoundation(card, source)) return;
      }
      doubleClickRef.current = { cardId: card.id, time: now };
      handleCardPointerDown(card, source, globalX, globalY, pointerId);
    },
    [handleCardPointerDown, moveCardToFoundation]
  );

  if (!sheetTexture) return null;

  return (
    <pixiContainer x={0} y={0} eventMode="static" sortableChildren>
      {/* Table background */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.roundRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT, 8);
          g.fill({ color: 0x2d5a27, alpha: 1 });
        }}
      />

      {/* Stock - колода (getFicheTexture) */}
      <pixiContainer
        x={STOCK_X}
        y={FOUNDATION_Y}
        eventMode="static"
        cursor="pointer"
        onPointerDown={handleStockClick}
      >
        {stock.length > 0 && deckTexture ? (
          <pixiSprite
            texture={deckTexture}
            x={CARD_W / 2}
            y={CARD_H / 2}
            width={CARD_W}
            height={CARD_H}
            anchor={0.5}
          />
        ) : stock.length > 0 ? (
          <CardTileSprite
            frame={{ row: 3, col: 0 }}
            x={CARD_W / 2}
            y={CARD_H / 2}
            scale={SOLITAIRE_CARD_SCALE}
            anchor={0.5}
          />
        ) : (
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(0, 0, CARD_W, CARD_H, 4);
              g.stroke({ width: 2, color: 0x444444 });
            }}
            x={0}
            y={0}
          />
        )}
      </pixiContainer>

      {/* Waste - при перетаскивании верхняя карта скрыта (рисуется только у курсора) */}
      <pixiContainer x={WASTE_X} y={FOUNDATION_Y} eventMode="static">
        {waste
          .slice(-3)
          .filter(
            (card) =>
              !(dragging?.source.type === 'waste' && dragging.cards[0].id === card.id)
          )
          .map((card, i, arr) => {
            const isTop = i === arr.length - 1;
            const canDrag =
              isTop && waste.length > 0 && waste[waste.length - 1].id === card.id;
            return (
              <pixiContainer
                key={card.id}
                x={i * WASTE_FAN_OFFSET}
                y={0}
                eventMode={canDrag ? 'static' : 'none'}
                cursor={canDrag ? 'grab' : 'default'}
                onPointerDown={
                  canDrag
                    ? (e: { global: { x: number; y: number }; pointerId: number }) =>
                        handleWasteCardPointerDown(card, e.global.x, e.global.y, e.pointerId)
                    : undefined
                }
              >
                <CardTileSprite
                  frame={cardFrame(card)}
                  x={CARD_W / 2}
                  y={CARD_H / 2}
                  scale={SOLITAIRE_CARD_SCALE}
                  anchor={0.5}
                />
              </pixiContainer>
            );
          })}
      </pixiContainer>

      {/* Foundations - 4 свободные ячейки */}
      {[0, 1, 2, 3].map((fi) => (
        <pixiContainer
          key={fi}
          x={FIRST_FOUNDATION_X + fi * COLUMN_DX}
          y={FOUNDATION_Y}
          eventMode="none"
        >
          {foundations[fi].length > 0 ? (
            <CardTileSprite
              frame={cardFrame(foundations[fi][foundations[fi].length - 1])}
              x={CARD_W / 2}
              y={CARD_H / 2}
              scale={SOLITAIRE_CARD_SCALE}
              anchor={0.5}
            />
          ) : (
            <pixiGraphics
              draw={(g) => {
                g.clear();
                g.roundRect(0, 0, CARD_W, CARD_H, 4);
                g.stroke({ width: 2, color: 0x555555 });
              }}
              x={0}
              y={0}
            />
          )}
        </pixiContainer>
      ))}

      {/* Columns - пустой слот когда нет карт, иначе карты с динамическим overlap */}
      {columns.map((column, col) => {
        const overlap = getColumnOverlap(column.length);
        return (
          <pixiContainer
            key={col}
            x={FIRST_COLUMN_X + col * COLUMN_DX}
            y={COLUMNS_TOP_Y}
            eventMode="static"
            interactiveChildren={true}
          >
            {column.length === 0 ? (
              <pixiGraphics
                x={CARD_W / 2}
                y={CARD_H / 2}
                draw={(g) => {
                  g.clear();
                  g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 4);
                  g.stroke({ width: 2, color: 0x2d5a34 });
                }}
              />
            ) : null}
            {column.map((card, i) => {
              const isDraggingThisCard =
                dragging?.source.type === 'column' &&
                dragging.source.col === col &&
                i >= dragging.source.fromIndex;
              if (isDraggingThisCard) return null;
              const selectableStart = getSelectableRange(column);
              const canDrag = i >= selectableStart && card.faceUp;
              return (
                <pixiContainer
                  key={card.id}
                  x={CARD_W / 2}
                  y={i * overlap + CARD_H / 2}
                eventMode={canDrag ? 'static' : 'none'}
                cursor={canDrag ? 'grab' : 'default'}
                hitArea={CARD_HIT_RECT}
                onPointerDown={
                  canDrag
                    ? (e: { global: { x: number; y: number }; pointerId: number }) =>
                        handleColumnCardPointerDown(
                          card,
                          col,
                          i,
                          e.global.x,
                          e.global.y,
                          e.pointerId
                        )
                    : undefined
                }
                sortableChildren={false}
              >
                <CardTileSprite
                  frame={cardFrame(card)}
                  x={0}
                  y={0}
                  scale={SOLITAIRE_CARD_SCALE}
                  anchor={0.5}
                />
              </pixiContainer>
            );
          })}
          </pixiContainer>
        );
      })}

      {/* Перетаскиваемая группа карт — стопка у курсора */}
      {dragging && (
        <pixiContainer
          x={dragPosition.x}
          y={dragPosition.y}
          zIndex={1000}
          eventMode="none"
          sortableChildren={false}
        >
          {dragging.cards.map((card, i) => (
            <CardTileSprite
              key={card.id}
              frame={cardFrame(card)}
              x={0}
              y={i * COLUMN_OVERLAP_Y}
              scale={SOLITAIRE_CARD_SCALE}
              anchor={0.5}
            />
          ))}
        </pixiContainer>
      )}
    </pixiContainer>
  );
}
