import { Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { getFicheTexture, loadFichesSheet } from '../assets/fiches-assets';
import {
  FICHE_TILE_WIDTH,
  FICHE_TILE_HEIGHT,
  FICHES_COLS,
  FICHES_ROWS,
  FICHE_HORIZONTAL_GAP,
} from '../constants';

/**
 * Демо: все 32 спрайта фишек из fiches.png.
 * 8 цветов (колонки), 4 стопки по высоте (1, 2, 4, 8 фишек).
 * Горизонтально: отступ по бокам 16px, между спрайтами 16px. По вертикали без gap.
 */
export function FichesSheetDemo() {
  const [textures, setTextures] = useState<Map<string, Texture>>(new Map());

  useEffect(() => {
    let cancelled = false;
    loadFichesSheet().then((base) => {
      if (cancelled) return;
      const map = new Map<string, Texture>();
      for (let row = 0; row < FICHES_ROWS; row++) {
        for (let col = 0; col < FICHES_COLS; col++) {
          map.set(`${row},${col}`, getFicheTexture(base, row, col));
        }
      }
      setTextures(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (textures.size === 0) return null;

  return (
    <pixiContainer x={0} y={0}>
      {Array.from({ length: FICHES_ROWS }, (_, row) =>
        Array.from({ length: FICHES_COLS }, (_, col) => {
          const tex = textures.get(`${row},${col}`);
          if (!tex) return null;
          const x =
            FICHE_HORIZONTAL_GAP +
            col * (FICHE_TILE_WIDTH + FICHE_HORIZONTAL_GAP);
          const y = row * FICHE_TILE_HEIGHT;
          return (
            <pixiSprite
              key={`${row}-${col}`}
              texture={tex}
              x={x}
              y={y}
              anchor={0}
            />
          );
        })
      )}
    </pixiContainer>
  );
}
