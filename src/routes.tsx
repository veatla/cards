import { lazy, Suspense } from 'react';
import { createBrowserRouter, Link, Navigate, RouterProvider } from 'react-router';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Sprite } from 'pixi.js';

import { DeckOfCardsDemo } from './components/deck-of-cards-demo';
import { FichesSheetDemo } from './components/fiches-sheet-demo';

extend({ Container, Graphics, Sprite });

const FICHES_DEMO_OFFSET_Y = 320;

const SolitairePage = lazy(() =>
  import('./pages/solitaire').then((m) => ({ default: m.SolitairePage }))
);

function HomeContent() {
  return (
    <>
      <DeckOfCardsDemo />
      <pixiContainer x={0} y={FICHES_DEMO_OFFSET_Y}>
        <FichesSheetDemo />
      </pixiContainer>
    </>
  );
}

function HomePage() {
  return (
    <div className="page page--home">
      <Application>
        <HomeContent />
      </Application>
      <nav className="game-menu">
        <h1 className="game-menu__title">Выбор игры</h1>
        <ul className="game-menu__list">
          <li>
            <span className="game-menu__link game-menu__link--current">
              Демо: колода и фишки
            </span>
          </li>
          <li>
            <Link to="/solitaire" className="game-menu__link">
              Пасьянс
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function SolitaireFallback() {
  return (
    <div className="page page--solitaire page--loading">
      <div className="loading">Загрузка пасьянса…</div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/solitaire',
    element: (
      <Suspense fallback={<SolitaireFallback />}>
        <SolitairePage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
