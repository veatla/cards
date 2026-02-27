import { Application, extend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';

import { CardsSheetDemo } from './components/cards-sheet-demo';

extend({
  Container,
  Graphics,
  Sprite,
});

export default function App() {
  return (
    <Application>
      <CardsSheetDemo />
    </Application>
  );
}
