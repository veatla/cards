import { useCallback, useContext, useEffect, useState } from 'react';
import { Texture } from 'pixi.js';
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

export function SolitaireGame() {
  const canvasRef = useContext(CanvasRefContext);
  const [sheetTexture, setSheetTexture] = useState<Texture | null>(null);
  const [deckTexture, setDeckTexture] = useState<Texture | null>(null);

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

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, canvasRef, setDragPosition, dropAt, cancelDrag]);

  const handleStockClick = useCallback(() => {
    draw();
  }, [draw]);

  const handleCardPointerDown = useCallback(
    (card: SolitaireCard, source: DragSource, globalX: number, globalY: number) => {
      if (!canStartDragCard(card, source, useSolitaireStore.getState())) return;
      setDragPosition(globalX, globalY);
      startDrag(card, source);
    },
    [startDrag, setDragPosition]
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

      {/* Waste - top card draggable */}
      <pixiContainer x={WASTE_X} y={FOUNDATION_Y} eventMode="static">
        {waste.slice(-3).map((card, i) => {
          const isTop = i === waste.slice(-3).length - 1;
          const canDrag = isTop && waste.length > 0 && waste[waste.length - 1].id === card.id;
          return (
            <pixiContainer
              key={card.id}
              x={i * WASTE_FAN_OFFSET}
              y={0}
              eventMode={canDrag ? 'static' : 'none'}
              cursor={canDrag ? 'grab' : 'default'}
              onPointerDown={
                canDrag
                  ? (e: { global: { x: number; y: number } }) =>
                      handleCardPointerDown(card, { type: 'waste' }, e.global.x, e.global.y)
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

      {/* Columns - draggable cards */}
      {columns.map((column, col) => (
        <pixiContainer
          key={col}
          x={FIRST_COLUMN_X + col * COLUMN_DX}
          y={COLUMNS_TOP_Y}
          eventMode="none"
        >
          {column.map((card, i) => {
            const selectableStart = getSelectableRange(column);
            const canDrag = i >= selectableStart && card.faceUp;
            return (
              <pixiContainer
                key={card.id}
                x={CARD_W / 2}
                y={i * COLUMN_OVERLAP_Y + CARD_H / 2}
                eventMode={canDrag ? 'static' : 'none'}
                cursor={canDrag ? 'grab' : 'default'}
                onPointerDown={
                  canDrag
                    ? (e: { global: { x: number; y: number } }) =>
                        handleCardPointerDown(
                          card,
                          { type: 'column', col, fromIndex: i },
                          e.global.x,
                          e.global.y
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
      ))}

      {/* Dragged card - rendered on top */}
      {dragging && (
        <pixiContainer
          x={dragPosition.x}
          y={dragPosition.y}
          zIndex={1000}
          eventMode="none"
          sortableChildren={false}
        >
          <CardTileSprite
            frame={cardFrame(dragging.card)}
            x={0}
            y={0}
            scale={SOLITAIRE_CARD_SCALE}
            anchor={0.5}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
}
