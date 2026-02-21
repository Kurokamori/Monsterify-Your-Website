import { useRef, useCallback } from 'react';
import { useMapDrawing, type Coordinates, type ResizeHandle } from '@hooks/useMapDrawing';

interface Hotspot {
  id: string;
  name: string;
  coordinates: Coordinates;
}

interface MapCanvasProps {
  imageUrl: string;
  hotspots: Hotspot[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateCoordinates: (id: string, coords: Coordinates) => void;
  onDoubleClickHotspot: (id: string) => void;
  drawMode: boolean;
  onDrawComplete?: (coords: Coordinates) => void;
}

const RESIZE_HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export function MapCanvas({
  imageUrl,
  hotspots,
  selectedId,
  onSelect,
  onUpdateCoordinates,
  onDoubleClickHotspot,
  drawMode,
  onDrawComplete,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { drawingRect, onMouseDown, onMouseMove, onMouseUp } = useMapDrawing(
    containerRef,
    hotspots,
    { onUpdateCoordinates, onDrawComplete, drawEnabled: drawMode },
  );

  const handleOverlayMouseDown = useCallback((e: React.MouseEvent) => {
    // Click on empty area: deselect or start drawing
    onSelect(null);
    onMouseDown(e);
  }, [onSelect, onMouseDown]);

  const handleHotspotMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSelect(id);
    onMouseDown(e, id);
  }, [onSelect, onMouseDown]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, id: string, handle: ResizeHandle) => {
    e.stopPropagation();
    onMouseDown(e, id, handle);
  }, [onMouseDown]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.opacity = '0.3';
  }, []);

  return (
    <div className={`map-canvas${drawMode ? ' map-canvas--draw-mode' : ''}`}>
      <div
        ref={containerRef}
        className="map-canvas__container"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <img
          src={imageUrl}
          alt="Map"
          className="map-canvas__image"
          draggable={false}
          onError={handleImageError}
        />

        {/* Interaction overlay */}
        <div
          className="map-canvas__overlay"
          onMouseDown={handleOverlayMouseDown}
        />

        {/* Existing hotspots */}
        {hotspots.map(hs => {
          const isSelected = hs.id === selectedId;
          const isEmpty = hs.coordinates.width < 1 && hs.coordinates.height < 1;
          return (
            <div
              key={hs.id}
              className={`map-canvas__hotspot${isSelected ? ' map-canvas__hotspot--selected' : ''}${isEmpty ? ' map-canvas__hotspot--empty' : ''}`}
              style={{
                left: `${hs.coordinates.x}%`,
                top: `${hs.coordinates.y}%`,
                width: isEmpty ? undefined : `${hs.coordinates.width}%`,
                height: isEmpty ? undefined : `${hs.coordinates.height}%`,
              }}
              onMouseDown={(e) => handleHotspotMouseDown(e, hs.id)}
              onDoubleClick={() => onDoubleClickHotspot(hs.id)}
            >
              <span className="map-canvas__hotspot-label">{hs.name}</span>

              {isSelected && RESIZE_HANDLES.map(handle => (
                <div
                  key={handle}
                  className={`map-canvas__handle map-canvas__handle--${handle}`}
                  onMouseDown={(e) => handleResizeMouseDown(e, hs.id, handle)}
                />
              ))}
            </div>
          );
        })}

        {/* Drawing rectangle */}
        {drawingRect && drawingRect.width > 0 && drawingRect.height > 0 && (
          <div
            className="map-canvas__drawing-rect"
            style={{
              left: `${drawingRect.x}%`,
              top: `${drawingRect.y}%`,
              width: `${drawingRect.width}%`,
              height: `${drawingRect.height}%`,
            }}
          />
        )}
      </div>

      {drawMode && (
        <div className="map-canvas__draw-hint">
          <i className="fas fa-pencil-alt"></i> Draw mode: click and drag to create a new region
        </div>
      )}
    </div>
  );
}
