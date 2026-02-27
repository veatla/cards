import { Application, extend } from "@pixi/react";
import { Container, Graphics, Sprite } from "pixi.js";
import { Link } from "react-router";
import { CanvasRefProvider } from "../contexts/canvas-ref";
import { SolitaireGame } from "../components/solitaire-game";
import { useSolitaireStore } from "../game/solitaire-store";
import { TABLE_WIDTH, TABLE_HEIGHT } from "../game/solitaire-constants";

extend({ Container, Graphics, Sprite });

export function SolitairePage() {
  const newGame = useSolitaireStore((s) => s.newGame);

  return (
    <div className="page page--solitaire">
      <CanvasRefProvider>
        <Application width={TABLE_WIDTH} height={TABLE_HEIGHT} background="#1a4720">
          <SolitaireGame />
        </Application>
      </CanvasRefProvider>
      <nav className="game-menu game-menu--overlay">
        <Link to="/" className="game-menu__link">
          ← На главную
        </Link>
        <button type="button" className="game-menu__btn" onClick={newGame}>
          Новая игра
        </button>
      </nav>
    </div>
  );
}
