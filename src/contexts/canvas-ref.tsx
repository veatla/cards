import { createContext, useMemo, useRef, type ReactNode } from 'react';

export interface CanvasRefValue {
  getCanvasRect: () => DOMRect | null;
  getCanvasElement: () => HTMLCanvasElement | null;
}

export const CanvasRefContext = createContext<CanvasRefValue | null>(null);

export function CanvasRefProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const value = useMemo<CanvasRefValue>(
    () => ({
      getCanvasRect: () => {
        const canvas = containerRef.current?.querySelector('canvas');
        return canvas?.getBoundingClientRect() ?? null;
      },
      getCanvasElement: () => {
        const canvas = containerRef.current?.querySelector('canvas');
        return canvas ?? null;
      },
    }),
    []
  );

  return (
    <CanvasRefContext.Provider value={value}>
      <div ref={containerRef} style={{ position: 'relative' }}>
        {children}
      </div>
    </CanvasRefContext.Provider>
  );
}
