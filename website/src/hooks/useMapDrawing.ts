import { useState, useCallback, useRef } from 'react';

export interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DrawMode = 'idle' | 'drawing' | 'moving' | 'resizing';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  mode: DrawMode;
  startX: number;
  startY: number;
  hotspotId: string | null;
  handle: ResizeHandle | null;
  originalCoords: Coordinates | null;
}

interface UseMapDrawingOptions {
  onUpdateCoordinates: (id: string, coords: Coordinates) => void;
  onDrawComplete?: (coords: Coordinates) => void;
  drawEnabled: boolean;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getPercentPosition(e: React.MouseEvent, container: HTMLElement): { px: number; py: number } {
  const rect = container.getBoundingClientRect();
  const px = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
  const py = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
  return { px, py };
}

export function useMapDrawing(
  containerRef: React.RefObject<HTMLElement | null>,
  hotspots: Array<{ id: string; coordinates: Coordinates }>,
  options: UseMapDrawingOptions,
) {
  const [drawingRect, setDrawingRect] = useState<Coordinates | null>(null);
  const dragRef = useRef<DragState>({
    mode: 'idle',
    startX: 0,
    startY: 0,
    hotspotId: null,
    handle: null,
    originalCoords: null,
  });

  const onMouseDown = useCallback((e: React.MouseEvent, hotspotId?: string, handle?: ResizeHandle) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const { px, py } = getPercentPosition(e, containerRef.current);
    const drag = dragRef.current;

    if (hotspotId && handle) {
      // Resizing
      const hs = hotspots.find(h => h.id === hotspotId);
      if (!hs) return;
      drag.mode = 'resizing';
      drag.hotspotId = hotspotId;
      drag.handle = handle;
      drag.startX = px;
      drag.startY = py;
      drag.originalCoords = { ...hs.coordinates };
    } else if (hotspotId) {
      // Moving
      const hs = hotspots.find(h => h.id === hotspotId);
      if (!hs) return;
      drag.mode = 'moving';
      drag.hotspotId = hotspotId;
      drag.handle = null;
      drag.startX = px;
      drag.startY = py;
      drag.originalCoords = { ...hs.coordinates };
    } else if (options.drawEnabled) {
      // Drawing new
      drag.mode = 'drawing';
      drag.hotspotId = null;
      drag.handle = null;
      drag.startX = px;
      drag.startY = py;
      drag.originalCoords = null;
      setDrawingRect({ x: px, y: py, width: 0, height: 0 });
    }
  }, [containerRef, hotspots, options.drawEnabled]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (drag.mode === 'idle' || !containerRef.current) return;
    e.preventDefault();

    const { px, py } = getPercentPosition(e, containerRef.current);

    if (drag.mode === 'drawing') {
      const x = Math.min(drag.startX, px);
      const y = Math.min(drag.startY, py);
      const width = Math.abs(px - drag.startX);
      const height = Math.abs(py - drag.startY);
      setDrawingRect({ x, y, width, height });
    } else if (drag.mode === 'moving' && drag.hotspotId && drag.originalCoords) {
      const dx = px - drag.startX;
      const dy = py - drag.startY;
      const newCoords: Coordinates = {
        x: clamp(drag.originalCoords.x + dx, 0, 100 - drag.originalCoords.width),
        y: clamp(drag.originalCoords.y + dy, 0, 100 - drag.originalCoords.height),
        width: drag.originalCoords.width,
        height: drag.originalCoords.height,
      };
      options.onUpdateCoordinates(drag.hotspotId, newCoords);
    } else if (drag.mode === 'resizing' && drag.hotspotId && drag.originalCoords && drag.handle) {
      const oc = drag.originalCoords;
      const newCoords = { ...oc };

      // Adjust based on which handle is being dragged
      if (drag.handle.includes('w')) {
        newCoords.x = clamp(px, 0, oc.x + oc.width - 1);
        newCoords.width = oc.x + oc.width - newCoords.x;
      }
      if (drag.handle.includes('e')) {
        newCoords.width = clamp(px - oc.x, 1, 100 - oc.x);
      }
      if (drag.handle.includes('n')) {
        newCoords.y = clamp(py, 0, oc.y + oc.height - 1);
        newCoords.height = oc.y + oc.height - newCoords.y;
      }
      if (drag.handle.includes('s')) {
        newCoords.height = clamp(py - oc.y, 1, 100 - oc.y);
      }

      options.onUpdateCoordinates(drag.hotspotId, newCoords);
    }
  }, [containerRef, options]);

  const onMouseUp = useCallback(() => {
    const drag = dragRef.current;

    if (drag.mode === 'drawing' && drawingRect && drawingRect.width > 0.5 && drawingRect.height > 0.5) {
      options.onDrawComplete?.(drawingRect);
    }

    drag.mode = 'idle';
    drag.hotspotId = null;
    drag.handle = null;
    drag.originalCoords = null;
    setDrawingRect(null);
  }, [drawingRect, options]);

  return {
    drawingRect,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  };
}

export type { ResizeHandle };
