import { Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { getCardTileTexture, loadCardsSheet } from '../assets/cards-assets';
import type { TileFrame } from '../types/cards';

export interface CardTileSpriteProps {
  /** Tile position in the sprite sheet (row, col) */
  frame: TileFrame;
  x?: number;
  y?: number;
  scale?: number;
  anchor?: number | { x: number; y: number };
}

/**
 * Renders a single tile from the cards sprite sheet by row/col.
 * Uses cached sheet and per-frame texture cache.
 */
export function CardTileSprite({
  frame,
  x = 0,
  y = 0,
  scale = 1,
  anchor = 0.5,
}: CardTileSpriteProps) {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCardsSheet().then((base) => {
      if (cancelled) return;
      const tileTexture = getCardTileTexture(base, frame);
      setTexture(tileTexture);
    });
    return () => {
      cancelled = true;
    };
  }, [frame.row, frame.col]);

  if (!texture) return null;

  return (
    <pixiSprite
      texture={texture}
      x={x}
      y={y}
      scale={scale}
      anchor={anchor}
    />
  );
}
