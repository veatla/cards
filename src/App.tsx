import { Application, extend } from "@pixi/react";
import { Container, Graphics, Sprite } from "pixi.js";

import { DeckOfCardsDemo } from "./components/deck-of-cards-demo";
import { FichesSheetDemo } from "./components/fiches-sheet-demo";

extend({
  Container,
  Graphics,
  Sprite,
});

const FICHES_DEMO_OFFSET_Y = 320;

export default function App() {
  return (
    <Application>
      <DeckOfCardsDemo />
      <pixiContainer x={0} y={FICHES_DEMO_OFFSET_Y}>
        <FichesSheetDemo />
      </pixiContainer>
    </Application>
  );
}
