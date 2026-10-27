import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CircuitNode, WireConnection } from '../types/circuit';
import { Map, ChevronDown, ChevronUp, Focus, Compass } from 'lucide-react';

interface MiniMapProps {
  nodes: CircuitNode[];
  wires: WireConnection[];
  pan: { x: number; y: number };
  zoom: number;
  containerWidth: number;
  containerHeight: number;
  selectedNodeId: string | null;
  onPanChange: (newPan: { x: number; y: number }) => void;
  onFitView?: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  nodes,
  wires,
  pan,
  zoom,
  containerWidth,
  containerHeight,
  selectedNodeId,
  onPanChange,
  onFitView,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const mapWidth = 200;
  const mapHeight = 130;

  // 1. Calculate Visible Viewport in Canvas Coordinates
  const visibleLeft = -pan.x / zoom;
  const visibleTop = -pan.y / zoom;
  const visibleWidth = containerWidth / zoom;
  const visibleHeight = containerHeight / zoom;

  // 2. Calculate World Bounds (encompassing all nodes + current visible area with padding)
  const nodeXCoords = nodes.map(n => n.x);
  const nodeYCoords = nodes.map(n => n.y);

  const rawMinX = nodes.length > 0 ? Math.min(...nodeXCoords) : 0;
  const rawMaxX = nodes.length > 0 ? Math.max(...nodeXCoords.map(x => x + 110)) : 800;
  const rawMinY = nodes.length > 0 ? Math.min(...nodeYCoords) : 0;
  const rawMaxY = nodes.length > 0 ? Math.max(...nodeYCoords.map(y => y + 84)) : 600;

  // Include current visible viewport in world bounds so the camera frame is never out of bounds
  const worldMinX = Math.min(rawMinX, visibleLeft) - 120;
  const worldMaxX = Math.max(rawMaxX, visibleLeft + visibleWidth) + 120;
  const worldMinY = Math.min(rawMinY, visibleTop) - 100;
  const worldMaxY = Math.max(rawMaxY, visibleTop + visibleHeight) + 100;

  const worldWidth = Math.max(worldMaxX - worldMinX, 600);
  const worldHeight = Math.max(worldMaxY - worldMinY, 400);

  // 3. Scaling & Centering Math
  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const mapScale = Math.min(scaleX, scaleY);

  const offsetX = (mapWidth - worldWidth * mapScale) / 2;
  const offsetY = (mapHeight - worldHeight * mapScale) / 2;

  const toMapX = useCallback(
    (canvasX: number) => offsetX + (canvasX - worldMinX) * mapScale,
    [offsetX, worldMinX, mapScale]
  );

  const toMapY = useCallback(
    (canvasY: number) => offsetY + (canvasY - worldMinY) * mapScale,
    [offsetY, worldMinY, mapScale]
  );

  const toCanvasX = useCallback(
    (mapX: number) => worldMinX + (mapX - offsetX) / mapScale,
    [worldMinX, offsetX, mapScale]
  );

  const toCanvasY = useCallback(
    (mapY: number) => worldMinY + (mapY - offsetY) / mapScale,
    [worldMinY, offsetY, mapScale]
  );

  // 4. Viewport Viewfinder Dimensions
  const viewRectX = toMapX(visibleLeft);
  const viewRectY = toMapY(visibleTop);
  const viewRectWidth = visibleWidth * mapScale;
  const viewRectHeight = visibleHeight * mapScale;

  // 5. Navigation Click / Drag Handler
  const handleNavigate = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clickMapX = clientX - rect.left;
      const clickMapY = clientY - rect.top;

      const targetCanvasCenterX = toCanvasX(clickMapX);
      const targetCanvasCenterY = toCanvasY(clickMapY);

      const newPanX = containerWidth / 2 - targetCanvasCenterX * zoom;
      const newPanY = containerHeight / 2 - targetCanvasCenterY * zoom;

