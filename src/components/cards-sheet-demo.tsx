import { Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { getCardTileTexture, loadCardsSheet } from '../assets/cards-assets';
import { CARDS_TILE_HEIGHT, CARDS_TILE_WIDTH } from '../constants';
import { CARD_TILE_ORDER } from '../constants/card-layout';
import type { TileFrame } from '../types/cards';

const TILE_SCALE = 1;
const SPACING_X = CARDS_TILE_WIDTH * TILE_SCALE + 4;
const SPACING_Y = CARDS_TILE_HEIGHT * TILE_SCALE + 4;

/** Group flat tile list by sprite sheet row for display */
function groupByRow(): { frame: TileFrame; index: number }[][] {
  const rows = new Map<number, { frame: TileFrame; index: number }[]>();
  CARD_TILE_ORDER.forEach((frame, index) => {
    const r = frame.row;
    if (!rows.has(r)) rows.set(r, []);
    rows.get(r)!.push({ frame, index });
  });
  return [...rows.keys()].sort((a, b) => a - b).map((r) => rows.get(r)!);
}

/**
 * Renders all card tiles in layout order:
 * Row 1: Ace–King Hearts + 2 Jokers
 * Row 2: Ace–King Diamonds
 * Row 3: Ace–King Clubs
 * Row 4: 8 card backs
 */
export function CardsSheetDemo() {
  const [textures, setTextures] = useState<Map<number, Texture>>(new Map());

  useEffect(() => {
    let cancelled = false;
    loadCardsSheet().then((base) => {
      if (cancelled) return;
      const map = new Map<number, Texture>();
      CARD_TILE_ORDER.forEach((frame, index) => {
        map.set(index, getCardTileTexture(base, frame));
      });
      setTextures(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (textures.size === 0) return null;

  const rows = groupByRow();

  return (
    <pixiContainer x={20} y={20}>
      {rows.map((r, rowIndex) =>
        r.map(({ frame, index }, colIndex) => {
          const tex = textures.get(index);
          if (!tex) return null;
          return (
            <pixiSprite
              key={`${frame.row}-${frame.col}`}
              texture={tex}
              x={colIndex * SPACING_X}
              y={rowIndex * SPACING_Y}
              scale={TILE_SCALE}
              anchor={0}
            />
          );
        })
      )}
    </pixiContainer>
  );
}
