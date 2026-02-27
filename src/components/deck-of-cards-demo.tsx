import { Assets, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';

const DECK_OF_CARDS_PATH = '/deck-of-cards.png';

export function DeckOfCardsDemo() {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    Assets.load(DECK_OF_CARDS_PATH).then((tex) => {
      if (cancelled) return;
      setTexture(tex as Texture);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!texture) return null;

  return (
    <pixiSprite
      texture={texture}
      x={0}
      y={0}
      anchor={0}
    />
  );
}