      onPanChange({ x: newPanX, y: newPanY });
    },
    [toCanvasX, toCanvasY, containerWidth, containerHeight, zoom, onPanChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNavigating(true);
    handleNavigate(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isNavigating) return;
      handleNavigate(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (isNavigating) {
        setIsNavigating(false);
      }
    };

    if (isNavigating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isNavigating, handleNavigate]);

  return (
    <div className="absolute bottom-4 right-4 z-30 select-none flex flex-col items-end">
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl shadow-xl backdrop-blur-md transition-all text-xs font-semibold cursor-pointer"
          title="Buka Mini-Map"
        >
          <Compass size={14} className="text-sky-400" />
          <span>Mini-Map</span>
        </button>
      ) : (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col transition-all">
          {/* Header */}
          <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Compass size={13} className="text-sky-400" />
              <span>Mini-Map</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {nodes.length} node
              </span>
            </div>

            <div className="flex items-center gap-1">
              {onFitView && (
                <button
                  onClick={onFitView}
                  className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Pusatkan Seluruh Rangkaian (Fit View)"
                >
                  <Focus size={13} />
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Sembunyikan Mini-Map"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div
            className="p-2 cursor-crosshair bg-[#080d1a]"
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => {
              if (e.touches[0]) {
                handleNavigate(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
            onTouchMove={(e) => {
              if (e.touches[0]) {
                handleNavigate(e.touches[0].clientX, e.touches[0].clientY);
              }
            }}
          >
            <svg
              ref={svgRef}
              width={mapWidth}
              height={mapHeight}
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className="overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/70"
            >
              {/* Subtle grid lines */}
              <defs>
                <pattern
                  id="minimap-grid"
                  width="20"
                  height="20"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r="0.8" fill="rgba(56, 189, 248, 0.15)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#minimap-grid)" />

              {/* Render Mini Wires */}
              {wires.map((wire) => {
                const n1 = nodes.find(n => n.id === wire.fromNodeId);
                const n2 = nodes.find(n => n.id === wire.toNodeId);
                if (!n1 || !n2) return null;

                const x1 = toMapX(n1.x + 110);
                const y1 = toMapY(n1.y + 42);
                const x2 = toMapX(n2.x);
                const y2 = toMapY(n2.y + 42);

                return (
                  <line
                    key={wire.id}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={wire.signal ? '#38bdf8' : '#334155'}
                    strokeWidth={wire.signal ? '1.5' : '1'}
                    strokeOpacity={wire.signal ? '0.9' : '0.6'}
                  />
                );
              })}

              {/* Render Mini Nodes */}
              {nodes.map((node) => {
                const nx = toMapX(node.x);
                const ny = toMapY(node.y);
                const nw = Math.max(12, 110 * mapScale);
                const nh = Math.max(8, 84 * mapScale);
                const isSelected = selectedNodeId === node.id;

                let fillColor = '#1e293b';
                let strokeColor = '#475569';

                if (node.type === 'INPUT_SWITCH') {
                  fillColor = node.state?.switchValue ? '#0284c7' : '#1e293b';
                  strokeColor = '#38bdf8';
                } else if (node.type === 'INPUT_CLOCK') {
                  fillColor = '#78350f';
                  strokeColor = '#f59e0b';
                } else if (node.type === 'OUTPUT_LED' || node.type === 'OUTPUT_PROBE') {
                  const isActive = node.inputs[0]?.value;
                  fillColor = isActive ? '#059669' : '#1e293b';
                  strokeColor = isActive ? '#34d399' : '#475569';
                } else {
                  // Standard gates
                  fillColor = isSelected ? '#0369a1' : '#1e293b';
                  strokeColor = isSelected ? '#38bdf8' : '#334155';
                }

                return (
                  <rect
                    key={node.id}
                    x={nx}
                    y={ny}
                    width={nw}
                    height={nh}
                    rx="2"
                    fill={fillColor}
                    stroke={isSelected ? '#38bdf8' : strokeColor}
                    strokeWidth={isSelected ? '2' : '1'}
                  />
                );
              })}

              {/* Viewport Viewfinder Rectangle */}
              <rect
                x={viewRectX}
                y={viewRectY}
                width={Math.max(10, viewRectWidth)}
                height={Math.max(8, viewRectHeight)}
                fill="rgba(56, 189, 248, 0.12)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray={isNavigating ? 'none' : '3 3'}
                className="transition-all cursor-move pointer-events-none"
              />
            </svg>
          </div>

          {/* Quick Footer Navigation Hint */}
          <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Klik & seret untuk navigasi</span>
            <span className="font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
